// composite.wgsl - Shader de composición dual acelerada por GPU para OxideCast
// Soporta composición Zero-Copy en VRAM con transformación NDC, muestreo UV y mezcla alfa.

struct LayerUniforms {
    transform: mat4x4<f32>,
    opacity: f32,
    _padding: vec3<f32>,
};

struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) opacity: f32,
};

@group(0) @binding(0)
var<uniform> layer_data: LayerUniforms;

@group(0) @binding(1)
var texture_diffuse: texture_2d<f32>;

@group(0) @binding(2)
var texture_sampler: sampler;

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.clip_position = layer_data.transform * vec4<f32>(in.position, 0.0, 1.0);
    out.uv = in.uv;
    out.opacity = layer_data.opacity;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let color = textureSample(texture_diffuse, texture_sampler, in.uv);
    // Mezcla de canal alfa para composición de capas de video
    return vec4<f32>(color.rgb * in.opacity, color.a * in.opacity);
}
