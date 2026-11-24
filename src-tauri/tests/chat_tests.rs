use oxidecast_lib::engine::chat::{ChatMessage, ChatManager, ChatPlatform};

#[test]
fn test_chat_message_normalization() {
    let msg = ChatMessage::new(
        "msg-101",
        ChatPlatform::Twitch,
        "AlexStreamer",
        "¡Hola a todos en el stream!",
    );

    assert_eq!(msg.id, "msg-101");
    assert_eq!(msg.platform, ChatPlatform::Twitch);
    assert_eq!(msg.author, "AlexStreamer");
    assert_eq!(msg.content, "¡Hola a todos en el stream!");
    assert_eq!(msg.platform.display_name(), "Twitch");

    // Probar serialización JSON con serde
    let serialized = serde_json::to_string(&msg).expect("Debe serializar a JSON");
    assert!(serialized.contains("AlexStreamer"));
    assert!(serialized.contains("Twitch"));

    let deserialized: ChatMessage =
        serde_json::from_str(&serialized).expect("Debe deserializar de JSON");
    assert_eq!(deserialized, msg);
}

#[test]
fn test_chat_manager_filtering_and_search() {
    let mut manager = ChatManager::new(100);

    let m1 = ChatMessage::new("1", ChatPlatform::Twitch, "TwitchUser", "Gran calidad de video");
    let m2 = ChatMessage::new("2", ChatPlatform::YouTube, "YTViewer", "Saludos desde Chile con Rust");
    let m3 = ChatMessage::new("3", ChatPlatform::TikTok, "TikToker", "Increíble setup dual vertical");
    let m4 = ChatMessage::new("4", ChatPlatform::Kick, "KickBro", "Excelente bitrate y latencia");
    let m5 = ChatMessage::new("5", ChatPlatform::Instagram, "IGFan", "Me encanta la transmisión");

    manager.add_message(m1);
    manager.add_message(m2);
    manager.add_message(m3);
    manager.add_message(m4);
    manager.add_message(m5);

    assert_eq!(manager.len(), 5);

    // Filtrado por plataforma
    let twitch_msgs = manager.filter_by_platform(ChatPlatform::Twitch);
    assert_eq!(twitch_msgs.len(), 1);
    assert_eq!(twitch_msgs[0].author, "TwitchUser");

    let yt_msgs = manager.filter_by_platform(ChatPlatform::YouTube);
    assert_eq!(yt_msgs.len(), 1);
    assert_eq!(yt_msgs[0].author, "YTViewer");

    // Búsqueda por palabra clave (case-insensitive)
    let search_rust = manager.search("rust");
    assert_eq!(search_rust.len(), 1);
    assert_eq!(search_rust[0].id, "2");

    let search_all = manager.search("e"); // coincide con varios mensajes
    assert!(search_all.len() >= 3);
}

#[test]
fn test_chat_manager_ring_buffer_limit() {
    let capacity = 500;
    let mut manager = ChatManager::new(capacity);

    // Insertar 600 mensajes para superar la capacidad de 500
    for i in 0..600 {
        manager.add_message(ChatMessage::new(
            format!("msg-{}", i),
            ChatPlatform::Twitch,
            format!("User{}", i),
            format!("Mensaje número {}", i),
        ));
    }

    // El ring buffer debe tener exactamente la capacidad límite de 500
    assert_eq!(manager.len(), capacity);

    // El primer mensaje debe ser el mensaje 100 (los 0..99 se descartaron en orden FIFO)
    let messages = manager.get_messages();
    assert_eq!(messages.first().unwrap().id, "msg-100");
    assert_eq!(messages.last().unwrap().id, "msg-599");
}
