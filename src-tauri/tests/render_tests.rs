use oxidecast_lib::engine::render::{
    get_composite_shader_source, DualRenderTarget, LayerTransform, RenderPipelineConfig,
    ViewportDimensions,
};

#[test]
fn test_dual_render_targets_dimensions() {
    let targets = DualRenderTarget::default_hd();

    assert_eq!(
        targets.horizontal.width, 1920,
        "El lienzo horizontal debe tener 1920 de ancho"
    );
    assert_eq!(
        targets.horizontal.height, 1080,
        "El lienzo horizontal debe tener 1080 de alto"
    );
    assert_eq!(
        targets.vertical.width, 1080,
        "El lienzo vertical debe tener 1080 de ancho"
    );
    assert_eq!(
        targets.vertical.height, 1920,
        "El lienzo vertical debe tener 1920 de alto"
    );
}

#[test]
fn test_layer_transform_normalization() {
    let viewport = ViewportDimensions::new(1920, 1080);

    // Capa de pantalla completa (0, 0, 1920, 1080)
    let full_layer = LayerTransform::new(0.0, 0.0, 1920.0, 1080.0);
    let full_ndc = full_layer.normalize_to_ndc(&viewport);

    // En NDC, la esquina superior izquierda es (-1.0, 1.0) y cubre ancho 2.0 y alto 2.0
    assert!(
        (full_ndc.x - (-1.0)).abs() < 1e-5,
        "NDC X de esquina izquierda debe ser -1.0"
    );
    assert!(
        (full_ndc.y - 1.0).abs() < 1e-5,
        "NDC Y de esquina superior debe ser 1.0"
    );
    assert!(
        (full_ndc.width - 2.0).abs() < 1e-5,
        "NDC Width debe ser 2.0"
    );
    assert!(
        (full_ndc.height - 2.0).abs() < 1e-5,
        "NDC Height debe ser 2.0"
    );

    // Capa centrada de 960x540 posicionada en (480, 270)
    let center_layer = LayerTransform::new(480.0, 270.0, 960.0, 540.0);
    let center_ndc = center_layer.normalize_to_ndc(&viewport);

    assert!(
        (center_ndc.x - (-0.5)).abs() < 1e-5,
        "NDC X centrado debe ser -0.5"
    );
    assert!(
        (center_ndc.y - 0.5).abs() < 1e-5,
        "NDC Y centrado debe ser 0.5"
    );
    assert!(
        (center_ndc.width - 1.0).abs() < 1e-5,
        "NDC Width centrado debe ser 1.0"
    );
    assert!(
        (center_ndc.height - 1.0).abs() < 1e-5,
        "NDC Height centrado debe ser 1.0"
    );
}

#[test]
fn test_composite_shader_source_validity() {
    let shader_source = get_composite_shader_source();

    assert!(
        !shader_source.is_empty(),
        "El código fuente del shader no debe estar vacío"
    );
    assert!(
        shader_source.contains("vs_main"),
        "El shader debe contener el punto de entrada vs_main"
    );
    assert!(
        shader_source.contains("fs_main"),
        "El shader debe contener el punto de entrada fs_main"
    );
    assert!(
        shader_source.contains("struct VertexOutput"),
        "El shader debe definir la estructura VertexOutput"
    );
}

#[test]
fn test_render_pipeline_config_presets() {
    // Preset Full HD 60fps
    let fhd_config = RenderPipelineConfig::full_hd_60fps();
    assert_eq!(
        fhd_config.target_fps, 60,
        "FHD debe tener objetivo de 60 fps"
    );
    assert_eq!(fhd_config.render_targets.horizontal.width, 1920);
    assert_eq!(fhd_config.render_targets.horizontal.height, 1080);
    assert_eq!(fhd_config.render_targets.vertical.width, 1080);
    assert_eq!(fhd_config.render_targets.vertical.height, 1920);

    // Validación de relaciones de aspecto 16:9 y 9:16
    let fhd_horiz_ratio = fhd_config.render_targets.horizontal.aspect_ratio();
    let fhd_vert_ratio = fhd_config.render_targets.vertical.aspect_ratio();
    assert!(
        (fhd_horiz_ratio - (16.0 / 9.0)).abs() < 1e-4,
        "Lienzo horizontal debe tener relación 16:9"
    );
    assert!(
        (fhd_vert_ratio - (9.0 / 16.0)).abs() < 1e-4,
        "Lienzo vertical debe tener relación 9:16"
    );

    // Preset 720p 60fps
    let hd_config = RenderPipelineConfig::hd_720p_60fps();
    assert_eq!(
        hd_config.target_fps, 60,
        "720p debe tener objetivo de 60 fps"
    );
    assert_eq!(hd_config.render_targets.horizontal.width, 1280);
    assert_eq!(hd_config.render_targets.horizontal.height, 720);
    assert_eq!(hd_config.render_targets.vertical.width, 720);
    assert_eq!(hd_config.render_targets.vertical.height, 1280);

    let hd_horiz_ratio = hd_config.render_targets.horizontal.aspect_ratio();
    let hd_vert_ratio = hd_config.render_targets.vertical.aspect_ratio();
    assert!(
        (hd_horiz_ratio - (16.0 / 9.0)).abs() < 1e-4,
        "Lienzo horizontal 720p debe tener relación 16:9"
    );
    assert!(
        (hd_vert_ratio - (9.0 / 16.0)).abs() < 1e-4,
        "Lienzo vertical 720p debe tener relación 9:16"
    );
}
