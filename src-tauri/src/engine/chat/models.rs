//! Modelos y gestor en memoria para el subsistema de chat omnicanal de OxideCast.

use serde::{Deserialize, Serialize};

/// Plataformas de streaming soportadas para el chat unificado.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ChatPlatform {
    Twitch,
    YouTube,
    TikTok,
    Kick,
    Instagram,
}

impl ChatPlatform {
    /// Nombre para mostrar de la plataforma.
    pub fn display_name(&self) -> &'static str {
        match self {
            ChatPlatform::Twitch => "Twitch",
            ChatPlatform::YouTube => "YouTube",
            ChatPlatform::TikTok => "TikTok",
            ChatPlatform::Kick => "Kick",
            ChatPlatform::Instagram => "Instagram",
        }
    }

    /// Color hexadecimal característico para insignias y UI.
    pub fn color_hex(&self) -> &'static str {
        match self {
            ChatPlatform::Twitch => "#9146FF",
            ChatPlatform::YouTube => "#FF0000",
            ChatPlatform::TikTok => "#00F2FE",
            ChatPlatform::Kick => "#53FC18",
            ChatPlatform::Instagram => "#E1306C",
        }
    }
}

/// Mensaje de chat normalizado e independiente del protocolo de transporte.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub platform: ChatPlatform,
    pub author: String,
    pub content: String,
    pub timestamp: u64,
    pub badges: Vec<String>,
}

impl ChatMessage {
    /// Crea un nuevo mensaje normalizado.
    pub fn new(
        id: impl Into<String>,
        platform: ChatPlatform,
        author: impl Into<String>,
        content: impl Into<String>,
    ) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);

        Self {
            id: id.into(),
            platform,
            author: author.into(),
            content: content.into(),
            timestamp: now,
            badges: Vec::new(),
        }
    }

    /// Añade insignias descriptivas al mensaje (ej. "Moderador", "Suscriptor").
    pub fn with_badges(mut self, badges: Vec<String>) -> Self {
        self.badges = badges;
        self
    }

    /// Sobrescribe el timestamp unix para pruebas o sincronización temporal.
    pub fn with_timestamp(mut self, timestamp: u64) -> Self {
        self.timestamp = timestamp;
        self
    }
}

/// Gestor de chat en memoria con almacenamiento en ring buffer (FIFO) y capacidades de filtrado.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatManager {
    messages: Vec<ChatMessage>,
    max_capacity: usize,
}

impl ChatManager {
    /// Capacidad predeterminada para el buffer de retención (500 mensajes).
    pub const DEFAULT_CAPACITY: usize = 500;

    /// Crea un nuevo `ChatManager` con una capacidad máxima fija.
    pub fn new(max_capacity: usize) -> Self {
        let cap = if max_capacity == 0 { 1 } else { max_capacity };
        Self {
            messages: Vec::with_capacity(cap),
            max_capacity: cap,
        }
    }

    /// Agrega un mensaje al historial. Si se sobrepasa la capacidad máxima,
    /// descarta de forma segura los mensajes más antiguos (política FIFO ring buffer).
    pub fn add_message(&mut self, message: ChatMessage) {
        if self.messages.len() >= self.max_capacity {
            let excess = self.messages.len() - self.max_capacity + 1;
            self.messages.drain(0..excess);
        }
        self.messages.push(message);
    }

    /// Cantidad actual de mensajes retenidos en memoria.
    pub fn len(&self) -> usize {
        self.messages.len()
    }

    /// Retorna `true` si el gestor no contiene mensajes.
    pub fn is_empty(&self) -> bool {
        self.messages.is_empty()
    }

    /// Capacidad máxima configurada en el buffer.
    pub fn capacity(&self) -> usize {
        self.max_capacity
    }

    /// Limpia todos los mensajes del historial.
    pub fn clear(&mut self) {
        self.messages.clear();
    }

    /// Obtiene una vista de todos los mensajes retenidos en memoria.
    pub fn get_messages(&self) -> &[ChatMessage] {
        &self.messages
    }

    /// Filtra los mensajes que pertenecen a una plataforma específica.
    pub fn filter_by_platform(&self, platform: ChatPlatform) -> Vec<&ChatMessage> {
        self.messages
            .iter()
            .filter(|m| m.platform == platform)
            .collect()
    }

    /// Realiza una búsqueda no sensible a mayúsculas/minúsculas en el autor y contenido del mensaje.
    pub fn search(&self, query: &str) -> Vec<&ChatMessage> {
        let q = query.to_lowercase();
        self.messages
            .iter()
            .filter(|m| {
                m.content.to_lowercase().contains(&q) || m.author.to_lowercase().contains(&q)
            })
            .collect()
    }

    /// Filtrado combinado opcional por plataforma y consulta de texto.
    pub fn filter(&self, platform: Option<ChatPlatform>, query: Option<&str>) -> Vec<&ChatMessage> {
        self.messages
            .iter()
            .filter(|m| {
                if let Some(p) = platform {
                    if m.platform != p {
                        return false;
                    }
                }
                if let Some(q) = query {
                    let needle = q.to_lowercase();
                    if !m.content.to_lowercase().contains(&needle)
                        && !m.author.to_lowercase().contains(&needle)
                    {
                        return false;
                    }
                }
                true
            })
            .collect()
    }
}

impl Default for ChatManager {
    fn default() -> Self {
        Self::new(Self::DEFAULT_CAPACITY)
    }
}
