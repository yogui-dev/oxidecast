import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Video,
  Layers,
  Sparkles,
  Type,
  Globe,
  Palette,
  Image as ImageIcon,
  Terminal,
} from 'lucide-react';
import {
  calculateVerticalAnchor,
  CANVAS_9_16,
  LayerType,
} from '../utils/layoutMath';
import { Scene, SourceItem, SourceTransform, SourceFilterSettings } from '../types/studio';
import {
  DEFAULT_SOURCE_TRANSFORM,
  DEFAULT_SOURCE_FILTERS,
} from '../services/storage';

export interface VisualLayer {
  id: string;
  name: string;
  type: LayerType;
  rect16_9: { x: number; y: number; width: number; height: number };
  color: string;
}

interface DualCanvasProps {
  activeScene?: Scene;
  selectedSourceId?: string | null;
  onSelectSource?: (id: string) => void;
  smartAnchorActive?: boolean;
  onToggleSmartAnchor?: () => void;
}

/**
 * Calcula la cadena CSS transform para volteos horizontal/vertical y rotacion
 */
export function computeCssTransform(transform?: SourceTransform): string {
  if (!transform) return 'none';
  const parts: string[] = [];
  if (transform.flipHorizontal) parts.push('scaleX(-1)');
  if (transform.flipVertical) parts.push('scaleY(-1)');
  if (transform.rotation) parts.push(`rotate(${transform.rotation}deg)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Calcula la cadena CSS filter para correccion de color, desenfoque y efectos
 */
export function computeCssFilter(filters?: SourceFilterSettings): string {
  if (!filters) return 'none';
  const parts: string[] = [];
  if (filters.brightness !== undefined && filters.brightness !== 1) {
    parts.push(`brightness(${filters.brightness})`);
  }
  if (filters.contrast !== undefined && filters.contrast !== 1) {
    parts.push(`contrast(${filters.contrast})`);
  }
  if (filters.saturation !== undefined && filters.saturation !== 1) {
    parts.push(`saturate(${filters.saturation})`);
  }
  if (filters.opacity !== undefined && filters.opacity !== 1) {
    parts.push(`opacity(${filters.opacity})`);
  }
  if (filters.blur !== undefined && filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.grayscale !== undefined && filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale * 100}%)`);
  }
  if (filters.sepia !== undefined && filters.sepia > 0) {
    parts.push(`sepia(${filters.sepia * 100}%)`);
  }
  if (filters.invert) {
    parts.push('invert(100%)');
  }
  if (filters.hueRotate !== undefined && filters.hueRotate > 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  }
  return parts.length > 0 ? parts.join(' ') : 'none';
}

export const DualCanvas: React.FC<DualCanvasProps> = ({
  activeScene,
  selectedSourceId: externalSelectedId,
  onSelectSource: externalSelectSource,
  smartAnchorActive: externalSmartAnchor,
  onToggleSmartAnchor: externalToggleSmartAnchor,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>('game-capture');
  const [internalSmartAnchor, setInternalSmartAnchor] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedSourceId =
    externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;
  const smartAnchorActive =
    externalSmartAnchor !== undefined ? externalSmartAnchor : internalSmartAnchor;

  const handleSelectSource = (id: string) => {
    if (externalSelectSource) {
      externalSelectSource(id);
    } else {
      setInternalSelectedId(id);
    }
  };

  const handleToggleSmartAnchor = () => {
    if (externalToggleSmartAnchor) {
      externalToggleSmartAnchor();
    } else {
      setInternalSmartAnchor((prev) => !prev);
    }
  };

  // Fuentes a renderizar: si se pasa activeScene se usan sus fuentes; de lo contrario fallback por defecto
  const sources: SourceItem[] =
    activeScene && activeScene.sources.length > 0
      ? activeScene.sources
      : [
          {
            id: 'game-capture',
            name: 'Juego / Pantalla',
            type: 'screen',
            targetCanvas: 'both',
            rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
            visible: true,
            locked: true,
            color: '#3B82F6',
            properties: {},
            transform: { ...DEFAULT_SOURCE_TRANSFORM },
            filters: { ...DEFAULT_SOURCE_FILTERS },
          },
          {
            id: 'webcam-source',
            name: 'Cámara Web',
            type: 'camera',
            targetCanvas: 'both',
            rect16_9: { x: 1440, y: 810, width: 480, height: 270 },
            visible: true,
            locked: false,
            color: '#FF5722',
            properties: {},
            transform: { ...DEFAULT_SOURCE_TRANSFORM },
            filters: { ...DEFAULT_SOURCE_FILTERS },
          },
        ];

  // Filtrar fuentes visibles para cada lienzo
  const horizontalSources = sources.filter(
    (s) => s.visible && (s.targetCanvas === 'both' || s.targetCanvas === 'horizontal')
  );
  const verticalSources = sources.filter(
    (s) => s.visible && (s.targetCanvas === 'both' || s.targetCanvas === 'vertical')
  );

  const renderScreenDesktop = (src: SourceItem, isVertical: boolean) => {
    return (
      <div className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between font-sans bg-gradient-to-br from-[#070b14] via-[#0d1322] to-[#050811] text-gray-200">
        {/* Wallpaper Cyberpunk / Obsidian accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(242,100,25,0.14),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(0,240,255,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Marca de agua / Badge superior de escritorio */}
        <div className="absolute top-2 right-2.5 flex items-center gap-1.5 opacity-60 text-[9px] font-mono pointer-events-none z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-gray-300">Escritorio Windows 11 Pro</span>
        </div>

        {/* Área del Escritorio: Iconos y Ventana Activa */}
        <div className="flex-1 relative p-2 sm:p-3 overflow-hidden flex">
          {/* Columna de Iconos de Escritorio */}
          <div className={`flex flex-col gap-2 z-10 shrink-0 ${isVertical ? 'opacity-80 scale-90 -ml-1' : ''}`}>
            {/* Icono 1: Este Equipo */}
            <div className="flex flex-col items-center group cursor-pointer w-12 sm:w-14 p-1 rounded hover:bg-white/10 transition-colors">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 shadow-sm">
                <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-200 text-center leading-tight mt-1 drop-shadow font-medium">
                Este Equipo
              </span>
            </div>

            {/* Icono 2: OxideCast Studio */}
            <div className="flex flex-col items-center group cursor-pointer w-12 sm:w-14 p-1 rounded hover:bg-white/10 transition-colors">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-oxide-rust/30 border border-oxide-rust/50 flex items-center justify-center text-oxide-rust-light shadow-sm">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-oxide-rust" />
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-200 text-center leading-tight mt-1 drop-shadow font-medium">
                OxideCast Studio
              </span>
            </div>

            {/* Icono 3: Terminal PowerShell */}
            <div className="flex flex-col items-center group cursor-pointer w-12 sm:w-14 p-1 rounded hover:bg-white/10 transition-colors">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-black/60 border border-cyber-cyan/50 flex items-center justify-center text-cyber-cyan shadow-sm">
                <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyber-cyan" />
              </div>
              <span className="text-[8px] sm:text-[9px] text-gray-200 text-center leading-tight mt-1 drop-shadow font-medium">
                Terminal PowerShell
              </span>
            </div>
          </div>

          {/* Ventana Activa en Primer Plano */}
          <div
            className={`absolute ${
              isVertical
                ? 'left-14 right-1 top-2 bottom-2'
                : 'left-16 sm:left-20 right-2 sm:right-4 top-2 bottom-2'
            } bg-[#0c1220]/95 border border-surface-high rounded shadow-2xl flex flex-col overflow-hidden backdrop-blur-md z-10`}
          >
            {/* Barra de Título de la Ventana */}
            <div className="h-5 sm:h-6 bg-[#161f33] border-b border-surface-high px-2 flex items-center justify-between text-[9px] sm:text-[10px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-oxide-rust" />
                <span className="font-semibold text-gray-200 truncate">
                  {src.name} — Visual Studio Code
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <span className="cursor-pointer hover:text-white px-0.5">─</span>
                <span className="cursor-pointer hover:text-white px-0.5">□</span>
                <span className="cursor-pointer hover:text-red-400 px-0.5">✕</span>
              </div>
            </div>

            {/* Cuerpo de la Ventana: Código simulado / Emisión en vivo */}
            <div className="flex-1 p-2 sm:p-2.5 font-mono text-[8px] sm:text-[9px] text-gray-300 flex flex-col justify-between overflow-hidden bg-[#070c16]/90">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1.5 text-cyber-cyan">
                  <span className="text-gray-500 w-3">1</span>
                  <span>// OxideCast High-Performance Stream Pipeline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 w-3">2</span>
                  <span className="text-oxide-rust-light">fn capture_screen()</span>
                  <span>-&gt; Result&lt;Frame, Error&gt; &#123;</span>
                </div>
                <div className="flex items-center gap-1.5 pl-3">
                  <span className="text-gray-500 w-3">3</span>
                  <span className="text-cyber-green">let stream = WindowsGraphicsCapture::init();</span>
                </div>
                <div className="flex items-center gap-1.5 pl-3">
                  <span className="text-gray-500 w-3">4</span>
                  <span className="text-yellow-400">stream.dispatch_gpu_zero_copy(1920, 1080);</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 w-3">5</span>
                  <span>&#125;</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-surface-high text-[8px] sm:text-[9px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-cyber-cyan font-bold">Rust 1.92</span>
                  <span>•</span>
                  <span className="text-cyber-green font-semibold">Captura Activa</span>
                </div>
                <div className="font-mono text-gray-400">
                  {isVertical ? 'Recorte 9:16' : '1920×1080 WGC'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Tareas Inferior Estilo Windows */}
        <div className="h-6 sm:h-7 bg-[#080d18]/95 border-t border-surface-high px-2 flex items-center justify-between z-20 backdrop-blur-md shrink-0">
          {/* Botón Inicio y Ventana Activa */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-4 h-4 sm:w-5 sm:h-5 rounded hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title="Inicio de Windows"
            >
              <div className="grid grid-cols-2 gap-0.5 w-2.5 h-2.5">
                <div className="bg-blue-400 rounded-[1px]" />
                <div className="bg-blue-400 rounded-[1px]" />
                <div className="bg-blue-400 rounded-[1px]" />
                <div className="bg-blue-400 rounded-[1px]" />
              </div>
            </div>

            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 border-b-2 border-cyber-cyan text-[8px] sm:text-[9px] text-white font-medium max-w-[120px] sm:max-w-[160px] truncate shadow-sm">
              <Monitor className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyber-cyan shrink-0" />
              <span className="truncate">{src.name}</span>
            </div>
          </div>

          {/* Bandeja del Sistema y Reloj en Vivo */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[8px] sm:text-[9px] text-gray-300 shrink-0">
            <div className="hidden sm:flex items-center gap-1 text-cyber-green">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
              <span>Captura Activa</span>
            </div>
            <span className="bg-surface-high/60 text-cyber-cyan px-1.5 py-0.5 rounded text-[8px] font-bold">
              {isVertical ? '9:16 WGC' : '1920×1080 WGC'}
            </span>
            <span className="text-gray-200 font-medium">
              {currentTime}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSourceContent = (src: SourceItem, isVertical: boolean) => {
    switch (src.type) {
      case 'screen':
        return renderScreenDesktop(src, isVertical);
      case 'window':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none bg-surface-lowest/90 backdrop-blur-sm">
            <Monitor className="h-7 w-7 text-cyber-cyan mb-1 opacity-80" />
            <span className="text-xs text-on-surface font-semibold truncate max-w-[90%]">
              {src.properties.windowTitle || src.name}
            </span>
            <span className="text-[10px] font-mono text-cyber-cyan/80">
              {isVertical ? 'WGC Recorte 9:16' : '1920×1080 WGC'}
            </span>
          </div>
        );
      case 'camera':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none bg-oxide-rust/15 backdrop-blur-sm border border-oxide-rust/30">
            <Video className="h-6 w-6 text-oxide-rust mb-1 animate-pulse" />
            <span className="text-xs text-white font-medium truncate max-w-[90%]">
              {src.name}
            </span>
            <span className="text-[9px] font-mono text-oxide-rust-light">
              MediaFoundation
            </span>
          </div>
        );
      case 'text':
        return (
          <div className="w-full h-full flex items-center justify-center p-2 text-center select-none">
            <span
              className="font-bold drop-shadow-md text-xs sm:text-sm text-yellow-300"
              style={{ color: src.properties.textColor || '#F59E0B' }}
            >
              {src.properties.text || src.name}
            </span>
          </div>
        );
      case 'browser':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none bg-oxide-lavender/15 backdrop-blur-sm">
            <Globe className="h-5 w-5 text-oxide-lavender mb-1" />
            <span className="text-xs text-on-surface font-medium truncate max-w-[90%]">
              {src.name}
            </span>
            <span className="text-[9px] font-mono text-oxide-lavender truncate max-w-[90%]">
              {src.properties.url || 'Widget Web'}
            </span>
          </div>
        );
      case 'color':
        return (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: src.properties.backgroundColor || src.color }}
          >
            <Palette className="h-6 w-6 text-white/30" />
          </div>
        );
      case 'image':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 select-none bg-cyber-green/10">
            <ImageIcon className="h-6 w-6 text-cyber-green mb-1" />
            <span className="text-xs text-gray-200 font-medium truncate max-w-[90%]">
              {src.name}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-2.5 min-h-0 select-none">
      {/* Barra de Utilidad Superior del Dual-Canvas (Stitch Viewport Utility Bar) */}
      <div className="bg-surface-low border border-surface-high rounded px-3 py-1.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-oxide-rust" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">Vista Dual-Canvas</span>
            {activeScene && (
              <span className="text-[11px] text-oxide-rust-light font-medium px-2 py-0.5 rounded bg-surface-card border border-oxide-rust/30">
                {activeScene.name}
              </span>
            )}
          </div>

          <div className="h-4 w-[1px] bg-surface-high" />

          {/* Selector de Fuentes para Inspección */}
          <div className="flex items-center gap-1 bg-surface-lowest p-0.5 rounded border border-surface-high overflow-x-auto max-w-md">
            {sources.map((src) => (
              <button
                key={src.id}
                onClick={() => handleSelectSource(src.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-colors shrink-0 ${
                  selectedSourceId === src.id
                    ? 'bg-surface-card text-white font-medium border border-surface-high shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {src.type === 'camera' ? (
                  <Video className="h-3 w-3 text-oxide-rust" />
                ) : src.type === 'text' ? (
                  <Type className="h-3 w-3 text-yellow-400" />
                ) : (
                  <Monitor className="h-3 w-3 text-cyber-cyan" />
                )}
                <span>{src.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Indicadores de Sincronización Inteligente & Hardware Ingest */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleSmartAnchor}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors border ${
              smartAnchorActive
                ? 'bg-surface-high text-oxide-rust-light border-oxide-rust/40 hover:bg-surface-highest'
                : 'bg-surface-lowest text-gray-500 border-surface-high'
            }`}
            title="Sincronización inteligente de capas entre lienzos 16:9 y 9:16"
          >
            <Sparkles className="h-3 w-3 text-oxide-rust" />
            <span>Sincronización Inteligente: {smartAnchorActive ? 'ACTIVA' : 'PAUSADA'}</span>
          </button>

          <span className="text-[10px] font-mono text-cyber-cyan bg-surface-lowest px-2 py-0.5 rounded border border-surface-high hidden sm:inline">
            1.4ms Zero-Copy VRAM
          </span>
        </div>
      </div>

      {/* Espacio Central: Ambos Lienzos (16:9 Horizontal y 9:16 Vertical) */}
      <div className="flex-1 grid grid-cols-12 gap-3 items-stretch min-h-[350px]">
        {/* Lienzo 1: Horizontal (16:9) PGM 1 */}
        <div className="col-span-7 flex flex-col bg-surface-low border border-surface-high rounded overflow-hidden shadow-md">
          {/* Canvas Top Tally Tag */}
          <div className="bg-surface px-3 py-1 flex items-center justify-between border-b border-surface-high">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-oxide-rust animate-pulse" />
              <h2 className="text-xs font-bold text-oxide-rust tracking-wider uppercase">
                PGM 1 // 16:9 HORIZONTAL (YOUTUBE + TWITCH)
              </h2>
              <span className="sr-only">Lienzo Horizontal (16:9)</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-gray-300">1920×1080 @ 60 FPS</span>
              <span className="text-surface-high">•</span>
              <span className="text-cyber-cyan font-semibold">HDR10 BT.2020</span>
            </div>
          </div>

          {/* Área de Visualización 16:9 */}
          <div className="flex-1 bg-surface-lowest relative overflow-hidden flex items-center justify-center p-2">
            <div className="w-full aspect-video bg-[#070A10] rounded relative overflow-hidden border border-surface-high shadow-2xl">
              {horizontalSources.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-mono">
                  Lienzo 16:9 Vacío (Sin fuentes activas)
                </div>
              ) : (
                horizontalSources.map((src) => {
                  const isSelected = selectedSourceId === src.id;

                  // Calcular estilos relativos a base 1920x1080
                  const left = `${(src.rect16_9.x / 1920) * 100}%`;
                  const top = `${(src.rect16_9.y / 1080) * 100}%`;
                  const width = `${(src.rect16_9.width / 1920) * 100}%`;
                  const height = `${(src.rect16_9.height / 1080) * 100}%`;

                  const transform = computeCssTransform(src.transform);
                  const filter = computeCssFilter(src.filters);

                  return (
                    <div
                      key={src.id}
                      data-source-id={src.id}
                      onClick={() => handleSelectSource(src.id)}
                      style={{
                        position: 'absolute',
                        left,
                        top,
                        width,
                        height,
                        transform: transform !== 'none' ? transform : undefined,
                        filter: filter !== 'none' ? filter : undefined,
                      }}
                      className={`cursor-pointer transition-all rounded overflow-hidden ${
                        isSelected
                          ? 'border-2 border-oxide-rust ring-2 ring-oxide-rust/40 z-20 shadow-lg'
                          : 'border border-surface-high hover:border-gray-500 z-10'
                      }`}
                    >
                      {renderSourceContent(src, false)}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Telemetry Ribbon for 16:9 */}
          <div className="bg-surface-low border-t border-surface-high px-3 py-1 flex items-center justify-between font-mono text-[10px] text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-cyber-cyan font-semibold">RTMP OUT: 6,500 kbps (CBR)</span>
              <span>•</span>
              <span>NVENC B-Frames: 2</span>
              <span>•</span>
              <span>Render: 1.2ms</span>
            </div>
            <div className="flex items-center gap-1 text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
              <span>Buffer: 100% OK</span>
            </div>
          </div>
        </div>

        {/* Lienzo 2: Vertical (9:16) PGM 2 */}
        <div className="col-span-5 flex flex-col bg-surface-low border border-surface-high rounded overflow-hidden shadow-md">
          {/* Canvas Top Tally Tag */}
          <div className="bg-surface px-3 py-1 flex items-center justify-between border-b border-surface-high">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan" />
              <h2 className="text-xs font-bold text-cyber-cyan tracking-wider uppercase">
                PGM 2 // 9:16 VERTICAL (TIKTOK LIVE)
              </h2>
              <span className="sr-only">Lienzo Vertical (9:16)</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-gray-300">1080×1920</span>
              <span className="text-surface-high">•</span>
              <span className="text-cyber-cyan font-semibold">Shorts</span>
            </div>
          </div>

          {/* Área de Visualización 9:16 */}
          <div className="flex-1 bg-surface-lowest relative overflow-hidden flex items-center justify-center p-2">
            <div className="h-full aspect-[9/16] bg-[#070A10] rounded relative overflow-hidden border border-surface-high shadow-2xl">
              {verticalSources.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-mono text-center p-4">
                  Lienzo 9:16 Vacío
                </div>
              ) : (
                verticalSources.map((src) => {
                  const isSelected = selectedSourceId === src.id;

                  // Calcular anclaje vertical inteligente o usar rect9_16
                  let vRect = src.rect9_16;
                  if (!vRect) {
                    const layerType: LayerType =
                      src.type === 'camera'
                        ? 'camera'
                        : src.type === 'screen' || src.type === 'window'
                        ? 'game'
                        : 'chat';

                    vRect = calculateVerticalAnchor(
                      src.rect16_9,
                      CANVAS_9_16,
                      layerType
                    );
                  }

                  const left = `${(vRect.x / 1080) * 100}%`;
                  const top = `${(vRect.y / 1920) * 100}%`;
                  const width = `${(vRect.width / 1080) * 100}%`;
                  const height = `${(vRect.height / 1920) * 100}%`;

                  const transform = computeCssTransform(src.transform);
                  const filter = computeCssFilter(src.filters);

                  return (
                    <div
                      key={src.id}
                      data-source-id={src.id}
                      onClick={() => handleSelectSource(src.id)}
                      style={{
                        position: 'absolute',
                        left,
                        top,
                        width,
                        height,
                        transform: transform !== 'none' ? transform : undefined,
                        filter: filter !== 'none' ? filter : undefined,
                      }}
                      className={`cursor-pointer transition-all rounded overflow-hidden ${
                        isSelected
                          ? 'border-2 border-cyber-cyan ring-2 ring-cyber-cyan/40 z-20 shadow-lg'
                          : 'border border-surface-high hover:border-gray-500 z-10'
                      }`}
                    >
                      {renderSourceContent(src, true)}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Telemetry Ribbon for 9:16 */}
          <div className="bg-surface-low border-t border-surface-high px-3 py-1 flex items-center justify-between font-mono text-[10px] text-gray-400">
            <span className="text-cyber-cyan font-semibold">TIKTOK RTMP: 4,500 kbps</span>
            <span>Vertical Render: 0.8ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
