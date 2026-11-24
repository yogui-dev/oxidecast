//! Módulo de red y distribución asíncrona RTMP.
//!
//! Contiene el despachador de paquetes de video hacia servidores remotos
//! de transmisión en vivo (YouTube, Twitch, TikTok, etc.).

pub mod rtmp;

pub use rtmp::{AspectRatioChannel, NalPacket, RtmpDispatcher, RtmpEndpoint, StreamPlatform};
