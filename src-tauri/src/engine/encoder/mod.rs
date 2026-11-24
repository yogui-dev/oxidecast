//! Módulo de codificación por aceleración de hardware (NVIDIA NVENC).
//!
//! Proporciona tipos y configuraciones para codificar flujos de video
//! en resoluciones horizontal y vertical en paralelo.

pub mod nvenc;

pub use nvenc::{EncoderPreset, NvencConfig, NvencDualSession, VideoCodec};
