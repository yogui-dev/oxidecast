//! Configuración y gestión de sesiones de codificación dual NVIDIA NVENC.
//!
//! Diseñado para tarjetas gráficas modernas como la GeForce RTX 4050,
//! permitiendo la codificación simultánea en tiempo real de dos lienzos:
//! horizontal (16:9) y vertical (9:16) con compresión optimizada por GPU.

use serde::{Deserialize, Serialize};

/// Códecs de video soportados por el codificador acelerado por hardware.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum VideoCodec {
    /// H.264 / AVC - Alta compatibilidad universal con servidores RTMP.
    H264,
    /// H.265 / HEVC - Alta eficiencia para resoluciones superiores y ahorro de ancho de banda.
    HEVC,
    /// AV1 - Códec abierto de próxima generación con compresión de máxima fidelidad.
    AV1,
}

/// Ajustes preestablecidos (presets) de rendimiento y calidad para NVIDIA NVENC.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum EncoderPreset {
    /// Rendimiento máximo / Menor carga en GPU.
    P1,
    /// Rendimiento rápido.
    P2,
    /// Rendimiento balanceado rápido.
    P3,
    /// Preset balanceado estándar (por defecto en producción).
    P4,
    /// Calidad media optimizada.
    P5,
    /// Alta calidad visual.
    P6,
    /// Calidad máxima / Mayor uso de recursos NVENC.
    P7,
    /// Perfil optimizado para baja latencia en transmisiones interactivas.
    LowLatency,
    /// Perfil de máxima calidad para masterización o grabación local.
    HighQuality,
}

/// Parámetros de configuración técnica para una sesión individual de NVENC.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NvencConfig {
    /// Ancho del lienzo en píxeles.
    pub width: u32,
    /// Alto del lienzo en píxeles.
    pub height: u32,
    /// Tasa de fotogramas por segundo (FPS).
    pub fps: u32,
    /// Tasa de bits de video en kilobits por segundo (kbps).
    pub bitrate_kbps: u32,
    /// Tamaño del Grupo de Imágenes (GOP size en fotogramas, p. ej. 120 para 2s a 60fps).
    pub gop_size: u32,
    /// Códec de compresión asignado a la sesión.
    pub codec: VideoCodec,
    /// Preset de codificación seleccionado.
    pub preset: EncoderPreset,
}

impl NvencConfig {
    /// Crea una nueva configuración personalizada para una sesión NVENC.
    pub fn new(
        width: u32,
        height: u32,
        fps: u32,
        bitrate_kbps: u32,
        gop_size: u32,
        codec: VideoCodec,
        preset: EncoderPreset,
    ) -> Self {
        Self {
            width,
            height,
            fps,
            bitrate_kbps,
            gop_size,
            codec,
            preset,
        }
    }

    /// Calcula la relación de aspecto como un valor decimal (ancho / alto).
    pub fn aspect_ratio(&self) -> f32 {
        if self.height == 0 {
            0.0
        } else {
            self.width as f32 / self.height as f32
        }
    }
}

/// Sesión dual de codificación NVENC para transmisión multiplataforma simultánea.
///
/// Gestiona en tándem la codificación del lienzo horizontal (16:9) para plataformas
/// de escritorio y el lienzo vertical (9:16) para plataformas móviles.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NvencDualSession {
    /// Sesión de codificación horizontal (16:9).
    pub horizontal: NvencConfig,
    /// Sesión de codificación vertical (9:16).
    pub vertical: NvencConfig,
}

impl NvencDualSession {
    /// Crea una instancia de sesión dual especificando ambas configuraciones.
    pub fn new(horizontal: NvencConfig, vertical: NvencConfig) -> Self {
        Self {
            horizontal,
            vertical,
        }
    }

    /// Configuración recomendada por defecto optimizada para NVIDIA GeForce RTX 4050:
    /// - Horizontal: 1920x1080 @ 60fps, 6000 kbps, GOP 120, H264, LowLatency.
    /// - Vertical: 1080x1920 @ 60fps, 5000 kbps, GOP 120, H264, LowLatency.
    pub fn default_rtx4050() -> Self {
        Self {
            horizontal: NvencConfig::new(
                1920,
                1080,
                60,
                6000,
                120,
                VideoCodec::H264,
                EncoderPreset::LowLatency,
            ),
            vertical: NvencConfig::new(
                1080,
                1920,
                60,
                5000,
                120,
                VideoCodec::H264,
                EncoderPreset::LowLatency,
            ),
        }
    }

    /// Obtiene la referencia a la configuración de la sesión horizontal (16:9).
    pub fn horizontal_session(&self) -> &NvencConfig {
        &self.horizontal
    }

    /// Obtiene la referencia a la configuración de la sesión vertical (9:16).
    pub fn vertical_session(&self) -> &NvencConfig {
        &self.vertical
    }
}
