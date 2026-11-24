//! Pipeline gráfico y configuración de destinos de renderizado dual para OxideCast.
//!
//! Este módulo desacopla la lógica matemática y de configuración de renderizado
//! del hardware GPU subyacente (wgpu / DirectX 12 / Vulkan), permitiendo pruebas
//! unitarias deterministas y composición Zero-Copy VRAM.

use serde::{Deserialize, Serialize};

/// Dimensiones de resolución para un viewport o destino de renderizado.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct ViewportDimensions {
    /// Ancho en píxeles.
    pub width: u32,
    /// Alto en píxeles.
    pub height: u32,
}

impl ViewportDimensions {
    /// Crea una nueva especificación de dimensiones de viewport.
    pub const fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }

    /// Calcula la relación de aspecto (ancho / alto).
    pub fn aspect_ratio(&self) -> f32 {
        if self.height == 0 {
            0.0
        } else {
            self.width as f32 / self.height as f32
        }
    }

    /// Verifica si la relación de aspecto corresponde aproximadamente a 16:9.
    pub fn is_16_9(&self) -> bool {
        (self.aspect_ratio() - (16.0 / 9.0)).abs() < 1e-4
    }

    /// Verifica si la relación de aspecto corresponde aproximadamente a 9:16.
    pub fn is_9_16(&self) -> bool {
        (self.aspect_ratio() - (9.0 / 16.0)).abs() < 1e-4
    }
}

/// Contenedor de destinos de renderizado dual para composición simultánea horizontal y vertical.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DualRenderTarget {
    /// Lienzo horizontal tradicional (habitualmente 16:9 para Twitch / YouTube).
    pub horizontal: ViewportDimensions,
    /// Lienzo vertical para redes sociales (habitualmente 9:16 para TikTok / Shorts / Reels).
    pub vertical: ViewportDimensions,
}

impl DualRenderTarget {
    /// Instancia una configuración personalizada de destinos de renderizado dual.
    pub fn new(horizontal: ViewportDimensions, vertical: ViewportDimensions) -> Self {
        Self {
            horizontal,
            vertical,
        }
    }

    /// Preconfiguración de alta definición estándar:
    /// - Horizontal: 1920×1080 (16:9)
    /// - Vertical: 1080×1920 (9:16)
    pub fn default_hd() -> Self {
        Self {
            horizontal: ViewportDimensions::new(1920, 1080),
            vertical: ViewportDimensions::new(1080, 1920),
        }
    }

    /// Preconfiguración HD 720p:
    /// - Horizontal: 1280×720 (16:9)
    /// - Vertical: 720×1280 (9:16)
    pub fn default_720p() -> Self {
        Self {
            horizontal: ViewportDimensions::new(1280, 720),
            vertical: ViewportDimensions::new(720, 1280),
        }
    }
}

/// Transformación normalizada en coordenadas de dispositivo normalizadas (NDC: `[-1.0, 1.0]`).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct NormalizedTransform {
    /// Coordenada horizontal NDC del extremo izquierdo (`[-1.0, 1.0]`).
    pub x: f32,
    /// Coordenada vertical NDC del extremo superior (`[-1.0, 1.0]`).
    pub y: f32,
    /// Ancho en unidades NDC (donde el ancho total de pantalla es 2.0).
    pub width: f32,
    /// Alto en unidades NDC (donde el alto total de pantalla es 2.0).
    pub height: f32,
}

/// Representa la posición, escala y propiedades visuales de una capa en píxeles.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LayerTransform {
    /// Posición X en píxeles (origen superior-izquierdo).
    pub x: f32,
    /// Posición Y en píxeles (origen superior-izquierdo).
    pub y: f32,
    /// Ancho de la capa en píxeles.
    pub width: f32,
    /// Alto de la capa en píxeles.
    pub height: f32,
    /// Índice de profundidad Z para orden de superposición.
    pub z_index: i32,
    /// Opacidad de la capa en rango `[0.0, 1.0]`.
    pub opacity: f32,
}

impl LayerTransform {
    /// Crea una nueva transformación de capa con opacidad 1.0 y z-index 0.
    pub fn new(x: f32, y: f32, width: f32, height: f32) -> Self {
        Self {
            x,
            y,
            width,
            height,
            z_index: 0,
            opacity: 1.0,
        }
    }

    /// Asigna un índice Z a la capa.
    pub fn with_z_index(mut self, z_index: i32) -> Self {
        self.z_index = z_index;
        self
    }

    /// Asigna la opacidad de la capa acotada a `[0.0, 1.0]`.
    pub fn with_opacity(mut self, opacity: f32) -> Self {
        self.opacity = opacity.clamp(0.0, 1.0);
        self
    }

    /// Normaliza las coordenadas en píxeles a coordenadas de pantalla GPU normalizadas (NDC: `[-1.0, 1.0]`).
    ///
    /// Mapeo de coordenadas:
    /// - En píxeles: `(0, 0)` es la esquina superior izquierda.
    /// - En NDC: `(-1.0, 1.0)` es la esquina superior izquierda y `(1.0, -1.0)` la inferior derecha.
    pub fn normalize_to_ndc(&self, viewport: &ViewportDimensions) -> NormalizedTransform {
        if viewport.width == 0 || viewport.height == 0 {
            return NormalizedTransform {
                x: -1.0,
                y: 1.0,
                width: 0.0,
                height: 0.0,
            };
        }

        let ndc_x = (self.x / viewport.width as f32) * 2.0 - 1.0;
        let ndc_y = 1.0 - (self.y / viewport.height as f32) * 2.0;
        let ndc_width = (self.width / viewport.width as f32) * 2.0;
        let ndc_height = (self.height / viewport.height as f32) * 2.0;

        NormalizedTransform {
            x: ndc_x,
            y: ndc_y,
            width: ndc_width,
            height: ndc_height,
        }
    }

    /// Alias conveniente para normalización NDC.
    pub fn to_ndc(&self, viewport: &ViewportDimensions) -> NormalizedTransform {
        self.normalize_to_ndc(viewport)
    }

    /// Alias conveniente para normalización NDC.
    pub fn normalize(&self, viewport: &ViewportDimensions) -> NormalizedTransform {
        self.normalize_to_ndc(viewport)
    }
}

/// Configuración integral del pipeline de renderizado y composición GPU.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RenderPipelineConfig {
    /// Destinos de renderizado dual (horizontal y vertical).
    pub render_targets: DualRenderTarget,
    /// Cuadros por segundo objetivo para el ciclo de renderizado.
    pub target_fps: u32,
    /// Habilita la composición directa Zero-Copy en VRAM hacia los codificadores NVENC.
    pub enable_zero_copy: bool,
    /// Formato de textura de color (ej. "Bgra8UnormSrgb" o "Rgba8Unorm").
    pub color_format: String,
}

impl RenderPipelineConfig {
    /// Crea una nueva configuración personalizada de pipeline.
    pub fn new(
        render_targets: DualRenderTarget,
        target_fps: u32,
        enable_zero_copy: bool,
        color_format: impl Into<String>,
    ) -> Self {
        Self {
            render_targets,
            target_fps,
            enable_zero_copy,
            color_format: color_format.into(),
        }
    }

    /// Preset de producción Full HD a 60 fps con Zero-Copy VRAM habilitado:
    /// - Horizontal: 1920×1080 (16:9)
    /// - Vertical: 1080×1920 (9:16)
    pub fn full_hd_60fps() -> Self {
        Self {
            render_targets: DualRenderTarget::default_hd(),
            target_fps: 60,
            enable_zero_copy: true,
            color_format: "Bgra8UnormSrgb".to_string(),
        }
    }

    /// Preset alternativo HD 720p a 60 fps con Zero-Copy VRAM habilitado:
    /// - Horizontal: 1280×720 (16:9)
    /// - Vertical: 720×1280 (9:16)
    pub fn hd_720p_60fps() -> Self {
        Self {
            render_targets: DualRenderTarget::default_720p(),
            target_fps: 60,
            enable_zero_copy: true,
            color_format: "Bgra8UnormSrgb".to_string(),
        }
    }

    /// Alias de compatibilidad para preset 1080p a 60fps.
    pub fn preset_1080p60() -> Self {
        Self::full_hd_60fps()
    }

    /// Alias de compatibilidad para preset 720p a 60fps.
    pub fn preset_720p60() -> Self {
        Self::hd_720p_60fps()
    }
}

impl Default for RenderPipelineConfig {
    fn default() -> Self {
        Self::full_hd_60fps()
    }
}

/// Obtiene el código fuente del shader WGSL de composición embebido en tiempo de compilación.
pub fn get_composite_shader_source() -> &'static str {
    include_str!("shaders/composite.wgsl")
}
