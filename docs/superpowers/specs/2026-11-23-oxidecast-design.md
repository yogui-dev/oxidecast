# 🦀 Especificación de Diseño: OxideCast (Live Broadcast Engine)

- **Fecha:** 2026-11-23
- **Proyecto:** OxideCast
- **Autor:** Jorge Arias (YoguiDev)
- **Repositorio:** `https://github.com/yogui-dev/oxidecast`
- **Ubicación Local:** `C:\Proyectos\yoguidev\oxidecast`
- **Estado:** Aprobado / Listo para Planificación de Implementación

---

## 1. Resumen Ejecutivo y Visión

**OxideCast** es una suite de transmisión y grabación en vivo de código abierto diseñada desde cero en **Rust** y **Tauri v2**. Nace para superar las limitaciones estructurales de OBS Studio (lienzos 16:9 rígidos, interfaces pesadas en Qt y sobrecosto al emitir en vertical).

Su propuesta central es el **Streaming Omnicanal Nativo**:
- Permite componer y emitir simultáneamente en formato horizontal (16:9 para YouTube, Twitch, Kick, Facebook) y vertical (9:16 para TikTok Live, Instagram Live).
- Todo mediante un pipeline de alto rendimiento **Zero-Copy en GPU**, acelerado por **NVIDIA NVENC** y con una huella de memoria en reposo inferior a **80 MB de RAM**.

---

## 2. Arquitectura de Software y Componentes

El sistema se estructura en dos capas principales comunicadas mediante el puente IPC asíncrono y tipado de Tauri v2:

```mermaid
graph TD
    subgraph UI ["Capa de Interfaz (Tauri v2 + React / Tailwind CSS)"]
        DC["Panel Dual-Canvas (16:9 y 9:16 en paralelo)"]
        MIX["Mezclador de Audio & Vúmetros"]
        SCENE["Gestor de Capas y Escenas"]
        STATUS["Monitor de Estado (FPS, CPU, GPU, Salud de Red)"]
        CHAT_UI["Panel de Chat Unificado Omnicanal (Pop-out)"]
    end

    subgraph IPC ["Puente IPC Tipado (Tauri v2)"]
        CMD["Commands (Invocación Rust directa)"]
        EVT["Events (Telemetría, Audio y Mensajes de Chat a 30 Hz)"]
    end

    subgraph Core ["Motor Nativo OxideCast (Rust)"]
        CAP["Módulo de Captura (windows-capture API)"]
        GFX["Motor de Render (wgpu / DirectX 12 / WGSL)"]
        AUD["Motor de Audio (cpal WASAPI + DSP)"]
        ENC["Codificador por Hardware (NVIDIA NVENC)"]
        NET["Distribuidor Multistream (tokio RTMP)"]
        CHAT_CORE["Motor de Chat Normalizado (Twitch, YT, Kick, TikTok)"]
    end

    UI --> CMD
    CMD --> Core
    Core --> EVT
    EVT --> UI

    CAP -->|Textura Direct3D 11| GFX
    AUD -->|Buffers f32| ENC
    GFX -->|Render Targets Duales| ENC
    ENC -->|Paquetes H.264 NAL| NET
    CHAT_CORE -->|ChatMessage Structs| EVT
```

### Componentes del Core en Rust (`src-tauri/src/`)
1. **`engine::capture`:** Ingesta de video de ventanas y pantallas completas mediante la API moderna `Windows.Graphics.Capture`. Ingesta de webcams mediante `windows-rs` / MediaFoundation.
2. **`engine::render`:** Motor gráfico basado en `wgpu`. Compone las capas visuales mediante shaders en WGSL y genera dos superficies de renderizado paralelas (`1920×1080` y `1080×1920`).
3. **`engine::audio`:** Captura de baja latencia con `cpal` (WASAPI Loopback para sonido de juegos/sistema + entrada de micrófono). Cadena DSP: Puerta de Ruido y Limitador de Picos a `-1.0 dBFS`.
4. **`engine::encoder`:** Interfaz directa hacia el chip de silicio NVIDIA NVENC (GPU RTX 4050). Ejecuta exactamente dos sesiones de codificación por hardware en paralelo (una horizontal y una vertical).
5. **`engine::network`:** Motor asíncrono en `tokio` que duplica los paquetes de video comprimidos en memoria y los despacha mediante sockets TCP/RTMP hacia los destinos configurados.
6. **`engine::chat`:** Normalizador y agregador en tiempo real de mensajes de chat multiplataforma (Twitch WebSocket, YouTube Live Streaming API, Kick Pusher, TikTok Live connector) despachados vía Tauri Events.
7. **`engine::importer`:** Motor de migración sin fricción que analiza y convierte archivos `.json` de colecciones de escenas y archivos `.ini` de perfiles de OBS Studio a esquemas nativos de OxideCast.

### Componentes de la Interfaz (`src/`)
1. **`components/DualCanvas`:** Muestra en tiempo real ambos lienzos (16:9 a la izquierda, 9:16 a la derecha) con soporte para arrastrar, redimensionar y alinear capas.
2. **`components/AudioMixer`:** Control individual de volumen por fuente, medidores de nivel (dBFS) y botón de mute.
3. **`components/StreamControls`:** Botones de inicio/parada de transmisión y grabación, con indicadores de salud de conexión por plataforma.
4. **`components/UnifiedChat`:** Feed unificado de comentarios en vivo con badges distintivos por plataforma, contadores de audiencia simultánea y botón de desacople a ventana secundaria.
5. **`components/ObsMigrationWizard`:** Asistente modal de un clic que autodetecta colecciones de escenas de OBS Studio instaladas y las migra al vuelo a Dual-Canvas.

---

## 3. Pipeline de Renderizado y Dual-Canvas (Zero-Copy)

### Sincronización Inteligente de Capas (Smart Layout Anchor)
Cuando el usuario ajusta una capa en el lienzo 16:9, OxideCast aplica automáticamente reglas de anclaje relativas para el lienzo 9:16:
- **Cámara:** Anclada por defecto en la parte superior del formato vertical.
- **Juego:** Centrado automáticamente con escalado proporcional sin deformación de aspecto.
- **Chat / Overlays:** Anclados en el tercio inferior del formato vertical.
- El usuario puede desacoplar el comportamiento si desea personalizar las coordenadas de cada formato de manera independiente.

### Ciclo de Cuadro a 60 FPS (Zero-Copy VRAM)
```
[Juego / Pantalla] 
       │ (DirectX 11 Surface via WGC)
       ▼
[wgpu Direct Texture Binding] ──> [WGSL Composition Shader]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [Target 16:9 (1920x1080)]                       [Target 9:16 (1080x1920)]
                  │                                               │
                  ▼                                               ▼
         [NVENC H.264 Encoder A]                         [NVENC H.264 Encoder B]
                  │                                               │
                  ▼                                               ▼
       [Socket RTMP YouTube/Twitch]                     [Socket RTMP TikTok/Insta]
```
No existe transferencia de píxeles hacia la memoria RAM del sistema. El procesamiento reside 100% en la VRAM de la GPU NVIDIA RTX 4050.

---

## 4. Pipeline de Audio y Procesamiento DSP

- **Frecuencia de Muestreo:** 48.000 Hz estéreo con muestras en coma flotante de 32 bits (`f32`).
- **Cadena de Filtros en Serie:**
  1. **Atenuación / Ganancia:** Ajuste de volumen lineal pre-filtro.
  2. **Puerta de Ruido (Noise Gate):** Umbral configurable (por defecto `-32 dBFS`) con tiempos de ataque (10 ms) y decaimiento (100 ms).
  3. **Limitador de Picos (Peak Limiter):** Techo estricto en `-1.0 dBFS` con curva soft-knee para prevenir distorsión digital (*clipping*).
- **Codificación de Audio:** AAC a 160 kbps por canal de salida.

---

## 5. Módulo de Chat Unificado Omnicanal (Unified Chat Subsystem)

El subsistema de chat resuelve la fragmentación de la audiencia cuando se emite a múltiples plataformas en simultáneo:

### Arquitectura de Ingesta y Normalización
1. **Conectores Livianos en Rust (`engine::chat`):**
   - **Twitch:** Conexión WebSocket directa a IRC (`wss://irc-ws.chat.twitch.tv:443`).
   - **YouTube:** Polling adaptativo asíncrono sobre `liveChatMessages/list` vía `tokio`.
   - **Kick:** Conexión WebSocket al clúster de Pusher de Kick.
   - **TikTok:** Conector local para decodificación de eventos de directo.
2. **Estructura Común Normalizada:**
   ```rust
   pub struct ChatMessage {
       pub id: String,
       pub platform: Platform, // Twitch, YouTube, Kick, TikTok, Instagram
       pub author: String,
       pub author_color: Option<String>,
       pub content: String,
       pub badges: Vec<String>,
       pub timestamp: u64,
   }
   ```
3. **Experiencia de Usuario Híbrida:**
   - **Modo Panel Integrado:** Sidebar derecho dentro de OxideCast con scroll suave y contadores de espectadores en vivo.
   - **Modo Ventana Desacoplable (Pop-out):** Invocación de `tauri::WebviewWindowBuilder` para abrir el chat en una ventana secundaria nativa independiente para un segundo monitor.
   - **Modo Ghost Overlay In-Game:** Ventana flotante semi-transparente sobre el juego con `set_always_on_top(true)` y `set_ignore_cursor_events(true)` para que los clics del mouse traspasen la ventana hacia el juego.

---

## 6. Módulo de Migración e Importación desde OBS Studio (OBS Importer Engine)

Para eliminar toda fricción de adopción, OxideCast incluye un motor de migración inteligente capaz de leer y transformar la configuración existente de OBS Studio:

### 1. Detección Automática de Archivos OBS
- Escanea las rutas predeterminadas de Windows:
  - `%APPDATA%\obs-studio\basic\scenes\*.json` (Colecciones de escenas).
  - `%APPDATA%\obs-studio\basic\profiles\*\basic.ini` (Perfiles y credenciales RTMP).
  - Admite selección manual de archivo `.json` exportado desde cualquier versión de OBS Studio (incluyendo versiones portables).

### 2. Mapeo de Fuentes y Compatibilidad
| Fuente / Elemento en OBS Studio | Mapeo Nativo en OxideCast | Estrategia de Migración |
| :--- | :--- | :--- |
| `game_capture` | `engine::capture` (Windows Graphics Capture) | Extrae el nombre del ejecutable o ventana y lo vincula a la API WGC acelerada por D3D11. |
| `dshow_input` (Cámara web) | `engine::capture` (MediaFoundation / DirectShow) | Mapea el identificador de hardware del dispositivo de video. |
| `browser_source` (Overlays) | `engine::render` (WebView2 Surface) | Copia la URL, CSS personalizado y dimensiones de renderizado. |
| `image_source` / `color_source` | Texturas RGBA en `wgpu` | Carga el archivo local o genera el color sólido en memoria VRAM. |
| `wasapi_input_capture` (Micrófono) | `engine::audio` (`cpal`) | Asigna el dispositivo de audio y replica los filtros de ruido (*Noise Gate* y *Limiter*). |

### 3. Generación Automática del Lienzo Vertical (Smart Dual-Canvas Upgrade)
- Al importar una escena tradicional de OBS de 16:9, OxideCast no solo la importa intacta, sino que **aplica el algoritmo de Smart Layout Anchor para sintetizar automáticamente su contraparte vertical 9:16**:
  - La webcam detectada se posiciona en el tercio superior.
  - El gameplay se centra automáticamente con escalado proporcional.
  - El usuario puede empezar a emitir a TikTok/Instagram de inmediato sin tener que rearmar su escena desde cero.

---

## 7. Distribución y Empaquetado para Windows

La distribución de OxideCast se compila con `tauri-cli v2` y produce:
1. **Instalador Oficial (`.exe` NSIS):** Instalador estándar con creación de accesos directos y desinstalador limpio.
2. **Versión Portable (`.exe` Standalone):** Binario único sin instalación en el sistema operativo.
3. **Actualizador Automático Integrado:** Módulo `tauri-plugin-updater` sincronizado con las publicaciones de releases en `https://github.com/yogui-dev/oxidecast/releases`.
4. **Huella de Peso:** Instalador final de ~15 a 20 MB.

---

## 8. Matriz de Resiliencia y Manejo de Errores

| Incidente / Fallo | Detección Técnica | Acción Automática de Recuperación |
| :--- | :--- | :--- |
| **Cierre abrupto del videojuego** | `GraphicsCaptureItem::Closed` | Conmuta inmediatamente a placa de reserva (*"Esperando juego..."*) en 16 ms sin cortar la transmisión. |
| **Corte de red RTMP** | Error en socket TCP / EWOULDBLOCK | Retiene últimos 3s en búfer circular y ejecuta reconexión automática en hilo de fondo (1s, 2s, 4s). |
| **Desconexión de Micrófono USB** | Evento de desconexión en stream `cpal` | Pasa a silencio temporal y reconecta al micrófono predeterminado del sistema. |
| **Sobrecarga de GPU (>95%)** | Contador de frames descartados en NVENC | Reduce el framerate de la vista previa en la UI (de 60 a 30 FPS) para priorizar la salida de transmisión. |

---

## 9. Estrategia de Pruebas y Control de Calidad

1. **Pruebas Unitarias de Rust (`cargo test`):**
   - Cobertura matemática del limitador de picos y puerta de ruido.
   - Verificación de empaquetado de encabezados FLV/RTMP.
   - Serialización de perfiles de usuario en JSON.
2. **Pruebas de Renderizado Offscreen:**
   - Render headless en `wgpu` comparando imágenes generadas contra un hash de referencia para validar ausencia de corrupción gráfica.
3. **Pruebas de Frontend (Vitest):**
   - Verificación de reglas matemáticas de redimensionamiento de los lienzos y anclaje reactivo de capas.
4. **Prueba de Resistencia (Stress Test):**
   - Transmisión continua de 30 minutos a endpoints de prueba locales verificando que el consumo de memoria permanezca estable (<80 MB).
