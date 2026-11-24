import React, { useState } from 'react';
import {
  Monitor,
  Video,
  Smartphone,
  Tv,
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
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
            <Monitor className="h-8 w-8 text-blue-400 mb-1 opacity-70" />
            <span className="text-xs text-blue-200 font-semibold truncate max-w-[90%]">
              {src.name}
            </span>
            <span className="text-[10px] font-mono text-blue-300/80">
              {isVertical ? 'WGC Recorte 9:16' : '1920×1080 WGC'}
            </span>
          </div>
        );
      case 'camera':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none bg-oxide-rust/10">
            <Video className="h-6 w-6 text-oxide-rust mb-1" />
            <span className="text-xs text-white font-medium truncate max-w-[90%]">
              {src.name}
            </span>
            <span className="text-[9px] font-mono text-orange-200">
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
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none bg-purple-950/20">
            <Globe className="h-5 w-5 text-purple-400 mb-1" />
            <span className="text-xs text-purple-200 font-medium truncate max-w-[90%]">
              {src.name}
            </span>
            <span className="text-[9px] font-mono text-purple-400 truncate max-w-[90%]">
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
          <div className="w-full h-full flex flex-col items-center justify-center p-2 select-none bg-green-950/20">
            <ImageIcon className="h-6 w-6 text-green-400 mb-1" />
            <span className="text-xs text-green-200 font-medium truncate max-w-[90%]">
              {src.name}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0">
      {/* Barra Superior del Dual-Canvas */}
      <div className="bg-oxide-surface border border-gray-800 rounded-lg px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-oxide-rust" />
            <span className="text-sm font-semibold text-white">Vista Dual-Canvas</span>
            {activeScene && (
              <span className="text-xs text-orange-400 font-medium px-2 py-0.5 rounded bg-orange-950/40 border border-orange-900/40">
                {activeScene.name}
              </span>
            )}
          </div>

          <div className="h-4 w-[1px] bg-gray-800" />

          {/* Selector de Fuentes para Inspección */}
          <div className="flex items-center gap-1.5 bg-gray-900/80 p-1 rounded-md border border-gray-800 overflow-x-auto max-w-md">
            {sources.map((src) => (
              <button
                key={src.id}
                onClick={() => handleSelectSource(src.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                  selectedSourceId === src.id
                    ? 'bg-gray-800 text-white font-medium shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {src.type === 'camera' ? (
                  <Video className="h-3 w-3 text-oxide-rust" />
                ) : src.type === 'text' ? (
                  <Type className="h-3 w-3 text-yellow-400" />
                ) : (
                  <Monitor className="h-3 w-3 text-blue-400" />
                )}
                <span>{src.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Indicador de Sincronización Inteligente */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSmartAnchor}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-colors border ${
              smartAnchorActive
                ? 'bg-orange-950/40 text-orange-400 border-orange-500/40 hover:bg-orange-900/50'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
            title="Sincronización inteligente de capas entre lienzos 16:9 y 9:16"
          >
            <Sparkles className="h-3 w-3 text-oxide-rust" />
            <span>Sincronización Inteligente: {smartAnchorActive ? 'ACTIVA' : 'PAUSADA'}</span>
          </button>

          <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
            Zero-Copy VRAM
          </span>
        </div>
      </div>

      {/* Espacio Central: Ambos Lienzos Lado a Lado */}
      <div className="flex-1 grid grid-cols-12 gap-4 items-stretch min-h-[360px]">
        {/* Lienzo 1: Horizontal (16:9) */}
        <div className="col-span-7 flex flex-col bg-oxide-surface border border-gray-800 rounded-lg p-3 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-blue-400" />
              <h2 className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
                Lienzo Horizontal (16:9)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-300">
                1920×1080 @ 60 FPS
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/50 text-[10px] font-mono">
                Twitch / YouTube
              </span>
            </div>
          </div>

          {/* Área de Visualización 16:9 */}
          <div className="flex-1 bg-black rounded border border-gray-800 relative overflow-hidden flex items-center justify-center p-2">
            <div className="w-full aspect-video bg-gray-950 rounded relative overflow-hidden border border-gray-850 shadow-2xl">
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
                          ? 'border-2 border-orange-500 ring-2 ring-orange-500/30 z-20 shadow-lg'
                          : 'border border-gray-700/60 hover:border-gray-500 z-10'
                      }`}
                    >
                      {renderSourceContent(src, false)}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Lienzo 2: Vertical (9:16) */}
        <div className="col-span-5 flex flex-col bg-oxide-surface border border-gray-800 rounded-lg p-3 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-pink-400" />
              <h2 className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
                Lienzo Vertical (9:16)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-300">
                1080×1920
              </span>
              <span className="px-2 py-0.5 rounded bg-pink-950/60 text-pink-400 border border-pink-900/50 text-[10px] font-mono">
                TikTok / Shorts
              </span>
            </div>
          </div>

          {/* Área de Visualización 9:16 */}
          <div className="flex-1 bg-black rounded border border-gray-800 relative overflow-hidden flex items-center justify-center p-2">
            <div className="h-full aspect-[9/16] bg-gray-950 rounded relative overflow-hidden border border-gray-850 shadow-2xl">
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
                          ? 'border-2 border-orange-500 ring-2 ring-orange-500/30 z-20 shadow-lg'
                          : 'border border-gray-700/60 hover:border-gray-500 z-10'
                      }`}
                    >
                      {renderSourceContent(src, true)}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
