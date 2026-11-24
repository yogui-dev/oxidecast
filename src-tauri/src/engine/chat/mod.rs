//! Módulo de chat omnicanal para OxideCast.
//!
//! Provee estructuras normalizadas para interoperar con Twitch, YouTube, TikTok, Kick e Instagram,
//! así como el gestor en memoria `ChatManager`.

pub mod models;

pub use models::{ChatMessage, ChatManager, ChatPlatform};
