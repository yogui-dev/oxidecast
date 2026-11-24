# 🦀 OxideCast Studio

<p align="center">
  <img src="https://raw.githubusercontent.com/yogui-dev/oxidecast/main/docs/assets/banner.png" alt="OxideCast Banner" width="100%" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>Suite Broadcast y Grabación de Nueva Generación en Rust y Tauri v2</strong><br/>
  <em>Dual-Canvas simultáneo (16:9 y 9:16), Aceleración por Hardware NVIDIA NVENC Zero-Copy y Chat Unificado Omnicanal.</em>
</p>

<p align="center">
  <a href="https://github.com/yogui-dev/oxidecast/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build Status"/></a>
  <a href="https://github.com/yogui-dev/oxidecast/releases"><img src="https://img.shields.io/badge/version-0.1.0--alpha-orange?style=flat-square" alt="Version"/></a>
  <img src="https://img.shields.io/badge/lenguaje-Rust%20%2B%20TypeScript-blue?style=flat-square" alt="Tech"/>
  <img src="https://img.shields.io/badge/plataforma-Windows%2010%2F11-blueviolet?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/empaquetado-NSIS%20%2B%20Portable-success?style=flat-square" alt="Packaging"/>
  <img src="https://img.shields.io/badge/hecho%20en-Chile%20%F0%9F%87%A8%F0%9F%87%B1-red?style=flat-square" alt="Hecho en Chile"/>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licencia-MIT-green?style=flat-square" alt="License"/></a>
</p>

---

## 🇨🇱 Creado en Chile para el Mundo

**OxideCast** nace en Chile (Biobío — Los Ángeles / Concepción) bajo la visión de **Jorge Arias (YoguiDev)** para resolver de forma nativa la mayor limitación técnica que enfrentan los streamers y creadores de contenido contemporáneos: **la necesidad de transmitir simultáneamente a plataformas horizontales tradicionales (YouTube, Twitch, Kick) y plataformas verticales de formato corto (TikTok Live, Instagram Live)** sin duplicar el consumo de hardware ni abrir docenas de programas parásitos.

Toda la documentación técnica, guías operativas, especificaciones y arquitectura están redactadas **en español**, pensadas para que la comunidad hispanohablante y el ecosistema de creadores y desarrolladores latinoamericanos cuenten con una herramienta de nivel broadcast mundial, desarrollada con los más altos estándares de ingeniería de software.

---

## ⚡ ¿Por qué OxideCast? (Frente a OBS Studio Tradicional)

| Característica | OBS Studio Clásico | OxideCast Studio |
| :--- | :--- | :--- |
| **Lienzo de Emisión** | Un solo lienzo fijo 16:9 *(requiere plugins pesados como Aitum para vertical)* | **Dual-Canvas Nativo (16:9 y 9:16 en paralelo)** con sincronización matemática de capas |
| **Consumo de Memoria RAM** | ~200 MB – 350 MB en reposo | **< 80 MB de RAM** *(Núcleo en Rust puro con cero runtime parásito)* |
| **Pipeline de Video** | Copias intermedias de texturas | **Zero-Copy en VRAM** *(Windows Graphics Capture $\rightarrow$ `wgpu` $\rightarrow$ NVENC directo)* |
| **Pausas por Garbage Collector** | N/A (C++) pero con riesgo de memory leaks | **Cero Garbage Collector y Concurrencia Segura** *(Compilado con Rust y el borrow checker)* |
| **Gestión de Chats** | Múltiples ventanas flotantes de navegador que consumen gigabytes | **Chat Unificado Omnicanal** con soporte para ventana flotante desacoplable para 2do monitor |
| **Instalador y Peso** | ~110 – 160 MB | **~15 – 20 MB** *(Instalador NSIS y versión portable autónoma)* |

---

## 🏗️ Arquitectura y Stack Tecnológico

OxideCast está estructurado bajo los principios **SOLID**, **Clean Architecture** y **DIP (Dependency Inversion Principle)**:

```mermaid
graph TD
    subgraph UI ["Frontend UI (Tauri v2 + React 18 + Tailwind CSS)"]
        DC["Panel Dual-Canvas (16:9 y 9:16)"]
        MIX["Mezclador de Audio WASAPI & Vúmetros"]
        CHAT["Chat Unificado Multicanal (Twitch, TikTok, YT, Kick)"]
        STATUS["Telemetría en Vivo (FPS, Bitrate, GPU NVENC)"]
    end

    subgraph Core ["Motor Nativo en Rust (Core Engine)"]
        CAP["windows-capture (Windows.Graphics.Capture API)"]
        GFX["wgpu (DirectX 12 / Vulkan + Shaders WGSL)"]
        AUD["cpal (Audio WASAPI + Limitador Estricto -1.0 dBFS)"]
        ENC["Aceleración por Hardware NVIDIA NVENC (Dual Encode)"]
        NET["tokio (Despacho RTMP Asíncrono Multiplexado)"]
    end

    UI <==>|Puente IPC Asíncrono Tipado| Core
```

- **Motor Gráfico:** [`wgpu`](https://wgpu.rs/) ejecutando sobre DirectX 12 nativo en Windows con composición por shaders WGSL.
- **Captura sin Bloqueos:** `Windows.Graphics.Capture API` de Windows 10/11. Captura videojuegos 3D a máxima tasa de refresco sin inyectar DLLs intrusivas, siendo 100% compatible con juegos con sistemas anti-cheat como Riot Vanguard.
- **Audio DSP de Estudio:** Ingesta de micrófono y sonido del sistema mediante WASAPI loopback con puerta de ruido (*Noise Gate*) y limitador de picos (*Peak Limiter*) calibrado con techo estricto a `-1.0 dBFS` para evitar saturación y distorsión digital.
- **Multistreaming Inteligente:** Duplicación de paquetes NAL en memoria RAM hacia múltiples sockets RTMP en hilos asíncronos de `tokio`, evitando codificar más de una vez por formato de salida.

---

## 💻 Requisitos de Hardware y Sistema

### Requisitos del Sistema Operativo
- **Sistema Operativo:** Windows 10 (versión 1903 o superior, 64-bit) o Windows 11 (64-bit).
- **Entorno de Ejecución:** Microsoft Edge WebView2 Evergreen Runtime (incluido por defecto en Windows 10/11).

### Requisitos de Hardware Recomendados
- **GPU (Tarjeta Gráfica):**
  - **Recomendada:** Tarjeta gráfica **NVIDIA GeForce RTX** (serie 2000, 3000, 4000 o superior) con arquitectura Turing/Ampere/Ada Lovelace y soporte para codificador por hardware **NVIDIA NVENC** (7ma generación o superior) para dual-encoding a 1080p60 simultáneo con zero-copy.
  - **Mínima:** NVIDIA GeForce GTX 1650 / GTX 1660 o GPU compatible con DirectX 12 Feature Level 11_1.
- **CPU (Procesador):** Intel Core i5 / i7 (10ma generación o superior) o AMD Ryzen 5 / 7 (serie 3000 o superior) de 6 núcleos / 12 hilos.
- **Memoria RAM:** 16 GB DDR4/DDR5 (mínimo 8 GB para streaming básico).
- **Almacenamiento:** 100 MB de espacio libre en disco SSD.
- **Conexión a Internet:** Conexión de fibra óptica con al menos 20 Mbps de subida (upload) para dual-streaming RTMP simultáneo (1080p60 horizontal + 1080p60 vertical).

---

## 📥 Descarga e Instalación (Producción)

Los paquetes binarios precompilados están disponibles en la sección de [Releases de GitHub](https://github.com/yogui-dev/oxidecast/releases):

1. **Instalador Oficial NSIS (`OxideCast_0.1.0_x64-setup.exe`):**
   - Instalador interactivo optimizado para Windows.
   - Configurado en modo `currentUser` (se instala en `%LOCALAPPDATA%\Programs\OxideCast` sin solicitar permisos de administrador por defecto).
   - Incluye acceso directo en el Escritorio y Menú Inicio, y desinstalador automático.
2. **Versión Portable / Binario Autónomo:**
   - Permite ejecutar OxideCast directamente desde una unidad USB o carpeta sin instalación en el sistema.

---

## 🚀 Puesta en Marcha (Desarrollo Local)

### Herramientas de Compilación Requeridas
- [Rust](https://www.rust-lang.org/) (versión 1.80 o superior con toolchain `stable-x86_64-pc-windows-msvc`).
- [Node.js](https://nodejs.org/) (versión 20+ LTS).
- [pnpm](https://pnpm.io/) (gestor de paquetes obligatorio en el espacio de trabajo).
- Microsoft Visual Studio C++ Build Tools (con SDK de Windows 10/11).

### Comandos de Desarrollo

```powershell
# 1. Clonar el repositorio
git clone https://github.com/yogui-dev/oxidecast.git
cd oxidecast

# 2. Instalar dependencias del frontend con pnpm (NUNCA usar npm)
pnpm install

# 3. Ejecutar suite de pruebas unitarias (TDD)
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml

# 4. Iniciar en modo desarrollo interactivo
pnpm tauri dev

# 5. Compilar frontend y aplicación de producción
pnpm build
pnpm tauri build
```

---

## 📦 Hoja de Ruta (Roadmap)

- [x] **Fase 0:** Especificación formal de arquitectura de software y diseño visual.
- [x] **Fase 1 (MVP Completo):**
  - [x] Repositorio público y scaffolding de Tauri v2 + React.
  - [x] Componente Dual-Canvas responsivo y anclaje reactivo de capas (16:9 y 9:16).
  - [x] Motor de audio DSP (`cpal` + limitador estricto a `-1.0 dBFS` + puerta de ruido).
  - [x] Ingesta WGC de pantalla/juegos con tolerancia a fallos y fallback automático.
  - [x] Pipeline gráfico `wgpu` con shaders WGSL y doble superficie de renderizado.
  - [x] Codificación dual NVENC con despacho RTMP asíncrono en `tokio`.
  - [x] Subsistema de Chat Unificado con soporte desacoplable (pop-out) para segundo monitor.
  - [x] Empaquetado instalable NSIS y versión portable para Windows con CI/CD en GitHub Actions.
- [ ] **Fase 2:** Soporte para transiciones Stinger personalizadas y cámara virtual DirectShow.
- [ ] **Fase 3:** Conector de plugins comunitarios en Rust y WebAssembly (Wasm).

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

<p align="center">
  <strong>OxideCast Studio</strong> • Creado con ❤️ por <a href="https://github.com/yogui-dev">Jorge Arias (YoguiDev)</a><br/>
  Los Ángeles · Concepción, Región del Biobío, Chile 🇨🇱
</p>
