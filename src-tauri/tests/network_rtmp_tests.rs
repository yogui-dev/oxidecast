use oxidecast_lib::engine::encoder::{
    EncoderPreset, NvencConfig, NvencDualSession, VideoCodec,
};
use oxidecast_lib::engine::network::{
    AspectRatioChannel, NalPacket, RtmpDispatcher, RtmpEndpoint, StreamPlatform,
};

#[test]
fn test_rtmp_dispatcher_reconnect_backoff() {
    let dispatcher = RtmpDispatcher::new();

    // Intento 1: 1000ms
    assert_eq!(dispatcher.get_reconnect_delay_ms(1), 1000);
    // Intento 2: 2000ms
    assert_eq!(dispatcher.get_reconnect_delay_ms(2), 2000);
    // Intento 3: 4000ms
    assert_eq!(dispatcher.get_reconnect_delay_ms(3), 4000);
    // Intento 4: 8000ms
    assert_eq!(dispatcher.get_reconnect_delay_ms(4), 8000);
    // Intento 5: 16000ms
    assert_eq!(dispatcher.get_reconnect_delay_ms(5), 16000);
    // Intento 6: 32000ms saturado a 30000ms
    assert_eq!(dispatcher.get_reconnect_delay_ms(6), 30000);
    // Intento 10: techo saturado a 30000ms
    assert_eq!(dispatcher.get_reconnect_delay_ms(10), 30000);
}

#[test]
fn test_rtmp_endpoint_registration_and_filtering() {
    let mut dispatcher = RtmpDispatcher::new();

    let yt_endpoint = RtmpEndpoint::new(
        "ep-yt-1",
        "rtmp://a.rtmp.youtube.com/live2",
        "live_yt_key_123",
        StreamPlatform::YouTube,
        AspectRatioChannel::Horizontal16x9,
    );

    let twitch_endpoint = RtmpEndpoint::new(
        "ep-twitch-1",
        "rtmp://live.twitch.tv/app",
        "live_twitch_key_456",
        StreamPlatform::Twitch,
        AspectRatioChannel::Horizontal16x9,
    );

    let tiktok_endpoint = RtmpEndpoint::new(
        "ep-tiktok-1",
        "rtmp://push-rtmp-l9.tiktokcdn.com/live",
        "live_tiktok_key_789",
        StreamPlatform::TikTok,
        AspectRatioChannel::Vertical9x16,
    );

    dispatcher.add_endpoint(yt_endpoint);
    dispatcher.add_endpoint(twitch_endpoint);
    dispatcher.add_endpoint(tiktok_endpoint);

    assert_eq!(dispatcher.endpoints().len(), 3);

    let horiz_endpoints = dispatcher.endpoints_for_channel(AspectRatioChannel::Horizontal16x9);
    assert_eq!(horiz_endpoints.len(), 2, "Deben existir 2 endpoints 16:9");
    assert!(horiz_endpoints.iter().any(|ep| ep.platform == StreamPlatform::YouTube));
    assert!(horiz_endpoints.iter().any(|ep| ep.platform == StreamPlatform::Twitch));

    let vert_endpoints = dispatcher.endpoints_for_channel(AspectRatioChannel::Vertical9x16);
    assert_eq!(vert_endpoints.len(), 1, "Debe existir 1 endpoint 9:16");
    assert_eq!(vert_endpoints[0].platform, StreamPlatform::TikTok);
}

#[test]
fn test_nvenc_dual_session_configuration() {
    let session = NvencDualSession::default_rtx4050();

    let horiz = session.horizontal_session();
    assert_eq!(horiz.width, 1920, "Ancho horizontal debe ser 1920");
    assert_eq!(horiz.height, 1080, "Alto horizontal debe ser 1080");
    assert_eq!(horiz.bitrate_kbps, 6000, "Bitrate horizontal debe ser 6000 kbps");
    assert_eq!(horiz.fps, 60, "FPS horizontal debe ser 60");
    assert_eq!(horiz.codec, VideoCodec::H264, "Codec horizontal debe ser H264");
    assert_eq!(horiz.preset, EncoderPreset::LowLatency, "Preset horizontal debe ser LowLatency");
    assert_eq!(horiz.gop_size, 120, "GOP horizontal debe ser 120 fotogramas");
    assert!((horiz.aspect_ratio() - (16.0 / 9.0)).abs() < 1e-4, "Relación horizontal debe ser 16:9");

    let vert = session.vertical_session();
    assert_eq!(vert.width, 1080, "Ancho vertical debe ser 1080");
    assert_eq!(vert.height, 1920, "Alto vertical debe ser 1920");
    assert_eq!(vert.bitrate_kbps, 5000, "Bitrate vertical debe ser 5000 kbps");
    assert_eq!(vert.fps, 60, "FPS vertical debe ser 60");
    assert_eq!(vert.codec, VideoCodec::H264, "Codec vertical debe ser H264");
    assert_eq!(vert.preset, EncoderPreset::LowLatency, "Preset vertical debe ser LowLatency");
    assert_eq!(vert.gop_size, 120, "GOP vertical debe ser 120 fotogramas");
    assert!((vert.aspect_ratio() - (9.0 / 16.0)).abs() < 1e-4, "Relación vertical debe ser 9:16");

    // Validar creación de sesión dual personalizada con NvencConfig
    let custom_session = NvencDualSession::new(
        NvencConfig::new(1280, 720, 30, 3000, 60, VideoCodec::HEVC, EncoderPreset::P4),
        NvencConfig::new(720, 1280, 30, 2500, 60, VideoCodec::AV1, EncoderPreset::P5),
    );
    assert_eq!(custom_session.horizontal.codec, VideoCodec::HEVC);
    assert_eq!(custom_session.vertical.codec, VideoCodec::AV1);
}

#[test]
fn test_packet_distribution_dispatch() {
    let mut dispatcher = RtmpDispatcher::new();

    let yt = RtmpEndpoint::new(
        "yt-1",
        "rtmp://a.rtmp.youtube.com/live2",
        "key1",
        StreamPlatform::YouTube,
        AspectRatioChannel::Horizontal16x9,
    );
    let twitch = RtmpEndpoint::new(
        "twitch-1",
        "rtmp://live.twitch.tv/app",
        "key2",
        StreamPlatform::Twitch,
        AspectRatioChannel::Horizontal16x9,
    );
    let tiktok = RtmpEndpoint::new(
        "tiktok-1",
        "rtmp://push-rtmp-l9.tiktokcdn.com/live",
        "key3",
        StreamPlatform::TikTok,
        AspectRatioChannel::Vertical9x16,
    );

    dispatcher.add_endpoint(yt);
    dispatcher.add_endpoint(twitch);
    dispatcher.add_endpoint(tiktok);

    let dummy_h264_payload = vec![0x00, 0x00, 0x00, 0x01, 0x65, 0x88, 0x84, 0x00];
    let packet = NalPacket::new(
        dummy_h264_payload.clone(),
        true,
        1000,
        1000,
        AspectRatioChannel::Horizontal16x9,
    );

    // Despacho a 2 endpoints horizontales activos
    let dispatched_count = dispatcher.broadcast_packet(&packet);
    assert_eq!(dispatched_count, 2, "El paquete debe ser despachado a 2 endpoints 16:9");

    // Verificar contadores de endpoints individuales
    let horiz_eps = dispatcher.endpoints_for_channel(AspectRatioChannel::Horizontal16x9);
    for ep in horiz_eps {
        assert_eq!(ep.packets_sent, 1, "Cada endpoint horizontal debe tener 1 paquete enviado");
        assert_eq!(ep.bytes_sent, dummy_h264_payload.len() as u64);
    }

    let vert_eps = dispatcher.endpoints_for_channel(AspectRatioChannel::Vertical9x16);
    assert_eq!(vert_eps[0].packets_sent, 0, "Endpoint vertical no debe recibir paquetes horizontales");

    // Despachar un segundo paquete horizontal
    let packet_2 = NalPacket::new(
        dummy_h264_payload.clone(),
        false,
        1033,
        1033,
        AspectRatioChannel::Horizontal16x9,
    );
    dispatcher.broadcast_packet(&packet_2);

    assert_eq!(dispatcher.total_packets_dispatched(), 4, "Total de paquetes emitidos acumulados debe ser 4 (2 paquetes x 2 endpoints)");
}
