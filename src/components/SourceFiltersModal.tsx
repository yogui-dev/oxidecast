import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Palette,
  Sparkles,
  Crop as CropIcon,
  Wand2,
  Check,
} from 'lucide-react';
import { SourceItem, SourceFilterSettings } from '../types/studio';
import { DEFAULT_SOURCE_FILTERS } from '../services/storage';

export interface SourceFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: SourceItem | null;
  onUpdateFilters: (sourceId: string, filters: SourceFilterSettings) => void;
}

type TabType = 'color' | 'chroma' | 'effects' | 'crop';

export const SourceFiltersModal: React.FC<SourceFiltersModalProps> = ({
  isOpen,
  onClose,
  source,
  onUpdateFilters,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('color');

  if (!isOpen || !source) return null;

  const filters: SourceFilterSettings = {
    ...DEFAULT_SOURCE_FILTERS,
    ...(source.filters || {}),
    chromaKey: {
      ...DEFAULT_SOURCE_FILTERS.chromaKey,
      ...(source.filters?.chromaKey || {}),
    },
    crop: {
      ...DEFAULT_SOURCE_FILTERS.crop,
      ...(source.filters?.crop || {}),
    },
  };

  const updateFilters = (updates: Partial<SourceFilterSettings>) => {
    onUpdateFilters(source.id, {
      ...filters,
      ...updates,
    });
  };

  const updateChromaKey = (updates: Partial<SourceFilterSettings['chromaKey']>) => {
    onUpdateFilters(source.id, {
      ...filters,
      chromaKey: {
        ...filters.chromaKey,
        ...updates,
      },
    });
  };

  const updateCrop = (updates: Partial<SourceFilterSettings['crop']>) => {
    onUpdateFilters(source.id, {
      ...filters,
      crop: {
        ...filters.crop,
        ...updates,
      },
    });
  };

  const handleResetFilters = () => {
    onUpdateFilters(source.id, DEFAULT_SOURCE_FILTERS);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-surface-low border border-surface-high rounded-xl max-w-2xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Cabecera Estilo Obsidian & Slate con Acentos Óxido y Cian */}
        <div className="px-5 py-3.5 border-b border-surface-high bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-oxide-rust/10 border border-oxide-rust/30 text-oxide-rust">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Filtros para: {source.name}
              </h2>
              <span className="text-[10px] font-mono text-gray-400">
                Aceleración GPU por Capa // Zero-Copy Shaders
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-surface-high transition-colors"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Barra de Pestañas / Categorías */}
        <div className="px-4 pt-2.5 border-b border-surface-high bg-surface-lowest flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('color')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'color'
                ? 'border-oxide-rust text-white bg-surface-low'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-surface-high/50'
            }`}
          >
            <Palette className="h-3.5 w-3.5 text-oxide-rust" />
            <span>Corrección de Color</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chroma')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'chroma'
                ? 'border-cyber-green text-white bg-surface-low'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-surface-high/50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyber-green" />
            <span>Fondo y Clave Croma</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('effects')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'effects'
                ? 'border-cyber-cyan text-white bg-surface-low'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-surface-high/50'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5 text-cyber-cyan" />
            <span>Efectos & Nitidez</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'crop'
                ? 'border-cyber-purple text-white bg-surface-low'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-surface-high/50'
            }`}
          >
            <CropIcon className="h-3.5 w-3.5 text-cyber-purple" />
            <span>Recorte</span>
          </button>
        </div>

        {/* Cuerpo Principal del Modal */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-surface-low text-xs">
          {/* TAB 1: CORRECCIÓN DE COLOR */}
          {activeTab === 'color' && (
            <div className="space-y-4">
              <div className="text-[11px] text-gray-400 font-mono mb-2">
                Ajusta parámetros de luminancia, crominancia y tono de la señal en tiempo real.
              </div>

              {/* Opacidad */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="filter-opacity" className="font-semibold text-gray-200">
                    Opacidad
                  </label>
                  <span className="font-mono text-oxide-rust font-bold">
                    {Math.round(filters.opacity * 100)}%
                  </span>
                </div>
                <input
                  id="filter-opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.opacity}
                  onChange={(e) => updateFilters({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-oxide-rust cursor-pointer"
                />
              </div>

              {/* Brillo */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="filter-brightness" className="font-semibold text-gray-200">
                    Brillo
                  </label>
                  <span className="font-mono text-oxide-rust font-bold">
                    {filters.brightness.toFixed(2)}x
                  </span>
                </div>
                <input
                  id="filter-brightness"
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={filters.brightness}
                  onChange={(e) => updateFilters({ brightness: parseFloat(e.target.value) })}
                  className="w-full accent-oxide-rust cursor-pointer"
                />
              </div>

              {/* Contraste */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="filter-contrast" className="font-semibold text-gray-200">
                    Contraste
                  </label>
                  <span className="font-mono text-oxide-rust font-bold">
                    {filters.contrast.toFixed(2)}x
                  </span>
                </div>
                <input
                  id="filter-contrast"
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={filters.contrast}
                  onChange={(e) => updateFilters({ contrast: parseFloat(e.target.value) })}
                  className="w-full accent-oxide-rust cursor-pointer"
                />
              </div>

              {/* Saturación */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="filter-saturation" className="font-semibold text-gray-200">
                    Saturación
                  </label>
                  <span className="font-mono text-oxide-rust font-bold">
                    {filters.saturation.toFixed(2)}x
                  </span>
                </div>
                <input
                  id="filter-saturation"
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={filters.saturation}
                  onChange={(e) => updateFilters({ saturation: parseFloat(e.target.value) })}
                  className="w-full accent-oxide-rust cursor-pointer"
                />
              </div>

              {/* Cambio de Tono */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="filter-huerotate" className="font-semibold text-gray-200">
                    Cambio de Tono
                  </label>
                  <span className="font-mono text-oxide-rust font-bold">
                    {filters.hueRotate}°
                  </span>
                </div>
                <input
                  id="filter-huerotate"
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={filters.hueRotate}
                  onChange={(e) => updateFilters({ hueRotate: parseInt(e.target.value, 10) })}
                  className="w-full accent-oxide-rust cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: FONDO Y CLAVE CROMA */}
          {activeTab === 'chroma' && (
            <div className="space-y-4">
              <div className="text-[11px] text-gray-400 font-mono mb-2">
                Filtro de sustitución de fondo por pantalla verde o azul con control de similitud y suavizado de bordes.
              </div>

              {/* Switch Habilitar Croma */}
              <div className="flex items-center justify-between bg-surface p-3.5 rounded-lg border border-surface-high">
                <div className="flex flex-col">
                  <label htmlFor="chroma-enabled" className="font-semibold text-gray-200 cursor-pointer">
                    Habilitar Clave Croma
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Elimina el color seleccionado haciéndolo transparente
                  </span>
                </div>
                <input
                  id="chroma-enabled"
                  type="checkbox"
                  checked={filters.chromaKey.enabled}
                  onChange={(e) => updateChromaKey({ enabled: e.target.checked })}
                  className="h-5 w-5 accent-cyber-green rounded cursor-pointer"
                />
              </div>

              {/* Selector de Color de Clave */}
              <div className="space-y-2 bg-surface p-3.5 rounded-lg border border-surface-high">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-200">Color de Clave</span>
                  <span className="font-mono text-[11px] text-gray-400">
                    {filters.chromaKey.color}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateChromaKey({ color: '#00FF00' })}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                      filters.chromaKey.color.toUpperCase() === '#00FF00'
                        ? 'bg-green-950/70 border-cyber-green text-cyber-green'
                        : 'bg-surface-low border-surface-high text-gray-300 hover:bg-surface-high'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#00FF00] inline-block border border-white/20" />
                    <span>Verde</span>
                    {filters.chromaKey.color.toUpperCase() === '#00FF00' && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => updateChromaKey({ color: '#0000FF' })}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                      filters.chromaKey.color.toUpperCase() === '#0000FF'
                        ? 'bg-blue-950/70 border-blue-400 text-blue-400'
                        : 'bg-surface-low border-surface-high text-gray-300 hover:bg-surface-high'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#0000FF] inline-block border border-white/20" />
                    <span>Azul</span>
                    {filters.chromaKey.color.toUpperCase() === '#0000FF' && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-low border border-surface-high">
                    <input
                      type="color"
                      aria-label="Color personalizado"
                      value={filters.chromaKey.color}
                      onChange={(e) => updateChromaKey({ color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] text-gray-400 font-mono">Personalizado</span>
                  </div>
                </div>
              </div>

              {/* Similitud */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="chroma-similarity" className="font-semibold text-gray-200">
                    Similitud
                  </label>
                  <span className="font-mono text-cyber-green font-bold">
                    {filters.chromaKey.similarity}%
                  </span>
                </div>
                <input
                  id="chroma-similarity"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={filters.chromaKey.similarity}
                  onChange={(e) =>
                    updateChromaKey({ similarity: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-cyber-green cursor-pointer"
                />
              </div>

              {/* Suavidad */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="chroma-smoothness" className="font-semibold text-gray-200">
                    Suavidad
                  </label>
                  <span className="font-mono text-cyber-green font-bold">
                    {filters.chromaKey.smoothness}%
                  </span>
                </div>
                <input
                  id="chroma-smoothness"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={filters.chromaKey.smoothness}
                  onChange={(e) =>
                    updateChromaKey({ smoothness: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-cyber-green cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: EFECTOS & NITIDEZ */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              <div className="text-[11px] text-gray-400 font-mono mb-2">
                Filtros visuales creativos, desenfoque gaussiano y transformaciones de color artísticas.
              </div>

              {/* Desenfoque (Blur) */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="filter-blur" className="font-semibold text-gray-200">
                    Desenfoque
                  </label>
                  <span className="font-mono text-cyber-cyan font-bold">
                    {filters.blur} px
                  </span>
                </div>
                <input
                  id="filter-blur"
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={filters.blur}
                  onChange={(e) => updateFilters({ blur: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyber-cyan cursor-pointer"
                />
              </div>

              {/* Escala de Grises */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="filter-grayscale" className="font-semibold text-gray-200">
                    Escala de Grises
                  </label>
                  <span className="font-mono text-cyber-cyan font-bold">
                    {Math.round(filters.grayscale * 100)}%
                  </span>
                </div>
                <input
                  id="filter-grayscale"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.grayscale}
                  onChange={(e) => updateFilters({ grayscale: parseFloat(e.target.value) })}
                  className="w-full accent-cyber-cyan cursor-pointer"
                />
              </div>

              {/* Sepia */}
              <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                <div className="flex justify-between items-center">
                  <label htmlFor="filter-sepia" className="font-semibold text-gray-200">
                    Sepia
                  </label>
                  <span className="font-mono text-cyber-cyan font-bold">
                    {Math.round(filters.sepia * 100)}%
                  </span>
                </div>
                <input
                  id="filter-sepia"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.sepia}
                  onChange={(e) => updateFilters({ sepia: parseFloat(e.target.value) })}
                  className="w-full accent-cyber-cyan cursor-pointer"
                />
              </div>

              {/* Invertir Colores */}
              <div className="flex items-center justify-between bg-surface p-3.5 rounded-lg border border-surface-high">
                <div className="flex flex-col">
                  <label htmlFor="filter-invert" className="font-semibold text-gray-200 cursor-pointer">
                    Invertir Colores
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Invierte todos los canales RGB a sus tonos complementarios
                  </span>
                </div>
                <input
                  id="filter-invert"
                  type="checkbox"
                  checked={filters.invert}
                  onChange={(e) => updateFilters({ invert: e.target.checked })}
                  className="h-5 w-5 accent-cyber-cyan rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: RECORTE (CROP) */}
          {activeTab === 'crop' && (
            <div className="space-y-4">
              <div className="text-[11px] text-gray-400 font-mono mb-2">
                Ajusta los márgenes de recorte en píxeles para encuadrar o recortar bordes de la fuente.
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Arriba */}
                <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                  <div className="flex justify-between items-center">
                    <label htmlFor="crop-top" className="font-semibold text-gray-200">
                      Arriba
                    </label>
                    <span className="font-mono text-cyber-purple font-bold">
                      {filters.crop.top} px
                    </span>
                  </div>
                  <input
                    id="crop-top"
                    type="number"
                    min="0"
                    max="1080"
                    value={filters.crop.top}
                    onChange={(e) => updateCrop({ top: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-surface-lowest border border-surface-high rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyber-purple"
                  />
                </div>

                {/* Abajo */}
                <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                  <div className="flex justify-between items-center">
                    <label htmlFor="crop-bottom" className="font-semibold text-gray-200">
                      Abajo
                    </label>
                    <span className="font-mono text-cyber-purple font-bold">
                      {filters.crop.bottom} px
                    </span>
                  </div>
                  <input
                    id="crop-bottom"
                    type="number"
                    min="0"
                    max="1080"
                    value={filters.crop.bottom}
                    onChange={(e) => updateCrop({ bottom: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-surface-lowest border border-surface-high rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyber-purple"
                  />
                </div>

                {/* Izquierda */}
                <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                  <div className="flex justify-between items-center">
                    <label htmlFor="crop-left" className="font-semibold text-gray-200">
                      Izquierda
                    </label>
                    <span className="font-mono text-cyber-purple font-bold">
                      {filters.crop.left} px
                    </span>
                  </div>
                  <input
                    id="crop-left"
                    type="number"
                    min="0"
                    max="1920"
                    value={filters.crop.left}
                    onChange={(e) => updateCrop({ left: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-surface-lowest border border-surface-high rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyber-purple"
                  />
                </div>

                {/* Derecha */}
                <div className="space-y-1.5 bg-surface p-3 rounded-lg border border-surface-high">
                  <div className="flex justify-between items-center">
                    <label htmlFor="crop-right" className="font-semibold text-gray-200">
                      Derecha
                    </label>
                    <span className="font-mono text-cyber-purple font-bold">
                      {filters.crop.right} px
                    </span>
                  </div>
                  <input
                    id="crop-right"
                    type="number"
                    min="0"
                    max="1920"
                    value={filters.crop.right}
                    onChange={(e) => updateCrop({ right: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-surface-lowest border border-surface-high rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyber-purple"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal con Restablecer Filtros y Botón Cerrar */}
        <div className="px-5 py-3.5 border-t border-surface-high bg-surface flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 rounded-lg border border-surface-high bg-surface-low hover:bg-surface-high text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-oxide-rust" />
            <span>Restablecer Filtros</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-oxide-rust hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
