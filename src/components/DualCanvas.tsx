import React, { useState } from 'react';
import {
  Monitor,
  Video,
  Layers,
  Sparkles,
  Type,
  Globe,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import {
  calculateVerticalAnchor,
  CANVAS_9_16,
  LayerType,
} from '../utils/layoutMath';
import { Scene, SourceItem } from '../types/studio';

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

export const DualCanvas: React.FC<DualCanvasProps> = ({
  activeScene,
  selectedSourceId: externalSelectedId,
  onSelectSource: externalSelectSource,
  smartAnchorActive: externalSmartAnchor,
  onToggleSmartAnchor: externalToggleSmartAnchor,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>('game-capture');
  const [internalSmartAnchor, setInternalSmartAnchor] = useState<boolean>(true);

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
          },
        ];

  // Filtrar fuentes visibles para cada lienzo
  const horizontalSources = sources.filter(
    (s) => s.visible && (s.targetCanvas === 'both' || s.targetCanvas === 'horizontal')
  );
  const verticalSources = sources.filter(
    (s) => s.visible && (s.targetCanvas === 'both' || s.targetCanvas === 'vertical')
  );

  const renderSourceContent = (src: SourceItem, isVertical: boolean) => {
    switch (src.type) {
      case 'screen':
      case 'window':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none bg-surface-lowest/90 backdrop-blur-sm">
            <Monitor className="h-7 w-7 text-cyber-cyan mb-1 opacity-80" />
            <span className="text-xs text-on-surface font-semibold truncate max-w-[90%]">
              {src.name}
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

                  return (
                    <div
                      key={src.id}
                      onClick={() => handleSelectSource(src.id)}
                      style={{
                        position: 'absolute',
                        left,
                        top,
                        width,
                        height,
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

                  return (
                    <div
                      key={src.id}
                      onClick={() => handleSelectSource(src.id)}
                      style={{
                        position: 'absolute',
                        left,
                        top,
                        width,
                        height,
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
