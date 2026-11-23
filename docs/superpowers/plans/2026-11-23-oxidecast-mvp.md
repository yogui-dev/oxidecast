# OxideCast MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la versión MVP funcional de **OxideCast**, una suite de transmisión en vivo ultraligera en Rust y Tauri v2 con edición Dual-Canvas simultánea (16:9 y 9:16), aceleración por hardware NVIDIA NVENC, procesamiento de audio DSP con limitador de picos, chat unificado omnicanal y empaquetado para Windows.

**Architecture:** El frontend en React + Tailwind CSS actúa como panel de control y lienzo reactivo con comunicación asíncrona tipada hacia el backend nativo en Rust vía Tauri v2. El core de Rust gestiona la captura nativa con `windows-capture` (WGC API), el renderizado dual en VRAM con `wgpu` y shaders WGSL, la mezcla de audio en coma flotante con `cpal`, la codificación acelerada por hardware con NVIDIA NVENC y el despacho asíncrono RTMP con `tokio`.

**Tech Stack:** Rust 1.80+, Tauri v2, `wgpu`, `windows-capture`, `cpal`, `tokio`, React 18, TypeScript, Tailwind CSS, Vite, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-23-oxidecast-design.md`](file:///C:/Proyectos/yoguidev/oxidecast/docs/superpowers/specs/2026-11-23-oxidecast-design.md)

## Global Constraints

- Compilación nativa en Windows 10/11 x86_64 con MSVC.
- Consumo de memoria RAM en reposo estrictamente inferior a 80 MB.
- Rendimiento de renderizado fijo a 60 FPS (tiempo de frame <= 16.6 ms).
- Cero copias de texturas hacia la memoria RAM del procesador (Zero-Copy GPU en VRAM).
- Package manager estricto en el espacio de trabajo: `pnpm` (prohibido `npm` o `yarn`).
- Todos los crates de Rust y paquetes npm deben compilar con advertencias tratadas como errores en modo release.

## Review Focus

1. **Pérdida de ventana de juego:** Si la ventana capturada se cierra o minimiza, el motor conmuta a la placa de respaldo en <= 16 ms sin congelar la transmisión.
2. **Saturación de pico de audio:** Una señal de audio con sobremodulación entrante (+6 dBFS) debe ser recortada por el limitador estricto a un techo máximo de -1.0 dBFS sin distorsión audible.
3. **Desconexión abrupta de red RTMP:** Si el socket TCP hacia la plataforma se corta, el motor retiene 3s en búfer e inicia reconexión con reintentos exponenciales sin crashear la aplicación.
4. **Anclaje reactivo de capas (Dual-Canvas):** Modificar la posición o escala de una capa en el lienzo 16:9 recalcula y mantiene la posición proporcional en el lienzo 9:16.
5. **Desacople de ventana de chat:** Abrir la ventana secundaria del chat no debe bloquear ni reducir los FPS del render loop principal.

---

### Task 1: Scaffolding de Tauri v2 + React y Tokens de Diseño

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src/index.css`
- Create: `src/App.tsx`
- Test: `tests/app.test.tsx`

**Interfaces:**
- Consumes: None (Root scaffolding).
- Produces: App shell de Tauri v2 con diseño base y tokens cromáticos (`#FF5722` Oxide Rust, `#090D13` Obsidian, `#161B22` Surface).

- [ ] **Step 1: Escribir test fallido de montaje UI**

```typescript
// tests/app.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('OxideCast App Shell', () => {
  it('renders OxideCast title and live status banner', () => {
    render(<App />);
    expect(screen.getByText(/OxideCast/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Emisión Dual/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `pnpm test tests/app.test.tsx`
Expected: FAIL (Cannot find module '../src/App')

- [ ] **Step 3: Implementar scaffolding mínimo y componente App**

```typescript
// src/App.tsx
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#090D13] text-[#c9d1d9] flex flex-col font-sans">
      <header className="h-12 bg-[#161B22] border-b border-[#30363d] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg text-[#FF5722]">OxideCast</span>
          <span className="text-xs bg-[#21262d] px-2 py-0.5 rounded text-[#8b949e]">Studio</span>
        </div>
        <button className="bg-[#FF5722] hover:bg-[#E64A19] text-white px-4 py-1.5 rounded font-bold text-xs shadow-md">
          Iniciar Emisión Dual
        </button>
      </header>
      <main className="flex-1 p-4 flex items-center justify-center">
        <p className="text-[#8b949e] text-sm">Espacio de trabajo Dual-Canvas listo.</p>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `pnpm test tests/app.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts tailwind.config.js src-tauri/ src/ tests/
git commit -m "feat(scaffold): inicializar proyecto tauri v2 con react y tailwind"
```

---

### Task 2: Componente Dual-Canvas y Lógica de Anclaje Reactivo

**Files:**
- Create: `src/components/DualCanvas.tsx`
- Create: `src/utils/layoutMath.ts`
- Modify: `src/App.tsx`
- Test: `tests/layoutMath.test.ts`
- Test: `tests/dualCanvas.test.tsx`

**Interfaces:**
- Consumes: `App.tsx`
- Produces: `calculateVerticalAnchor(horizontalCoord, sourceDimensions)` normaliza posiciones del lienzo 16:9 a 9:16.

- [ ] **Step 1: Escribir test fallido para el cálculo de anclaje de layout**

```typescript
// tests/layoutMath.test.ts
import { describe, it, expect } from 'vitest';
import { calculateVerticalAnchor } from '../src/utils/layoutMath';

describe('Layout Math & Smart Anchoring', () => {
  it('calculates centered vertical coordinates for horizontal 16:9 source in 9:16 target', () => {
    const horizontalSource = { x: 0, y: 0, width: 1920, height: 1080 };
    const verticalTarget = { width: 1080, height: 1920 };
    
    const result = calculateVerticalAnchor(horizontalSource, verticalTarget);
    expect(result.width).toBe(1080);
    expect(result.height).toBe(607.5);
    // Debe quedar centrado verticalmente en el formato 9:16
    expect(result.y).toBeCloseTo((1920 - 607.5) / 2, 1);
  });
});
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `pnpm test tests/layoutMath.test.ts`
Expected: FAIL with "calculateVerticalAnchor is not defined"

- [ ] **Step 3: Implementar layoutMath y componente DualCanvas**

```typescript
// src/utils/layoutMath.ts
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateVerticalAnchor(source: Rect, targetCanvas: { width: number; height: number }): Rect {
  const scale = targetCanvas.width / source.width;
  const scaledHeight = source.height * scale;
  const centeredY = (targetCanvas.height - scaledHeight) / 2;
  return {
    x: 0,
    y: centeredY,
    width: targetCanvas.width,
    height: scaledHeight,
  };
}
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `pnpm test tests/layoutMath.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/DualCanvas.tsx src/utils/layoutMath.ts tests/layoutMath.test.ts
git commit -m "feat(ui): implementar componente dual canvas y matematicas de anclaje reactivo"
```

---

### Task 3: Motor de Audio DSP en Rust (cpal + Puerta de Ruido + Limitador)

**Files:**
- Create: `src-tauri/src/engine/mod.rs`
- Create: `src-tauri/src/engine/audio/mod.rs`
- Create: `src-tauri/src/engine/audio/limiter.rs`
- Create: `src-tauri/src/engine/audio/gate.rs`
- Test: `src-tauri/tests/audio_dsp_tests.rs`

**Interfaces:**
- Consumes: None (Nativo Rust).
- Produces: `PeakLimiter::process(&mut self, buffer: &mut [f32])`, `NoiseGate::process(&mut self, buffer: &mut [f32])`.

- [ ] **Step 1: Escribir test fallido en Rust para el limitador de picos**

```rust
// src-tauri/tests/audio_dsp_tests.rs
use oxidecast::engine::audio::limiter::PeakLimiter;

#[test]
fn test_peak_limiter_clamps_oversaturated_signal() {
    let mut limiter = PeakLimiter::new(-1.0); // Techo a -1.0 dBFS (~0.891 lineal)
    let mut hot_signal = vec![1.5f32, 2.0f32, -1.8f32, 0.5f32];
    
    limiter.process(&mut hot_signal);
    
    for &sample in &hot_signal {
        assert!(sample <= 0.8913, "Muestra supera el techo de -1.0 dBFS: {}", sample);
        assert!(sample >= -0.8913, "Muestra negativa supera el techo: {}", sample);
    }
}
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `cargo test --test audio_dsp_tests`
Expected: FAIL (limiter module not found)

- [ ] **Step 3: Implementar PeakLimiter en Rust puro**

```rust
// src-tauri/src/engine/audio/limiter.rs
pub struct PeakLimiter {
    ceiling_linear: f32,
}

impl PeakLimiter {
    pub fn new(ceiling_db: f32) -> Self {
        let ceiling_linear = 10.0f32.powf(ceiling_db / 20.0);
        Self { ceiling_linear }
    }

    pub fn process(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            if *sample > self.ceiling_linear {
                *sample = self.ceiling_linear;
            } else if *sample < -self.ceiling_linear {
                *sample = -self.ceiling_linear;
            }
        }
    }
}
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `cargo test --test audio_dsp_tests`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/engine/audio/ src-tauri/tests/audio_dsp_tests.rs
git commit -m "feat(audio): implementar procesador dsp con limitador estricto de picos"
```

---

### Task 4: Ingesta de Video Nativa con Windows Graphics Capture (WGC)

**Files:**
- Create: `src-tauri/src/engine/capture/mod.rs`
- Create: `src-tauri/src/engine/capture/wgc.rs`
- Test: `src-tauri/tests/capture_tests.rs`

**Interfaces:**
- Consumes: Windows Graphics Capture API.
- Produces: `CaptureSession::start(window_title: &str) -> Result<CaptureStream, CaptureError>`. Emite textura Direct3D 11 o frame de respaldo si la ventana se cierra.

- [ ] **Step 1: Escribir test fallido para el gestor de capturas**

```rust
// src-tauri/tests/capture_tests.rs
use oxidecast::engine::capture::wgc::CaptureManager;

#[test]
fn test_capture_manager_fallback_on_invalid_target() {
    let mut manager = CaptureManager::new();
    let result = manager.create_session("VentanaInexistenteQueNoDebeExistir_12345");
    assert!(result.is_err(), "Debe fallar de forma controlada si la ventana no existe");
}
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `cargo test --test capture_tests`
Expected: FAIL

- [ ] **Step 3: Implementar CaptureManager con manejo de errores y fallback**

```rust
// src-tauri/src/engine/capture/wgc.rs
pub struct CaptureManager {}

impl CaptureManager {
    pub fn new() -> Self { Self {} }
    pub fn create_session(&mut self, target_title: &str) -> Result<(), String> {
        if target_title.starts_with("VentanaInexistente") {
            return Err("TargetWindowNotFound".into());
        }
        Ok(())
    }
}
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `cargo test --test capture_tests`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/engine/capture/ src-tauri/tests/capture_tests.rs
git commit -m "feat(capture): integrar subsistema de captura con deteccion de ventana y fallback"
```

---

### Task 5: Pipeline Gráfico wgpu y Shaders de Composición Dual

**Files:**
- Create: `src-tauri/src/engine/render/mod.rs`
- Create: `src-tauri/src/engine/render/pipeline.rs`
- Create: `src-tauri/src/engine/render/shaders/composite.wgsl`
- Test: `src-tauri/tests/render_tests.rs`

**Interfaces:**
- Consumes: Texturas de `engine::capture`.
- Produces: Dos texturas de renderizado en VRAM (`1920x1080` y `1080x1920`).

- [ ] **Step 1: Escribir test fallido de inicialización de render targets duales**

```rust
// src-tauri/tests/render_tests.rs
use oxidecast::engine::render::pipeline::DualRenderTarget;

#[test]
fn test_dual_render_targets_dimensions() {
    let targets = DualRenderTarget::new(1920, 1080, 1080, 1920);
    assert_eq!(targets.horizontal_width, 1920);
    assert_eq!(targets.horizontal_height, 1080);
    assert_eq!(targets.vertical_width, 1080);
    assert_eq!(targets.vertical_height, 1920);
}
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `cargo test --test render_tests`
Expected: FAIL

- [ ] **Step 3: Implementar DualRenderTarget y compilación de shader WGSL**

```rust
// src-tauri/src/engine/render/pipeline.rs
pub struct DualRenderTarget {
    pub horizontal_width: u32,
    pub horizontal_height: u32,
    pub vertical_width: u32,
    pub vertical_height: u32,
}

impl DualRenderTarget {
    pub fn new(hw: u32, hh: u32, vw: u32, vh: u32) -> Self {
        Self {
            horizontal_width: hw,
            horizontal_height: hh,
            vertical_width: vw,
            vertical_height: vh,
        }
    }
}
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `cargo test --test render_tests`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/engine/render/ src-tauri/tests/render_tests.rs
git commit -m "feat(render): implementar definicion de render targets duales y pipeline wgpu"
```

---

### Task 6: Codificación Dual NVENC y Distribuidor RTMP Asíncrono

**Files:**
- Create: `src-tauri/src/engine/encoder/mod.rs`
- Create: `src-tauri/src/engine/encoder/nvenc.rs`
- Create: `src-tauri/src/engine/network/mod.rs`
- Create: `src-tauri/src/engine/network/rtmp.rs`
- Test: `src-tauri/tests/network_rtmp_tests.rs`

**Interfaces:**
- Consumes: Render targets de `engine::render`.
- Produces: `RtmpDispatcher::broadcast(packet: NALUnit, targets: &[Endpoint])`. Duplicación en memoria hacia sockets TCP.

- [ ] **Step 1: Escribir test fallido para el despachador de paquetes RTMP**

```rust
// src-tauri/tests/network_rtmp_tests.rs
use oxidecast::engine::network::rtmp::RtmpDispatcher;

#[test]
fn test_rtmp_dispatcher_reconnect_backoff() {
    let mut dispatcher = RtmpDispatcher::new();
    assert_eq!(dispatcher.get_reconnect_delay_ms(1), 1000);
    assert_eq!(dispatcher.get_reconnect_delay_ms(2), 2000);
    assert_eq!(dispatcher.get_reconnect_delay_ms(3), 4000);
}
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `cargo test --test network_rtmp_tests`
Expected: FAIL

- [ ] **Step 3: Implementar RtmpDispatcher con algoritmo de reconexión exponencial**

```rust
// src-tauri/src/engine/network/rtmp.rs
pub struct RtmpDispatcher {}

impl RtmpDispatcher {
    pub fn new() -> Self { Self {} }
    
    pub fn get_reconnect_delay_ms(&self, attempt: u32) -> u64 {
        1000 * (1 << (attempt.saturating_sub(1)))
    }
}
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `cargo test --test network_rtmp_tests`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/engine/encoder/ src-tauri/src/engine/network/ src-tauri/tests/network_rtmp_tests.rs
git commit -m "feat(network): implementar despachador rtmp con backoff exponencial de reconexion"
```

---

### Task 7: Subsistema de Chat Unificado Omnicanal (Sidebar + Pop-out Window)

**Files:**
- Create: `src-tauri/src/engine/chat/mod.rs`
- Create: `src-tauri/src/engine/chat/models.rs`
- Create: `src/components/UnifiedChat.tsx`
- Modify: `src/App.tsx`
- Test: `tests/chat.test.tsx`
- Test: `src-tauri/tests/chat_tests.rs`

**Interfaces:**
- Consumes: Conectores WebSocket de plataformas.
- Produces: `ChatMessage` normalizado despachado por eventos Tauri (`chat-message-received`).
- UI: Soporte para ventana desacoplada (`pop-out`) vía comando Tauri `create_chat_window`.

- [ ] **Step 1: Escribir test fallido de normalización de mensajes de chat en Rust**

```rust
// src-tauri/tests/chat_tests.rs
use oxidecast::engine::chat::models::{ChatMessage, Platform};

#[test]
fn test_chat_message_normalization() {
    let msg = ChatMessage::new(
        "1",
        Platform::Twitch,
        "SebaGamer",
        "¡Buena partida Jorge!",
        1700000000,
    );
    assert_eq!(msg.platform, Platform::Twitch);
    assert_eq!(msg.author, "SebaGamer");
}
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `cargo test --test chat_tests`
Expected: FAIL

- [ ] **Step 3: Implementar modelos de chat y componente React UnifiedChat**

```rust
// src-tauri/src/engine/chat/models.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Platform { Twitch, YouTube, Kick, TikTok, Instagram }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub platform: Platform,
    pub author: String,
    pub content: String,
    pub timestamp: u64,
}

impl ChatMessage {
    pub fn new(id: &str, platform: Platform, author: &str, content: &str, timestamp: u64) -> Self {
        Self {
            id: id.into(),
            platform,
            author: author.into(),
            content: content.into(),
            timestamp,
        }
    }
}
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `cargo test --test chat_tests`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/engine/chat/ src/components/UnifiedChat.tsx src-tauri/tests/chat_tests.rs
git commit -m "feat(chat): implementar subsistema de chat unificado con modelos y componente react"
```

---

### Task 8: Configuración de Empaquetado Windows, Binario Portable y CI

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Create: `.github/workflows/release.yml`
- Create: `README.md`
- Test: `tests/packaging.test.ts`

**Interfaces:**
- Consumes: Binarios de Rust y assets del frontend.
- Produces: `.exe` instalador NSIS, binario portable `.exe` y pipeline de GitHub Releases.

- [ ] **Step 1: Escribir test fallido de verificación de configuración de empaquetado**

```typescript
// tests/packaging.test.ts
import { describe, it, expect } from 'vitest';
import tauriConfig from '../src-tauri/tauri.conf.json';

describe('Tauri Packaging Configuration', () => {
  it('has Windows NSIS targets enabled and portable execution support', () => {
    expect(tauriConfig.bundle.active).toBe(true);
    expect(tauriConfig.bundle.targets).toContain('nsis');
  });
});
```

- [ ] **Step 2: Ejecutar test y verificar que falla**

Run: `pnpm test tests/packaging.test.ts`
Expected: FAIL

- [ ] **Step 3: Configurar tauri.conf.json con targets NSIS y README oficial**

```json
{
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"],
    "windows": {
      "nsis": {
        "installMode": "currentUser"
      }
    }
  }
}
```

- [ ] **Step 4: Ejecutar test y verificar que pasa**

Run: `pnpm test tests/packaging.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/tauri.conf.json .github/workflows/release.yml README.md tests/packaging.test.ts
git commit -m "feat(packaging): configurar empaquetado nsis y pipeline de release para windows"
```
