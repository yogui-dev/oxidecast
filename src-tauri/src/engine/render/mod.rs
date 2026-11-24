//! Subsistema de renderizado y composición acelerada por GPU para OxideCast.
//!
//! Proporciona las estructuras de control, destinos de renderizado dual (horizontal 16:9
//! y vertical 9:16), cálculo de coordenadas NDC y shaders WGSL para composición Zero-Copy
//! en memoria de video (VRAM).

pub mod pipeline;

pub use pipeline::{
    get_composite_shader_source, DualRenderTarget, LayerTransform, NormalizedTransform,
    RenderPipelineConfig, ViewportDimensions,
};
