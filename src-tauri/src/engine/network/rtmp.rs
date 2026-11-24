//! Distribuidor RTMP asíncrono y gestión de endpoints de transmisión.
//!
//! Permite la multidifusión en memoria de paquetes NAL hacia múltiples destinos
//! RTMP sin sobrecoste de re-codificación, con políticas de reconexión exponencial.

use serde::{Deserialize, Serialize};

/// Plataformas de streaming soportadas para la emisión en vivo.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum StreamPlatform {
    /// YouTube Live (RTMP/RTMPS ingest).
    YouTube,
    /// Twitch (RTMP ingest).
    Twitch,
    /// Kick (RTMP ingest).
    Kick,
    /// TikTok Live (RTMP ingest).
    TikTok,
    /// Instagram Live (RTMP ingest).
    Instagram,
    /// Servidor o relay RTMP personalizado.
    Custom(String),
}

/// Canal de relación de aspecto asignado al flujo y destino.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AspectRatioChannel {
    /// Formato apaisado / horizontal estándar (16:9).
    Horizontal16x9,
    /// Formato vertical para dispositivos móviles (9:16).
    Vertical9x16,
}

/// Destino o endpoint remoto de streaming configurado en OxideCast.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RtmpEndpoint {
    /// Identificador único del endpoint.
    pub id: String,
    /// URL base del servidor RTMP (p. ej. rtmp://a.rtmp.youtube.com/live2).
    pub url: String,
    /// Clave de transmisión secreta (stream key).
    pub stream_key: String,
    /// Plataforma de destino asociada.
    pub platform: StreamPlatform,
    /// Canal de relación de aspecto que recibe este endpoint.
    pub channel: AspectRatioChannel,
    /// Indica si el endpoint está activo para recibir transmisiones.
    pub is_active: bool,
    /// Contador de paquetes despachados a este endpoint.
    pub packets_sent: u64,
    /// Total de bytes despachados a este endpoint.
    pub bytes_sent: u64,
}

impl RtmpEndpoint {
    /// Crea un nuevo endpoint RTMP activo con contadores inicializados en cero.
    pub fn new(
        id: impl Into<String>,
        url: impl Into<String>,
        stream_key: impl Into<String>,
        platform: StreamPlatform,
        channel: AspectRatioChannel,
    ) -> Self {
        Self {
            id: id.into(),
            url: url.into(),
            stream_key: stream_key.into(),
            platform,
            channel,
            is_active: true,
            packets_sent: 0,
            bytes_sent: 0,
        }
    }
}

/// Paquete NAL (Network Abstraction Layer) codificado listo para transmisión.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NalPacket {
    /// Carga útil binaria del paquete codificado (H.264 / H.265 / AV1).
    pub data: Vec<u8>,
    /// Indica si el paquete corresponde a un fotograma clave (Keyframe / IDR).
    pub is_keyframe: bool,
    /// Marca de tiempo de presentación (Presentation Timestamp) en milisegundos.
    pub pts: u64,
    /// Marca de tiempo de decodificación (Decoding Timestamp) en milisegundos.
    pub dts: u64,
    /// Canal de aspecto al cual pertenece el paquete codificado.
    pub channel: AspectRatioChannel,
}

impl NalPacket {
    /// Crea una nueva instancia de paquete NAL.
    pub fn new(
        data: Vec<u8>,
        is_keyframe: bool,
        pts: u64,
        dts: u64,
        channel: AspectRatioChannel,
    ) -> Self {
        Self {
            data,
            is_keyframe,
            pts,
            dts,
            channel,
        }
    }

    /// Retorna el tamaño en bytes de la carga útil del paquete.
    pub fn size(&self) -> usize {
        self.data.len()
    }
}

/// Distribuidor central asíncrono de flujos RTMP.
///
/// Gestiona la lista de endpoints activos, el cálculo de reintentos con backoff
/// exponencial ante micro-cortes, y la emisión en abanico (fan-out) de paquetes
/// NAL sin clonaciones pesadas ni re-codificación.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RtmpDispatcher {
    /// Lista de endpoints de transmisión registrados.
    endpoints: Vec<RtmpEndpoint>,
    /// Tiempo base de reintento en milisegundos (1000ms por defecto).
    base_delay_ms: u64,
    /// Techo máximo de espera en milisegundos (30000ms por defecto).
    max_delay_ms: u64,
    /// Contador total acumulado de paquetes despachados a través de todos los endpoints.
    total_packets_dispatched: u64,
    /// Contador total acumulado de bytes despachados a través de todos los endpoints.
    total_bytes_dispatched: u64,
}

impl Default for RtmpDispatcher {
    fn default() -> Self {
        Self::new()
    }
}

impl RtmpDispatcher {
    /// Inicializa un nuevo despachador RTMP con valores estándar.
    pub fn new() -> Self {
        Self {
            endpoints: Vec::new(),
            base_delay_ms: 1000,
            max_delay_ms: 30000,
            total_packets_dispatched: 0,
            total_bytes_dispatched: 0,
        }
    }

    /// Calcula el retardo de reconexión en milisegundos usando retroceso exponencial:
    /// `retardo = base * 2^(intento - 1)`, saturado al techo máximo (30,000 ms).
    ///
    /// - Intento 1: 1,000 ms
    /// - Intento 2: 2,000 ms
    /// - Intento 3: 4,000 ms
    /// - Intento 4: 8,000 ms
    /// - Intento 5: 16,000 ms
    /// - Intento 6+: 30,000 ms (saturado al máximo)
    pub fn get_reconnect_delay_ms(&self, attempt: u32) -> u64 {
        if attempt <= 1 {
            return self.base_delay_ms;
        }

        let shift = (attempt - 1).min(30);
        let factor = 1u64 << shift;
        let delay = self.base_delay_ms.saturating_mul(factor);
        delay.min(self.max_delay_ms)
    }

    /// Agrega un nuevo endpoint a la lista de destinos de emisión.
    pub fn add_endpoint(&mut self, endpoint: RtmpEndpoint) {
        self.endpoints.push(endpoint);
    }

    /// Remueve un endpoint por su identificador único.
    pub fn remove_endpoint(&mut self, endpoint_id: &str) -> Option<RtmpEndpoint> {
        if let Some(pos) = self.endpoints.iter().position(|ep| ep.id == endpoint_id) {
            Some(self.endpoints.remove(pos))
        } else {
            None
        }
    }

    /// Retorna una referencia inmutable a la lista de todos los endpoints registrados.
    pub fn endpoints(&self) -> &[RtmpEndpoint] {
        &self.endpoints
    }

    /// Retorna una referencia mutable a la lista de todos los endpoints registrados.
    pub fn endpoints_mut(&mut self) -> &mut [RtmpEndpoint] {
        &mut self.endpoints
    }

    /// Filtra y retorna referencias a los endpoints correspondientes a un canal de aspecto específico.
    pub fn endpoints_for_channel(&self, channel: AspectRatioChannel) -> Vec<&RtmpEndpoint> {
        self.endpoints
            .iter()
            .filter(|ep| ep.channel == channel)
            .collect()
    }

    /// Filtra y retorna referencias mutables a los endpoints correspondientes a un canal de aspecto específico.
    pub fn endpoints_for_channel_mut(&mut self, channel: AspectRatioChannel) -> Vec<&mut RtmpEndpoint> {
        self.endpoints
            .iter_mut()
            .filter(|ep| ep.channel == channel)
            .collect()
    }

    /// Despacha un paquete NAL a todos los endpoints activos que coincidan con el canal del paquete.
    ///
    /// Incrementa las estadísticas individuales de cada endpoint y los totales globales.
    /// Retorna la cantidad de endpoints que recibieron el paquete.
    pub fn broadcast_packet(&mut self, packet: &NalPacket) -> usize {
        let packet_size = packet.size() as u64;
        let mut dispatched_count = 0;

        for ep in &mut self.endpoints {
            if ep.is_active && ep.channel == packet.channel {
                ep.packets_sent += 1;
                ep.bytes_sent += packet_size;
                self.total_packets_dispatched += 1;
                self.total_bytes_dispatched += packet_size;
                dispatched_count += 1;
            }
        }

        dispatched_count
    }

    /// Retorna el total acumulado de paquetes despachados a través de todos los destinos.
    pub fn total_packets_dispatched(&self) -> u64 {
        self.total_packets_dispatched
    }

    /// Retorna el total acumulado de bytes despachados a través de todos los destinos.
    pub fn total_bytes_dispatched(&self) -> u64 {
        self.total_bytes_dispatched
    }
}
