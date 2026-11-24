import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Sliders,
  Play,
  Square,
  Activity,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { DualCanvas } from './components/DualCanvas';
import { UnifiedChat } from './components/UnifiedChat';
import { SceneList } from './components/SceneList';
import { SourceList } from './components/SourceList';
import { ConnectionsModal } from './components/ConnectionsModal';
import { MenuBar } from './components/MenuBar';
import { AboutModal } from './components/AboutModal';
import {
  loadStudioConfig,
  saveStudioConfig,
  INITIAL_DEFAULT_SCENES,
} from './services/storage';
import {
  StudioConfig,
  Scene,
  SourceItem,
  StreamingDestination,
  ChatChannelConfig,
} from './types/studio';
import { importObsCollection } from './utils/obsImporter';

export const App: React.FC = () => {
  const [config, setConfig] = useState<StudioConfig>(() => loadStudioConfig());
  const [isLive, setIsLive] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isAudioExpanded, setIsAudioExpanded] = useState(true);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const obsFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-guardado en localStorage cada vez que la configuración cambie
  useEffect(() => {
    saveStudioConfig(config);
  }, [config]);

  // Escena activa actual
  const currentScene: Scene =
    config.scenes.find((s) => s.id === config.activeSceneId) ||
    config.scenes[0] ||
    INITIAL_DEFAULT_SCENES[0];

  // Alternar emisión en vivo
  const toggleBroadcast = () => {
    setIsLive((prev) => {
      const nextState = !prev;
      const updatedDestinations = config.destinations.map((d) =>
        d.enabled
          ? {
              ...d,
              status: nextState ? ('live' as const) : ('idle' as const),
            }
          : d
      );
      setConfig((prevConfig) => ({
        ...prevConfig,
        destinations: updatedDestinations,
      }));
      return nextState;
    });
  };

  // --- Handlers de Escenas ---
  const handleSelectScene = (id: string) => {
    setConfig((prev) => ({ ...prev, activeSceneId: id }));
    setSelectedSourceId(null);
  };

  const handleAddScene = (name?: string) => {
    const sceneName = name && name.trim() ? name.trim() : `Escena ${config.scenes.length + 1}`;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: sceneName,
      sources: [],
    };
    setConfig((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      activeSceneId: newScene.id,
    }));
  };

  const handleRenameScene = (id: string, newName: string) => {
    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === id ? { ...s, name: newName } : s)),
    }));
  };

  const handleDuplicateScene = (id?: string) => {
    const targetId = id || currentScene.id;
    const target = config.scenes.find((s) => s.id === targetId);
    if (!target) return;

    const duplicated: Scene = {
      id: `scene-dup-${Date.now()}`,
      name: `${target.name} (Copia)`,
      sources: target.sources.map((src) => ({
        ...src,
        id: `src-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };

    setConfig((prev) => ({
      ...prev,
      scenes: [...prev.scenes, duplicated],
      activeSceneId: duplicated.id,
    }));
  };

  const handleDeleteScene = (id?: string) => {
    if (config.scenes.length <= 1) return;
    const targetId = id || currentScene.id;
    const remaining = config.scenes.filter((s) => s.id !== targetId);
    const nextActive =
      config.activeSceneId === targetId ? remaining[0].id : config.activeSceneId;

    setConfig((prev) => ({
      ...prev,
      scenes: remaining,
      activeSceneId: nextActive,
    }));
  };

  const handleImportScenes = (importedScenes: Scene[]) => {
    if (importedScenes.length === 0) return;
    setConfig((prev) => ({
      ...prev,
      scenes: [...prev.scenes, ...importedScenes],
      activeSceneId: importedScenes[0].id,
    }));
  };

  const handleObsFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importObsCollection(content);
      if (res.success && res.scenes.length > 0) {
        handleImportScenes(res.scenes);
        alert(`¡${res.scenes.length} escenas importadas exitosamente desde OBS Studio!`);
      } else {
        alert(res.error || 'No se pudo importar la colección de OBS.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `oxidecast_profile_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- Handlers de Fuentes ---
  const handleAddSource = (sourceData: Omit<SourceItem, 'id'>) => {
    const newSource: SourceItem = {
      ...sourceData,
      id: `src-${Date.now()}`,
    };

    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === currentScene.id
          ? { ...s, sources: [...s.sources, newSource] }
          : s
      ),
    }));
    setSelectedSourceId(newSource.id);
  };

  const handleToggleVisibility = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === currentScene.id
          ? {
              ...s,
              sources: s.sources.map((src) =>
                src.id === id ? { ...src, visible: !src.visible } : src
              ),
            }
          : s
      ),
    }));
  };

  const handleToggleLock = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === currentScene.id
          ? {
              ...s,
              sources: s.sources.map((src) =>
                src.id === id ? { ...src, locked: !src.locked } : src
              ),
            }
          : s
      ),
    }));
  };

  const handleDeleteSource = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === currentScene.id
          ? { ...s, sources: s.sources.filter((src) => src.id !== id) }
          : s
      ),
    }));
    if (selectedSourceId === id) {
      setSelectedSourceId(null);
    }
  };

  const handleMoveSource = (id: string, direction: 'up' | 'down') => {
    const sources = [...currentScene.sources];
    const index = sources.findIndex((s) => s.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = sources[index];
      sources[index] = sources[index - 1];
      sources[index - 1] = temp;
    } else if (direction === 'down' && index < sources.length - 1) {
      const temp = sources[index];
      sources[index] = sources[index + 1];
      sources[index + 1] = temp;
    }

    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === currentScene.id ? { ...s, sources } : s
      ),
    }));
  };

  const handleUpdateSource = (id: string, updates: Partial<SourceItem>) => {
    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === currentScene.id
          ? {
              ...s,
              sources: s.sources.map((src) =>
                src.id === id ? { ...src, ...updates } : src
              ),
            }
          : s
      ),
    }));
  };

  const handleUpdateDestinations = (destinations: StreamingDestination[]) => {
    setConfig((prev) => ({ ...prev, destinations }));
  };

  const handleUpdateChannels = (chatChannels: ChatChannelConfig[]) => {
    setConfig((prev) => ({ ...prev, chatChannels }));
  };

  const enabledDestinationsCount = config.destinations.filter((d) => d.enabled).length;

  return (
    <div className="min-h-screen bg-oxide-canvas text-gray-200 flex flex-col font-sans select-none">
      {/* Header Bar */}
      <header className="h-12 border-b border-gray-800 bg-oxide-surface px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-oxide-rust flex items-center justify-center text-white shadow-md">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              OxideCast
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-orange-400 font-mono font-medium border border-gray-700">
                v0.1.0-release
              </span>
            </h1>
          </div>
        </div>

        {/* Live & Connections Controls */}
        <div className="flex items-center gap-2.5">
          {/* Botón Gestión de Conexiones */}
          <button
            type="button"
            onClick={() => setIsConnectionsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-200 hover:text-white transition-colors shadow-sm"
          >
            <Settings className="h-3.5 w-3.5 text-orange-400" />
            <span>Conexiones ({enabledDestinationsCount} Activas)</span>
          </button>

          {/* Indicador de Estado */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 border border-gray-800 rounded text-xs font-mono">
            <Activity className={`h-3 w-3 ${isLive ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
            <span className={isLive ? 'text-green-400 font-semibold' : 'text-gray-400'}>
              {isLive ? 'EN VIVO' : 'STANDBY'}
            </span>
          </div>

          {/* Botón de Transmisión */}
          <button
            onClick={toggleBroadcast}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-md font-medium text-xs transition-all duration-150 shadow-md ${
              isLive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-oxide-rust hover:bg-orange-600 text-white active:scale-95'
            }`}
          >
            {isLive ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                Detener Emisión
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Iniciar Emisión Dual
              </>
            )}
          </button>
        </div>
      </header>

      {/* Barra de Menús Superior de Escritorio (Desktop MenuBar) */}
      <MenuBar
        onNewScene={() => handleAddScene()}
        onImportObs={() => obsFileInputRef.current?.click()}
        onExportConfig={handleExportConfig}
        onDuplicateScene={() => handleDuplicateScene()}
        onDeleteScene={() => handleDeleteScene()}
        onOpenConnections={() => setIsConnectionsOpen(true)}
        onOpenChatChannels={() => setIsChatExpanded(true)}
        isChatExpanded={isChatExpanded}
        onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
        isAudioExpanded={isAudioExpanded}
        onToggleAudio={() => setIsAudioExpanded(!isAudioExpanded)}
        isBroadcasting={isLive}
        onToggleBroadcast={toggleBroadcast}
        onShowAbout={() => setIsAboutOpen(true)}
      />

      {/* Input Oculto para Selección de Archivo OBS */}
      <input
        type="file"
        ref={obsFileInputRef}
        onChange={handleObsFileInputChange}
        accept=".json"
        className="hidden"
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 p-3 grid grid-cols-12 gap-3 overflow-hidden">
        {/* Canvas & Stream Preview */}
        <section className="col-span-8 flex flex-col gap-3 overflow-y-auto">
          <DualCanvas
            activeScene={currentScene}
            selectedSourceId={selectedSourceId}
            onSelectSource={setSelectedSourceId}
          />

          {/* Dock Dinámico de Escenas y Fuentes */}
          <div className="h-44 grid grid-cols-2 gap-3">
            <SceneList
              scenes={config.scenes}
              activeSceneId={config.activeSceneId}
              onSelectScene={handleSelectScene}
              onAddScene={handleAddScene}
              onRenameScene={handleRenameScene}
              onDuplicateScene={handleDuplicateScene}
              onDeleteScene={handleDeleteScene}
              onImportScenes={handleImportScenes}
            />

            <SourceList
              sources={currentScene.sources}
              selectedSourceId={selectedSourceId}
              onSelectSource={setSelectedSourceId}
              onToggleVisibility={handleToggleVisibility}
              onToggleLock={handleToggleLock}
              onDeleteSource={handleDeleteSource}
              onMoveSource={handleMoveSource}
              onAddSource={handleAddSource}
              onUpdateSource={handleUpdateSource}
            />
          </div>
        </section>

        {/* Right Sidebar - Audio, Telemetry & Unified Chat */}
        <aside className="col-span-4 flex flex-col gap-2.5 overflow-y-auto">
          {/* Chat Unificado con Canales Conectables */}
          {isChatExpanded && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-oxide-rust" />
                  Interacción Omnicanal
                </span>
                <button
                  type="button"
                  onClick={() => setIsChatExpanded(false)}
                  className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors"
                >
                  Ocultar
                </button>
              </div>

              <div className="h-64 mb-1 flex flex-col">
                <UnifiedChat
                  channels={config.chatChannels}
                  onUpdateChannels={handleUpdateChannels}
                />
              </div>
            </div>
          )}

          {/* Mezclador de Audio WASAPI */}
          {isAudioExpanded && (
            <div className="flex-1 bg-oxide-surface border border-gray-800 rounded-lg p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    <Sliders className="h-3 w-3 text-oxide-rust" />
                    Mezclador de Audio (DSP / WASAPI)
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAudioExpanded(false)}
                    className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors"
                  >
                    Ocultar
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Audio del Escritorio</span>
                      <span className="text-gray-500 font-mono">-6.0 dBFS</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isLive ? 'bg-green-500 w-[72%]' : 'bg-gray-700 w-[20%]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Micrófono (Puerta -45 dB | Limitador -1 dB)</span>
                      <span className="text-gray-500 font-mono">-12.0 dBFS</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isLive ? 'bg-green-500 w-[58%]' : 'bg-gray-700 w-[15%]'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-gray-800/80 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <span>Peak Limiter: -1.0 dBFS Activo</span>
                <span>Noise Gate: -45.0 dBFS</span>
              </div>
            </div>
          )}

          {/* Telemetría de Red y Hardware */}
          <div className="h-36 bg-oxide-surface border border-gray-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <Activity className="h-3 w-3 text-oxide-rust" />
              Telemetría de Red y Hardware (RTX 4050)
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <div className="p-1.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-500 block text-[9px]">CPU</span>
                <span className="text-gray-200 font-semibold">{isLive ? '2.4%' : '0.9%'}</span>
              </div>
              <div className="p-1.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-500 block text-[9px]">RAM</span>
                <span className="text-gray-200 font-semibold">{isLive ? '42 MB' : '38 MB'}</span>
              </div>
              <div className="p-1.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-500 block text-[9px]">FPS DUAL</span>
                <span className="text-gray-200 font-semibold">{isLive ? '60.0' : '0.0'}</span>
              </div>
              <div className="p-1.5 bg-gray-900/60 rounded border border-gray-800">
                <span className="text-gray-500 block text-[9px]">BITRATE TOTAL</span>
                <span className="text-gray-200 font-semibold">
                  {isLive ? '11,000 kbps' : '0 kbps'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Modal de Conexiones de Streaming */}
      <ConnectionsModal
        isOpen={isConnectionsOpen}
        onClose={() => setIsConnectionsOpen(false)}
        destinations={config.destinations}
        onUpdateDestinations={handleUpdateDestinations}
        isBroadcasting={isLive}
        onToggleBroadcast={toggleBroadcast}
      />

      {/* Modal Acerca de OxideCast */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Footer Status Bar */}
      <footer className="h-7 border-t border-gray-800 bg-oxide-surface px-4 flex items-center justify-between text-[10px] font-mono text-gray-400">
        <div className="flex items-center gap-4">
          <span>Motor: <span className="text-gray-200 font-semibold">Rust / Tokio</span></span>
          <span>Audio: <span className="text-gray-200 font-semibold">WASAPI DSP Puro</span></span>
          <span>Render: <span className="text-gray-200 font-semibold">wgpu / Zero-Copy</span></span>
          <span className="text-orange-400 font-semibold">Creado con orgullo en Chile 🇨🇱</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-green-600'}`} />
            {isLive ? 'Transmitiendo Dual 16:9 + 9:16' : 'Tauri v2 IPC Conectado'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
