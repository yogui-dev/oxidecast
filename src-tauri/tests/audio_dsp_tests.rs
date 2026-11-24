use oxidecast_lib::engine::audio::{AudioDspProcessor, NoiseGate, PeakLimiter};

#[test]
fn test_peak_limiter_clamps_oversaturated_signal() {
    let mut limiter = PeakLimiter::new(-1.0);
    let mut buffer = vec![1.5, 2.0, -1.8, 0.5];

    limiter.process(&mut buffer);

    let ceiling_linear = 10.0f32.powf(-1.0 / 20.0); // ~0.8912509
    for &sample in &buffer {
        assert!(
            sample <= 0.8913 && sample >= -0.8913,
            "Muestra {sample} excede el techo permitido de -1.0 dBFS (+/- 0.8913)"
        );
    }

    assert!((buffer[0] - ceiling_linear).abs() < 1e-4_f32);
    assert!((buffer[1] - ceiling_linear).abs() < 1e-4_f32);
    assert!((buffer[2] - (-ceiling_linear)).abs() < 1e-4_f32);
    assert!((buffer[3] - 0.5_f32).abs() < 1e-4_f32);
}

#[test]
fn test_noise_gate_mutes_background_hum() {
    let mut gate = NoiseGate::new(-45.0);
    // 0.001 lineal equivale a aprox -60 dBFS (por debajo del umbral de -45 dBFS)
    let mut buffer = vec![0.001, -0.001, 0.0005, -0.0008];

    gate.process(&mut buffer);

    for &sample in &buffer {
        assert_eq!(sample, 0.0, "La muestra de ruido de fondo debió ser silenciada a 0.0");
    }
}

#[test]
fn test_noise_gate_preserves_voice_signal() {
    let mut gate = NoiseGate::new(-45.0);
    // 0.5 lineal equivale a aprox -6 dBFS (muy por encima del umbral de -45 dBFS)
    let original = vec![0.5, -0.4, 0.2, -0.15];
    let mut buffer = original.clone();

    gate.process(&mut buffer);

    assert_eq!(buffer, original, "La señal de voz por encima del umbral debe pasar inalterada");
}

#[test]
fn test_audio_dsp_processor_pipeline() {
    let gate = NoiseGate::new(-45.0);
    let limiter = PeakLimiter::new(-1.0);
    let mut processor = AudioDspProcessor::new(gate, limiter);

    // Entrada mixta:
    // buffer[0]: ruido tenue 0.001 (~ -60 dBFS) -> silenciado a 0.0
    // buffer[1]: voz limpia 0.5 (~ -6 dBFS) -> pasa intacta a 0.5
    // buffer[2]: pico saturado 1.8 -> pasa puerta, pero se clampa a ~0.89125
    // buffer[3]: ruido negativo -0.0005 -> silenciado a 0.0
    // buffer[4]: pico saturado negativo -1.5 -> clampa a -0.89125
    // buffer[5]: voz limpia 0.3 -> pasa intacta
    let mut buffer = vec![0.001, 0.5, 1.8, -0.0005, -1.5, 0.3];

    processor.process(&mut buffer);

    let ceiling_linear = 10.0f32.powf(-1.0 / 20.0);

    assert_eq!(buffer[0], 0.0, "buffer[0] debió ser silenciado por la puerta");
    assert!((buffer[1] - 0.5_f32).abs() < 1e-4_f32, "buffer[1] debió mantenerse intacto");
    assert!((buffer[2] - ceiling_linear).abs() < 1e-4_f32, "buffer[2] debió ser limitado");
    assert_eq!(buffer[3], 0.0_f32, "buffer[3] debió ser silenciado por la puerta");
    assert!((buffer[4] - (-ceiling_linear)).abs() < 1e-4_f32, "buffer[4] debió ser limitado negativamente");
    assert!((buffer[5] - 0.3_f32).abs() < 1e-4_f32, "buffer[5] debió mantenerse intacto");
}
