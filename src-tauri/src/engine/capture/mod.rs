//! Subsistema de captura de video nativa con Windows Graphics Capture (WGC API).
//! Provee ingesta de ventanas y pantallas sin inyección de DLLs (anti-cheat safe)
//! y generación de cuadros de respaldo (fallback) ante minimización o cierre.

pub mod wgc;

pub use wgc::{
    CaptureError, CaptureFrame, CaptureManager, CaptureSession, CaptureState, CaptureTarget,
    FallbackFrameGenerator,
};
