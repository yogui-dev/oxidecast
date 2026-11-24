import React, { useState } from 'react';
import {
  Monitor,
  Video,
  Image as ImageIcon,
  Type,
  Globe,
  Palette,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Settings,
  ArrowUp,
  ArrowDown,
  Tv,
  Smartphone,
  Layers,
  X,
  Check,
} from 'lucide-react';
import { SourceItem, SourceType, TargetCanvas } from '../types/studio';

interface SourceListProps {
  sources: SourceItem[];
  selectedSourceId: string | null;
  onSelectSource: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteSource: (id: string) => void;
  onMoveSource: (id: string, direction: 'up' | 'down') => void;
  onAddSource: (source: Omit<SourceItem, 'id'>) => void;
  onUpdateSource: (id: string, updates: Partial<SourceItem>) => void;
}

export const SourceList: React.FC<SourceListProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
  onToggleVisibility,
  onToggleLock,
  onDeleteSource,
  onMoveSource,
  onAddSource,
  onUpdateSource,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceItem | null>(null);

  // Formulario de nueva fuente
  const [newType, setNewType] = useState<SourceType>('screen');
  const [newName, setNewName] = useState('');
  const [newCanvas, setNewCanvas] = useState<TargetCanvas>('both');
  const [newText, setNewText] = useState('Texto en Vivo');
  const [newColor, setNewColor] = useState('#FF5722');
  const [newUrl, setNewUrl] = useState('https://twitch.tv');

  const openAddModal = (type: SourceType) => {
    setNewType(type);
    const names: Record<SourceType, string> = {
      screen: 'Captura de Pantalla',
      window: 'Captura de Ventana',
      camera: 'Cámara Web HD',
      image: 'Superposición de Imagen',
      text: 'Texto / Título',
      browser: 'Fuente de Navegador',
      color: 'Color de Fondo',
    };
    setNewName(names[type]);
    setIsAddModalOpen(true);
  };

  const handleConfirmAdd = () => {
    if (!newName.trim()) return;

    let baseWidth = 1920;
    let baseHeight = 1080;
    let posX = 0;
    let posY = 0;

    if (newType === 'camera') {
      baseWidth = 480;
      baseHeight = 270;
      posX = 1440;
      posY = 810;
    } else if (newType === 'text') {
      baseWidth = 600;
      baseHeight = 100;
      posX = 660;
      posY = 50;
    } else if (newType === 'browser') {
      baseWidth = 450;
      baseHeight = 600;
      posX = 50;
      posY = 300;
    }

    const colorMap: Record<SourceType, string> = {
      screen: '#3B82F6',
      window: '#60A5FA',
      camera: '#FF5722',
      image: '#10B981',
      text: '#F59E0B',
      browser: '#8B5CF6',
      color: newColor,
    };

    onAddSource({
      name: newName.trim(),
      type: newType,
      targetCanvas: newCanvas,
      rect16_9: { x: posX, y: posY, width: baseWidth, height: baseHeight },
      visible: true,
      locked: false,
      color: colorMap[newType],
      properties: {
        text: newType === 'text' ? newText : undefined,
        url: newType === 'browser' ? newUrl : undefined,
        backgroundColor: newType === 'color' ? newColor : undefined,
      },
    });

    setIsAddModalOpen(false);
  };

  const renderSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'screen':
      case 'window':
        return <Monitor className="h-3.5 w-3.5 text-cyber-cyan shrink-0" />;
      case 'camera':
        return <Video className="h-3.5 w-3.5 text-oxide-rust shrink-0" />;
      case 'image':
        return <ImageIcon className="h-3.5 w-3.5 text-cyber-green shrink-0" />;
      case 'text':
        return <Type className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
      case 'browser':
        return <Globe className="h-3.5 w-3.5 text-oxide-lavender shrink-0" />;
      case 'color':
        return <Palette className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
    }
  };

  const cycleTargetCanvas = (source: SourceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCanvas: Record<TargetCanvas, TargetCanvas> = {
      both: 'horizontal',
      horizontal: 'vertical',
      vertical: 'both',
    };
    onUpdateSource(source.id, { targetCanvas: nextCanvas[source.targetCanvas] });
  };

  return (
    <div className="bg-surface-low border border-surface-high rounded p-2.5 flex flex-col h-full shadow-sm select-none">
      {/* Header (Stitch Fuentes & Capas) */}
      <div className="flex items-center justify-between pb-1.5 border-b border-surface-high/60 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-200">
          <Layers className="h-3.5 w-3.5 text-cyber-cyan" />
          <span>Fuentes &amp; Capas ({sources.length})</span>
        </div>

        {/* Dropdown de Agregar Fuente */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-high hover:bg-surface-highest text-cyber-cyan border border-surface-high text-[11px] font-mono font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Agregar Fuente</span>
          </button>

          {/* Menú Flotante de Tipos */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-surface-high rounded shadow-2xl py-1 z-30 hidden group-hover:block hover:block font-mono text-[11px]">
            <button
              onClick={() => openAddModal('screen')}
              className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-surface-high flex items-center gap-2"
            >
              <Monitor className="h-3.5 w-3.5 text-cyber-cyan" />
              <span>Captura Pantalla</span>
            </button>
            <button
              onClick={() => openAddModal('window')}
              className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-surface-high flex items-center gap-2"
            >
              <Monitor className="h-3.5 w-3.5 text-blue-300" />
              <span>Captura Ventana</span>
            </button>
            <button
              onClick={() => openAddModal('camera')}
              className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-surface-high flex items-center gap-2"
            >
              <Video className="h-3.5 w-3.5 text-oxide-rust" />
              <span>Cámara Web HD</span>
            </button>
            <button
              onClick={() => openAddModal('text')}
              className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-surface-high flex items-center gap-2"
            >
              <Type className="h-3.5 w-3.5 text-yellow-400" />
              <span>Texto / Título</span>
            </button>
            <button
              onClick={() => openAddModal('browser')}
              className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-surface-high flex items-center gap-2"
            >
              <Globe className="h-3.5 w-3.5 text-oxide-lavender" />
              <span>Widget Web</span>
            </button>
            <button
              onClick={() => openAddModal('image')}
              className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-surface-high flex items-center gap-2"
            >
              <ImageIcon className="h-3.5 w-3.5 text-cyber-green" />
              <span>Imagen / Logo</span>
            </button>
            <button
              onClick={() => openAddModal('color')}
              className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-surface-high flex items-center gap-2"
            >
              <Palette className="h-3.5 w-3.5 text-gray-400" />
              <span>Fondo Sólido</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista Desplazable de Fuentes */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {sources.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs py-6">
            <Layers className="h-6 w-6 text-gray-600 mb-2" />
            <span>Sin fuentes en esta escena</span>
            <span className="text-[10px] text-gray-600">Presiona "+ Agregar Fuente" para comenzar</span>
          </div>
        ) : (
          sources.map((src, index) => {
            const isSelected = selectedSourceId === src.id;

            return (
              <div
                key={src.id}
                onClick={() => onSelectSource(src.id)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-surface-highest border-cyber-cyan/50 text-white shadow-xs'
                    : 'bg-surface border-surface-high text-gray-300 hover:bg-surface-high'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  {renderSourceIcon(src.type)}
                  <span className={`truncate ${!src.visible ? 'line-through text-gray-500' : ''}`}>
                    {src.name}
                  </span>

                  {/* Badge de Lienzo Destino (DUAL CANVAS, 16:9 ONLY, 9:16 ONLY) */}
                  <button
                    type="button"
                    onClick={(e) => cycleTargetCanvas(src, e)}
                    title={`Lienzo: ${src.targetCanvas} (Clic para alternar)`}
                    className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold flex items-center gap-1 border bg-surface-lowest border-surface-high text-gray-300 hover:border-gray-500"
                  >
                    {src.targetCanvas === 'both' ? (
                      <>
                        <Tv className="h-2.5 w-2.5 text-cyber-cyan" />
                        <Smartphone className="h-2.5 w-2.5 text-oxide-rust" />
                        <span className="text-cyber-cyan">DUAL CANVAS</span>
                      </>
                    ) : src.targetCanvas === 'horizontal' ? (
                      <>
                        <Tv className="h-2.5 w-2.5 text-oxide-rust" />
                        <span className="text-oxide-rust">16:9 ONLY</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-2.5 w-2.5 text-cyber-cyan" />
                        <span className="text-cyber-cyan">9:16 ONLY</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Acciones por Fuente */}
                <div className="flex items-center gap-0.5">
                  {/* Visibilidad */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(src.id);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-surface-highest"
                    title={src.visible ? 'Ocultar fuente' : 'Mostrar fuente'}
                  >
                    {src.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-gray-600" />}
                  </button>

                  {/* Bloqueo */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(src.id);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-surface-highest"
                    title={src.locked ? 'Desbloquear fuente' : 'Bloquear fuente'}
                  >
                    {src.locked ? <Lock className="h-3 w-3 text-oxide-rust" /> : <Unlock className="h-3 w-3 text-gray-500" />}
                  </button>

                  {/* Reordenar Z-Index */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSource(src.id, 'up');
                    }}
                    className={`p-1 rounded ${
                      index === 0
                        ? 'text-gray-700 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-surface-highest'
                    }`}
                    title="Subir capa"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sources.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSource(src.id, 'down');
                    }}
                    className={`p-1 rounded ${
                      index === sources.length - 1
                        ? 'text-gray-700 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-surface-highest'
                    }`}
                    title="Bajar capa"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>

                  {/* Editar Propiedades */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSource(src);
                    }}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-surface-highest"
                    title="Propiedades de la fuente"
                  >
                    <Settings className="h-3 w-3" />
                  </button>

                  {/* Eliminar */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Eliminar la fuente "${src.name}"?`)) {
                        onDeleteSource(src.id);
                      }
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-red-950/40"
                    title="Eliminar fuente"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Agregar Fuente */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-low border border-surface-high rounded-xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-surface-high pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-oxide-rust" />
                Agregar Fuente: {newType.toUpperCase()}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Nombre de la Fuente:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface-lowest border border-surface-high rounded px-3 py-1.5 text-white focus:outline-none focus:border-oxide-rust font-sans"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Lienzo Asignado:</label>
                <select
                  value={newCanvas}
                  onChange={(e) => setNewCanvas(e.target.value as TargetCanvas)}
                  className="w-full bg-surface-lowest border border-surface-high rounded px-3 py-1.5 text-white focus:outline-none focus:border-oxide-rust font-mono text-[11px]"
                >
                  <option value="both">Dual (16:9 Horizontal y 9:16 Vertical)</option>
                  <option value="horizontal">Solo Horizontal (16:9 YouTube / Twitch)</option>
                  <option value="vertical">Solo Vertical (9:16 TikTok / Instagram)</option>
                </select>
              </div>

              {newType === 'text' && (
                <div>
                  <label className="block text-gray-400 mb-1">Texto a mostrar:</label>
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="w-full bg-surface-lowest border border-surface-high rounded px-3 py-1.5 text-white focus:outline-none focus:border-oxide-rust"
                  />
                </div>
              )}

              {newType === 'browser' && (
                <div>
                  <label className="block text-gray-400 mb-1">URL de la fuente web:</label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-surface-lowest border border-surface-high rounded px-3 py-1.5 text-white focus:outline-none focus:border-oxide-rust"
                  />
                </div>
              )}

              {newType === 'color' && (
                <div>
                  <label className="block text-gray-400 mb-1">Color de fondo:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="h-8 w-12 bg-transparent cursor-pointer rounded"
                    />
                    <span className="font-mono text-gray-300">{newColor}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-surface-high">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 bg-surface-high hover:bg-surface-highest text-gray-300 rounded font-medium text-xs font-mono"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="px-4 py-1.5 bg-oxide-rust hover:bg-orange-600 text-white rounded font-medium text-xs flex items-center gap-1 shadow-md font-mono"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Propiedades */}
      {editingSource && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-low border border-surface-high rounded-xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-surface-high pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-oxide-rust" />
                Propiedades: {editingSource.name}
              </h3>
              <button
                onClick={() => setEditingSource(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Nombre:</label>
                <input
                  type="text"
                  value={editingSource.name}
                  onChange={(e) =>
                    setEditingSource({ ...editingSource, name: e.target.value })
                  }
                  className="w-full bg-surface-lowest border border-surface-high rounded px-3 py-1.5 text-white focus:outline-none focus:border-oxide-rust"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Lienzo Asignado:</label>
                <select
                  value={editingSource.targetCanvas}
                  onChange={(e) =>
                    setEditingSource({
                      ...editingSource,
                      targetCanvas: e.target.value as TargetCanvas,
                    })
                  }
                  className="w-full bg-surface-lowest border border-surface-high rounded px-3 py-1.5 text-white focus:outline-none focus:border-oxide-rust font-mono text-[11px]"
                >
                  <option value="both">Dual (16:9 y 9:16)</option>
                  <option value="horizontal">Solo Horizontal (16:9)</option>
                  <option value="vertical">Solo Vertical (9:16)</option>
                </select>
              </div>

              {editingSource.type === 'text' && (
                <div>
                  <label className="block text-gray-400 mb-1">Texto:</label>
                  <input
                    type="text"
                    value={editingSource.properties.text || ''}
                    onChange={(e) =>
                      setEditingSource({
                        ...editingSource,
                        properties: {
                          ...editingSource.properties,
                          text: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-surface-lowest border border-surface-high rounded px-3 py-1.5 text-white focus:outline-none focus:border-oxide-rust"
                  />
                </div>
              )}

              {editingSource.type === 'browser' && (
                <div>
                  <label className="block text-gray-400 mb-1">URL:</label>
                  <input
                    type="url"
                    value={editingSource.properties.url || ''}
                    onChange={(e) =>
                      setEditingSource({
                        ...editingSource,
                        properties: {
                          ...editingSource.properties,
                          url: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-surface-lowest border border-surface-high rounded px-3 py-1.5 text-white focus:outline-none focus:border-oxide-rust"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-surface-high">
              <button
                type="button"
                onClick={() => setEditingSource(null)}
                className="px-3 py-1.5 bg-surface-high hover:bg-surface-highest text-gray-300 rounded font-medium text-xs font-mono"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSource(editingSource.id, editingSource);
                  setEditingSource(null);
                }}
                className="px-4 py-1.5 bg-oxide-rust hover:bg-orange-600 text-white rounded font-medium text-xs flex items-center gap-1 shadow-md font-mono"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
