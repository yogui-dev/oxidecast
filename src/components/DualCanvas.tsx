import React, { useState } from 'react';
import {
  Monitor,
  Video,
  Smartphone,
  Link2,
  Tv,
  Layers,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import {
  calculateVerticalAnchor,
  CANVAS_9_16,
  Rect,
  LayerType,
} from '../utils/layoutMath';

export interface VisualLayer {
  id: string;
  name: string;
  type: LayerType;
  rect16_9: Rect;
  color: string;
}

const DEFAULT_LAYERS: VisualLayer[] = [
  {
    id: 'game-capture',
    name: 'Juego / Pantalla',
    type: 'game',
    rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
    color: '#3B82F6', // Blue
  },
  {
    id: 'webcam-source',
    name: 'Cámara Web',
    type: 'camera',
    rect16_9: { x: 1440, y: 810, width: 480, height: 270 },
    color: '#FF5722', // Oxide Rust
  },
];

export const DualCanvas: React.FC = () => {
  const [layers] = useState<VisualLayer[]>(DEFAULT_LAYERS);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('game-capture');
  const [smartAnchorActive, setSmartAnchorActive] = useState<boolean>(true);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || layers[0];
  const verticalRect = calculateVerticalAnchor(
    selectedLayer.rect16_9,
    CANVAS_9_16,
    selectedLayer.type
  );

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0">
      {/* Barra Superior del Dual-Canvas */}
      <div className="bg-oxide-surface border border-gray-800 rounded-lg px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-oxide-rust" />
            <span className="text-sm font-semibold text-white">Vista Dual-Canvas</span>
          </div>

          <div className="h-4 w-[1px] bg-gray-800" />

          {/* Selector de Capas para Inspección */}
          <div className="flex items-center gap-1.5 bg-gray-900/80 p-1 rounded-md border border-gray-800">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                  selectedLayerId === layer.id
                    ? 'bg-gray-800 text-white font-medium shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {layer.type === 'game' ? (
                  <Monitor className="h-3 w-3 text-blue-400" />
                ) : (
                  <Video className="h-3 w-3 text-oxide-rust" />
                )}
                <span>{layer.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Indicador de Sincronización Inteligente */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSmartAnchorActive((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-colors border ${
              smartAnchorActive
                ? 'bg-orange-950/40 text-orange-400 border-orange-500/40 hover:bg-orange-900/50'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
            title="Sincronización inteligente de capas entre lienzos"
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
            <div className="w-full aspect-video bg-gray-950 rounded relative overflow-hidden border border-gray-850 shadow-2xl flex items-center justify-center">
              {/* Capa de Juego en 16:9 */}
              <div className="absolute inset-0 bg-blue-950/20 border-2 border-blue-500/40 rounded flex flex-col items-center justify-center pointer-events-none">
                <Monitor className="h-10 w-10 text-blue-500/50 mb-1" />
                <span className="text-xs text-blue-300 font-medium">Juego / Pantalla</span>
                <span className="text-[10px] font-mono text-blue-400/80">1920×1080 (Base)</span>
              </div>

              {/* Capa de Cámara en 16:9 (PiP esquina inferior derecha) */}
              <div className="absolute bottom-3 right-3 w-1/4 aspect-video bg-oxide-rust/20 border-2 border-oxide-rust rounded flex flex-col items-center justify-center shadow-lg backdrop-blur-xs">
                <Video className="h-5 w-5 text-oxide-rust mb-0.5" />
                <span className="text-[11px] text-white font-medium">Cámara Web</span>
                <span className="text-[9px] font-mono text-orange-200">480×270 PiP</span>
              </div>

              {/* Marca de agua / Rejilla */}
              <div className="absolute top-2 left-2 text-[10px] font-mono text-gray-500">
                Lienzo Maestro
              </div>
            </div>
          </div>
        </div>

        {/* Lienzo 2: Vertical (9:16) */}
        <div className="col-span-5 flex flex-col bg-oxide-surface border border-gray-800 rounded-lg p-3 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-oxide-rust" />
              <h2 className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
                Lienzo Vertical (9:16)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] font-mono text-gray-300">
                1080×1920 @ 60 FPS
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-950/60 text-orange-400 border border-orange-900/50 text-[10px] font-mono">
                TikTok / Reels
              </span>
            </div>
          </div>

          {/* Área de Visualización 9:16 */}
          <div className="flex-1 bg-black rounded border border-gray-800 relative overflow-hidden flex items-center justify-center p-2">
            <div className="h-full aspect-[9/16] bg-gray-950 rounded relative overflow-hidden border border-gray-850 shadow-2xl flex flex-col">
              {/* Tercio Superior: Cámara Web Anclada */}
              <div className="h-1/3 w-full border-b border-dashed border-gray-800/80 bg-oxide-rust/15 flex flex-col items-center justify-center relative">
                <Video className="h-7 w-7 text-oxide-rust mb-1" />
                <span className="text-xs text-white font-medium">Cámara Web</span>
                <span className="text-[9px] font-mono text-orange-300">
                  Tercio Superior (1080×608)
                </span>
                <span className="absolute top-1 left-1 text-[8px] font-mono bg-gray-900/80 px-1 rounded text-orange-400">
                  Anclaje Auto
                </span>
              </div>

              {/* Tercio Central: Juego / Pantalla Centrada Proporcional */}
              <div className="h-1/3 w-full border-b border-dashed border-gray-800/80 bg-blue-950/25 flex flex-col items-center justify-center relative">
                <Monitor className="h-7 w-7 text-blue-400 mb-1" />
                <span className="text-xs text-blue-200 font-medium">Juego / Pantalla</span>
                <span className="text-[9px] font-mono text-blue-300">
                  Centrado Inteligente (1080×608)
                </span>
                <span className="absolute top-1 left-1 text-[8px] font-mono bg-gray-900/80 px-1 rounded text-blue-400">
                  Sin Deformación
                </span>
              </div>

              {/* Tercio Inferior: Chat u Overlays */}
              <div className="h-1/3 w-full bg-purple-950/15 flex flex-col items-center justify-center relative">
                <Sparkles className="h-6 w-6 text-purple-400/70 mb-1" />
                <span className="text-xs text-purple-200 font-medium">Chat y Alertas</span>
                <span className="text-[9px] font-mono text-purple-400">
                  Tercio Inferior (Feed Unificado)
                </span>
                <span className="absolute top-1 left-1 text-[8px] font-mono bg-gray-900/80 px-1 rounded text-purple-400">
                  TikTok / Shorts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspector de Coordenadas Reactivas (Telemetría de Anclaje) */}
      <div className="bg-oxide-surface border border-gray-800 rounded-lg px-4 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <Link2 className="h-4 w-4 text-oxide-rust" />
          <span className="text-gray-400">
            Capa Activa: <strong className="text-white">{selectedLayer.name}</strong>
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">
            Horizontal (16:9):{' '}
            <span className="text-blue-400">
              [{selectedLayer.rect16_9.x}, {selectedLayer.rect16_9.y}] (
              {selectedLayer.rect16_9.width}×{selectedLayer.rect16_9.height})
            </span>
          </span>
          <span className="text-gray-600">➔</span>
          <span className="text-gray-400">
            Vertical (9:16 Anclado):{' '}
            <span className="text-orange-400">
              [{verticalRect.x}, {verticalRect.y}] ({verticalRect.width}×{verticalRect.height})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-500">
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Relación 1:1 Preservada</span>
        </div>
      </div>
    </div>
  );
};

export default DualCanvas;
