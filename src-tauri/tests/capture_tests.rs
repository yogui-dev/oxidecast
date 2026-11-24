use oxidecast_lib::engine::capture::{
    CaptureError, CaptureFrame, CaptureManager, CaptureSession, CaptureState, CaptureTarget,
    FallbackFrameGenerator,
};

#[test]
fn test_capture_manager_fallback_on_invalid_target() {
    let manager = CaptureManager::new();
    let result = manager.create_session("VentanaInexistenteQueNoDebeExistir_12345");

    assert!(result.is_err(), "Debe fallar al buscar una ventana inexistente");
    assert_eq!(
        result.unwrap_err(),
        CaptureError::TargetWindowNotFound,
        "El error debe ser TargetWindowNotFound"
    );
}

#[test]
fn test_capture_manager_lists_mock_targets() {
    let mut manager = CaptureManager::new();
    let target1 = CaptureTarget::new("win_1", "Valorant", 1920, 1080);
    let target2 = CaptureTarget::new("win_2", "OBS Studio", 1920, 1080);

    manager.register_target(target1.clone());
    manager.register_target(target2.clone());

    let targets = manager.list_targets();
    assert_eq!(targets.len(), 2, "Deben haberse registrado 2 objetivos");
    assert!(targets.contains(&target1), "Debe contener el objetivo Valorant");
    assert!(targets.contains(&target2), "Debe contener el objetivo OBS Studio");
}

#[test]
fn test_fallback_frame_generator() {
    let frame: CaptureFrame = FallbackFrameGenerator::generate(1920, 1080);

    assert_eq!(frame.width, 1920, "El ancho del frame de respaldo debe ser 1920");
    assert_eq!(frame.height, 1080, "El alto del frame de respaldo debe ser 1080");
    // RGBA: 1920 * 1080 * 4 = 8,294,400 bytes
    assert_eq!(
        frame.data.len(),
        8_294_400,
        "El tamaño del búfer RGBA debe ser exactamente 8,294,400 bytes"
    );
}

#[test]
fn test_capture_session_lifecycle() {
    let mut manager = CaptureManager::new();
    let target = CaptureTarget::new("win_game", "League of Legends", 1920, 1080);
    manager.register_target(target);

    let mut session: CaptureSession = manager
        .create_session("League of Legends")
        .expect("Debe crear la sesión para un objetivo existente");

    assert_eq!(
        session.state(),
        CaptureState::Capturing,
        "La sesión debe inicializarse en estado Capturing"
    );

    session
        .stop()
        .expect("Detener la sesión debe completarse sin errores");

    assert_eq!(
        session.state(),
        CaptureState::Stopped,
        "El estado de la sesión debe ser Stopped tras invocar stop()"
    );
}
