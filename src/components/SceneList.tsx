import React, { useState, useRef } from 'react';
import { Layers, Plus, Trash2, Copy, Edit2, FileDown, Check } from 'lucide-react';
import { Scene } from '../types/studio';
import { importObsCollection } from '../utils/obsImporter';

interface SceneListProps {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onAddScene: (name: string) => void;
  onRenameScene: (id: string, newName: string) => void;
  onDuplicateScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
  onImportScenes: (importedScenes: Scene[]) => void;
}

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onRenameScene,
  onDuplicateScene,
  onDeleteScene,
  onImportScenes,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartCreate = () => {
    setNewSceneName(`Escena ${scenes.length + 1}`);
    setIsCreating(true);
  };

  const handleConfirmCreate = () => {
    if (newSceneName.trim()) {
      onAddScene(newSceneName.trim());
      setNewSceneName('');
      setIsCreating(false);
    }
  };

  const handleStartRename = (scene: Scene, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSceneId(scene.id);
    setEditName(scene.name);
  };

  const handleConfirmRename = (id: string) => {
    if (editName.trim()) {
      onRenameScene(id, editName.trim());
    }
    setEditingSceneId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importObsCollection(content);
      if (res.success && res.scenes.length > 0) {
        onImportScenes(res.scenes);
        setImportNotice(`¡${res.scenes.length} escenas importadas con éxito de OBS!`);
        setTimeout(() => setImportNotice(null), 4000);
      } else {
        alert(res.error || 'No se pudo importar el archivo de OBS.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-surface-low border border-surface-high rounded p-2.5 flex flex-col h-full shadow-sm select-none">
      {/* Header con Controles (Stitch Escenas Maestras) */}
      <div className="flex items-center justify-between pb-1.5 border-b border-surface-high/60 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-200">
          <Layers className="h-3.5 w-3.5 text-oxide-rust" />
          <span>Escenas ({scenes.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Botón Importar OBS */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Importar colección de escenas de OBS Studio (.json)"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-lowest hover:bg-surface text-gray-300 hover:text-white border border-surface-high text-[11px] font-mono transition-colors"
          >
            <FileDown className="h-3 w-3 text-oxide-rust" />
            <span className="hidden sm:inline">OBS Sync</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          {/* Botón Agregar Escena */}
          <button
            type="button"
            onClick={handleStartCreate}
            title="Agregar nueva escena"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-high hover:bg-surface-highest text-cyber-cyan border border-surface-high text-[11px] font-mono font-semibold transition-colors shadow-xs"
          >
            <Plus className="h-3 w-3" />
            <span>Nueva</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div className="mb-1.5 p-1.5 bg-cyber-green/15 border border-cyber-green/40 rounded text-[11px] text-cyber-green font-mono flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-cyber-green" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Creador Inline de Escena */}
      {isCreating && (
        <div className="mb-1.5 p-1.5 bg-surface border border-surface-high rounded flex items-center gap-2">
          <input
            type="text"
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
            placeholder="Nombre de la escena..."
            autoFocus
            className="flex-1 bg-surface-lowest border border-surface-high px-2 py-0.5 rounded text-xs text-white focus:outline-none focus:border-oxide-rust font-sans"
          />
          <button
            type="button"
            onClick={handleConfirmCreate}
            className="px-2 py-0.5 bg-oxide-rust text-white rounded text-xs font-mono font-semibold hover:bg-orange-600"
          >
            Crear
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-2 py-0.5 bg-surface-high text-gray-400 rounded text-xs hover:text-white"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Lista Desplazable de Escenas */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {scenes.map((scene, idx) => {
          const isActive = scene.id === activeSceneId;
          const isEditing = editingSceneId === scene.id;

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`group flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-surface-highest border-oxide-rust/60 text-white font-medium shadow-xs'
                  : 'bg-surface border-surface-high text-gray-400 hover:bg-surface-high hover:text-gray-200'
              }`}
            >
              {isEditing ? (
                <div
                  className="flex items-center gap-1.5 flex-1 mr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename(scene.id)}
                    autoFocus
                    className="flex-1 bg-surface-lowest border border-oxide-rust px-2 py-0.5 rounded text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmRename(scene.id)}
                    className="p-1 text-cyber-green hover:text-green-300"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isActive ? 'bg-oxide-rust animate-pulse' : 'bg-surface-high'
                    }`}
                  />
                  <span className={`truncate ${isActive ? 'text-oxide-rust-light font-bold' : ''}`}>
                    {scene.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ({scene.sources.length})
                  </span>
                </div>
              )}

              {/* Tally EN VIVO & Hotkey & Acciones */}
              <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                {isActive && (
                  <span className="px-1.5 py-0.2 rounded bg-oxide-rust text-white font-mono text-[9px] font-bold">
                    EN VIVO
                  </span>
                )}
                <span className="text-[10px] font-mono text-gray-500">
                  Ctrl+{idx + 1}
                </span>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(scene, e)}
                    title="Renombrar escena"
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-surface-highest"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateScene(scene.id);
                    }}
                    title="Duplicar escena"
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-surface-highest"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar la escena "${scene.name}"?`)) {
                          onDeleteScene(scene.id);
                        }
                      }}
                      title="Eliminar escena"
                      className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
