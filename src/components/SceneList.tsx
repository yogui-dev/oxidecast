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
    <div className="bg-oxide-surface border border-gray-800 rounded-lg p-3 flex flex-col h-full shadow-inner">
      {/* Header con Controles */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-300">
          <Layers className="h-3.5 w-3.5 text-oxide-rust" />
          <span>Escenas ({scenes.length})</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botón Importar OBS */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Importar colección de escenas de OBS Studio (.json)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 text-[11px] font-medium transition-colors"
          >
            <FileDown className="h-3 w-3 text-orange-400" />
            <span className="hidden sm:inline">Importar OBS</span>
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
            className="flex items-center gap-1 px-2 py-1 rounded bg-oxide-rust hover:bg-orange-600 text-white text-[11px] font-medium shadow-sm transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Nueva</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div className="mb-2 p-1.5 bg-green-950/60 border border-green-800 rounded text-[11px] text-green-300 font-medium flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-green-400" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Creador Inline de Escena */}
      {isCreating && (
        <div className="mb-2 p-2 bg-gray-900 border border-gray-700 rounded flex items-center gap-2">
          <input
            type="text"
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
            placeholder="Nombre de la escena..."
            autoFocus
            className="flex-1 bg-gray-800 border border-gray-700 px-2 py-1 rounded text-xs text-white focus:outline-none focus:border-orange-500"
          />
          <button
            type="button"
            onClick={handleConfirmCreate}
            className="px-2 py-1 bg-oxide-rust text-white rounded text-xs font-medium hover:bg-orange-600"
          >
            Crear
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs hover:text-white"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Lista Desplazable de Escenas */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {scenes.map((scene) => {
          const isActive = scene.id === activeSceneId;
          const isEditing = editingSceneId === scene.id;

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`group flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-gray-800/90 border-gray-600 text-white font-medium shadow-sm'
                  : 'bg-gray-900/40 border-gray-800/60 text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
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
                    className="flex-1 bg-gray-950 border border-orange-500 px-2 py-0.5 rounded text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmRename(scene.id)}
                    className="p-1 text-green-400 hover:text-green-300"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isActive ? 'bg-orange-500' : 'bg-gray-600'
                    }`}
                  />
                  <span className="truncate">{scene.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ({scene.sources.length})
                  </span>
                </div>
              )}

              {/* Acciones de Escena */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => handleStartRename(scene, e)}
                  title="Renombrar escena"
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700/60"
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
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700/60"
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
          );
        })}
      </div>
    </div>
  );
};
