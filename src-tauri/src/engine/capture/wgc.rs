//! Implementación del motor de captura nativo basado en Windows Graphics Capture (WGC).
//!
//! Diseñado para capturar ventanas y pantallas de manera no invasiva, cumpliendo con los
//! requerimientos de juegos con sistemas anti-trampas estrictos (Riot Vanguard, EAC, BattlEye).
//! Incluye tolerancia a fallos mediante generadores de cuadros de reemplazo (standby) en caso
//! de minimización, pérdida de foco o desconexión del objetivo.

use std::fmt;

/// Errores posibles durante el ciclo de vida de la captura.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum CaptureError {
    /// La ventana u objetivo especificado no existe o no pudo ser localizada en el sistema operativo.
    TargetWindowNotFound,
    /// Ya existe una sesión de captura activa en el objetivo seleccionado.
    SessionAlreadyActive,
    /// Pérdida del dispositivo gráfico o reinicio del contexto DirectX (GPU reset).
    DeviceLost,
    /// Acceso denegado o contenido protegido por DRM/HDCP.
    AccessDenied,
    /// Fallo general o no recuperable durante la captura de cuadros.
    CaptureFailed(String),
}

impl fmt::Display for CaptureError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::TargetWindowNotFound => write!(f, "Ventana u objetivo de captura no encontrado"),
            Self::SessionAlreadyActive => write!(f, "Ya existe una sesión de captura activa para este objetivo"),
            Self::DeviceLost => write!(f, "Dispositivo gráfico perdido o reiniciado por el sistema"),
            Self::AccessDenied => write!(f, "Acceso denegado al objetivo o contenido protegido"),
            Self::CaptureFailed(msg) => write!(f, "Fallo durante la captura de cuadros: {msg}"),
        }
    }
}

impl std::error::Error for CaptureError {}

/// Estados posibles de una sesión de captura de video.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum CaptureState {
    /// Captura en curso y emitiendo cuadros en tiempo real.
    Capturing,
    /// Captura pausada temporalmente.
    Paused,
    /// Captura detenida deliberadamente.
    Stopped,
    /// Estado de emergencia o reserva emitiendo cuadros de respaldo (`FallbackFrame`).
    Fallback,
}

/// Representación tipada de una ventana o monitor disponible para captura.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct CaptureTarget {
    /// Identificador único del objetivo (HWND en Windows o ID de monitor).
    pub id: String,
    /// Título descriptivo de la ventana o nombre del display.
    pub title: String,
    /// Ancho nativo en píxeles.
    pub width: u32,
    /// Alto nativo en píxeles.
    pub height: u32,
}

impl CaptureTarget {
    /// Crea un nuevo objetivo de captura.
    pub fn new(id: impl Into<String>, title: impl Into<String>, width: u32, height: u32) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            width,
            height,
        }
    }
}

/// Cuadro de video en memoria sin comprimir (formato RGBA 32-bit).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CaptureFrame {
    /// Ancho del cuadro en píxeles.
    pub width: u32,
    /// Alto del cuadro en píxeles.
    pub height: u32,
    /// Búfer de píxeles RGBA (tamaño exacto: `width * height * 4` bytes).
    pub data: Vec<u8>,
}

impl CaptureFrame {
    /// Crea un nuevo cuadro con las dimensiones y datos especificados.
    pub fn new(width: u32, height: u32, data: Vec<u8>) -> Self {
        Self { width, height, data }
    }
}

/// Generador de cuadros de respaldo o espera (*standby*).
///
/// Si la ventana del juego se minimiza, pierde el foco o se cierra inesperadamente,
/// este componente suministra cuadros RGBA válidos para evitar la desincronización o
/// caída del codificador NVENC/QuickSync y mantener vivo el stream RTMP/WebRTC.
#[derive(Debug, Clone, Default)]
pub struct FallbackFrameGenerator;

impl FallbackFrameGenerator {
    /// Genera un cuadro de respaldo en negro opaco (RGBA: 0, 0, 0, 255)
    /// con las dimensiones solicitadas.
    pub fn generate(width: u32, height: u32) -> CaptureFrame {
        let size = (width * height * 4) as usize;
        let mut data = vec![0u8; size];
        // Asignar canal alfa a 255 (totalmente opaco)
        for chunk in data.chunks_exact_mut(4) {
            chunk[3] = 255;
        }

        CaptureFrame { width, height, data }
    }

    /// Método de instancia ergonómico para generación de cuadros.
    pub fn generate_frame(&self, width: u32, height: u32) -> CaptureFrame {
        Self::generate(width, height)
    }
}

/// Sesión activa de captura asociada a un objetivo específico.
#[derive(Debug, Clone)]
pub struct CaptureSession {
    target: CaptureTarget,
    state: CaptureState,
}

impl CaptureSession {
    /// Crea una nueva sesión iniciando inmediatamente en estado `Capturing`.
    pub fn new(target: CaptureTarget) -> Self {
        Self {
            target,
            state: CaptureState::Capturing,
        }
    }

    /// Retorna el estado actual de la sesión.
    pub fn state(&self) -> CaptureState {
        self.state
    }

    /// Retorna una referencia al objetivo de la sesión.
    pub fn target(&self) -> &CaptureTarget {
        &self.target
    }

    /// Detiene la sesión de captura y libera los recursos asociados.
    pub fn stop(&mut self) -> Result<(), CaptureError> {
        self.state = CaptureState::Stopped;
        Ok(())
    }

    /// Pausa la captura de cuadros.
    pub fn pause(&mut self) -> Result<(), CaptureError> {
        self.state = CaptureState::Paused;
        Ok(())
    }

    /// Reanuda la captura de cuadros.
    pub fn resume(&mut self) -> Result<(), CaptureError> {
        self.state = CaptureState::Capturing;
        Ok(())
    }

    /// Cambia el estado a Fallback cuando se pierde temporalmente la señal del objetivo.
    pub fn enter_fallback(&mut self) {
        self.state = CaptureState::Fallback;
    }
}

/// Administrador central del subsistema de captura WGC.
///
/// Gestiona la enumeración de ventanas y monitores, el registro de objetivos
/// y la instanciación de sesiones de captura controladas.
#[derive(Debug, Clone, Default)]
pub struct CaptureManager {
    targets: Vec<CaptureTarget>,
}

impl CaptureManager {
    /// Crea una nueva instancia del gestor de captura.
    pub fn new() -> Self {
        Self {
            targets: Vec::new(),
        }
    }

    /// Registra un objetivo disponible para captura.
    pub fn register_target(&mut self, target: CaptureTarget) {
        self.targets.push(target);
    }

    /// Lista todos los objetivos actualmente detectados o registrados.
    pub fn list_targets(&self) -> Vec<CaptureTarget> {
        self.targets.clone()
    }

    /// Crea e inicializa una sesión de captura para el objetivo cuyo título coincida.
    /// Si el objetivo no existe, retorna `Err(CaptureError::TargetWindowNotFound)`.
    pub fn create_session(&self, target_title: &str) -> Result<CaptureSession, CaptureError> {
        let target = self
            .targets
            .iter()
            .find(|t| t.title == target_title)
            .ok_or(CaptureError::TargetWindowNotFound)?;

        Ok(CaptureSession::new(target.clone()))
    }
}
