import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Sliders,
  Play,
  Square,
  Activity,
  MessageSquare,
  Settings,
  Disc,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react';
import { DualCanvas } from './components/DualCanvas';
import { UnifiedChat } from './components/UnifiedChat';
import { SceneList } from './components/SceneList';
import { SourceList } from './components/SourceList';
import { ConnectionsModal } from './components/ConnectionsModal';
import { MenuBar } from './components/MenuBar';
import { AboutModal } from './components/AboutModal';
import { Splitter } from './components/Splitter';
import {
  loadStudioConfig,
  saveStudioConfig,
  INITIAL_DEFAULT_SCENES,
  loadWorkspaceLayout,
  saveWorkspaceLayout,
  resetWorkspaceLayout,
} from './services/storage';
import {
  StudioConfig,
  Scene,
  SourceItem,
  StreamingDestination,
  ChatChannelConfig,
  WorkspaceLayout,
} from './types/studio';
import { importObsCollection } from './utils/obsImporter';

export const App: React.FC = () => {
  const [config, setConfig] = useState<StudioConfig>(() => loadStudioConfig());
  const [layout, setLayout] = useState<WorkspaceLayout>(() => loadWorkspaceLayout());
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isBufferActive, setIsBufferActive] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const obsFileInputRef = useRef<HTMLInputElement>(null);
  const mainContainerRef = useRef<HTMLElement>(null);

  // Auto-guardado en localStorage cada vez que la configuración cambie
  useEffect(() => {
    saveStudioConfig(config);
  }, [config]);

  // Auto-guardado de la disposición personalizada del workspace
  useEffect(() => {
    saveWorkspaceLayout(layout);
  }, [layout]);

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
    downloadAnchor.setAttribute('download', `oxidecast-config-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- Handlers de Fuentes ---
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
          ? {
              ...s,
              sources: s.sources.filter((src) => src.id !== id),
            }
          : s
      ),
    }));
    if (selectedSourceId === id) {
      setSelectedSourceId(null);
    }
  };

  const handleMoveSource = (id: string, direction: 'up' | 'down') => {
    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== currentScene.id) return s;
        const index = s.sources.findIndex((src) => src.id === id);
        if (index < 0) return s;

        const newSources = [...s.sources];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSources.length) return s;

        const temp = newSources[index];
        newSources[index] = newSources[targetIndex];
        newSources[targetIndex] = temp;

        return { ...s, sources: newSources };
      }),
    }));
  };

  const handleAddSource = (newSourceData: Omit<SourceItem, 'id'>) => {
    const newSource: SourceItem = {
      ...newSourceData,
      id: `source-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === currentScene.id
          ? {
              ...s,
              sources: [...s.sources, newSource],
            }
          : s
      ),
    }));
    setSelectedSourceId(newSource.id);
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

  // --- Handlers de Redimensionamiento y Reordenamiento de Layout ---
  const handleStartResizeSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = mainContainerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const initialPercent = layout.sidebarWidthPercent;
    const containerWidth = container.getBoundingClientRect().width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const factor = layout.sidebarPosition === 'right' ? -1 : 1;
      const newPercent = Math.min(Math.max(initialPercent + deltaPercent * factor, 18), 50);

      setLayout((prev) => ({ ...prev, sidebarWidthPercent: Math.round(newPercent) }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleStartResizeBottomDock = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const initialHeight = layout.bottomDockHeightPx;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.min(Math.max(initialHeight - deltaY, 130), 450);

      setLayout((prev) => ({ ...prev, bottomDockHeightPx: Math.round(newHeight) }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleStartResizeDocks = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const initialPercent = layout.scenesWidthPercent;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / 700) * 100;
      const newPercent = Math.min(Math.max(initialPercent + deltaPercent, 20), 80);

      setLayout((prev) => ({ ...prev, scenesWidthPercent: Math.round(newPercent) }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleStartResizeChat = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const initialHeight = layout.chatHeightPx;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.min(Math.max(initialHeight + deltaY, 150), 480);

      setLayout((prev) => ({ ...prev, chatHeightPx: Math.round(newHeight) }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleToggleSidebarPosition = () => {
    setLayout((prev) => ({
      ...prev,
      sidebarPosition: prev.sidebarPosition === 'right' ? 'left' : 'right',
    }));
  };

  const handleSwapDocksOrder = () => {
    setLayout((prev) => ({
      ...prev,
      dockOrder: prev.dockOrder[0] === 'scenes' ? ['sources', 'scenes'] : ['scenes', 'sources'],
    }));
  };

  const handleResetLayout = () => {
    const defaultLayout = resetWorkspaceLayout();
    setLayout(defaultLayout);
  };

  const enabledDestinationsCount = config.destinations.filter((d) => d.enabled).length;

  // Renderizador de la sección principal (DualCanvas + Bahía Inferior)
  const renderMainSection = () => (
    <section
      style={{
        width: `calc(${100 - layout.sidebarWidthPercent}% - 6px)`,
      }}
      className="flex flex-col min-w-0 overflow-hidden"
    >
      {/* Canvas & Stream Preview */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-1.5">
        <DualCanvas
          activeScene={currentScene}
          selectedSourceId={selectedSourceId}
          onSelectSource={setSelectedSourceId}
        />
      </div>

      {/* Divisor Arrastrable Horizontal */}
      <Splitter
        direction="horizontal"
        onDragStart={handleStartResizeBottomDock}
        title="Arrastra para redimensionar la bahía inferior de Escenas y Fuentes"
      />

      {/* Dock Dinámico de Escenas y Fuentes */}
      <div
        style={{ height: `${layout.bottomDockHeightPx}px` }}
        className="pt-1.5 flex items-stretch gap-1.5 min-h-[120px] max-h-[500px]"
      >
        {layout.dockOrder[0] === 'scenes' ? (
          <>
            <div style={{ width: `calc(${layout.scenesWidthPercent}% - 3px)` }} className="h-full">
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
            </div>
            <Splitter
              direction="vertical"
              onDragStart={handleStartResizeDocks}
              title="Arrastra para cambiar proporción entre Escenas y Fuentes"
            />
            <div style={{ width: `calc(${100 - layout.scenesWidthPercent}% - 3px)` }} className="h-full">
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
          </>
        ) : (
          <>
            <div style={{ width: `calc(${100 - layout.scenesWidthPercent}% - 3px)` }} className="h-full">
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
            <Splitter
              direction="vertical"
              onDragStart={handleStartResizeDocks}
              title="Arrastra para cambiar proporción entre Escenas y Fuentes"
            />
            <div style={{ width: `calc(${layout.scenesWidthPercent}% - 3px)` }} className="h-full">
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
            </div>
          </>
        )}
      </div>
    </section>
  );

  // Renderizador de la barra lateral (Chat, Audio DSP y Telemetría)
  const renderSidebar = () => (
    <aside
      style={{ width: `${layout.sidebarWidthPercent}%` }}
      className="flex flex-col min-w-[240px] max-w-[600px] overflow-hidden"
    >
      {/* Cabecera Táctica del Dock de Control */}
      <div className="flex items-center justify-between pb-1 px-0.5 text-[10px] font-mono text-gray-400">
        <span className="flex items-center gap-1 font-bold text-gray-300 uppercase tracking-wider">
          <ArrowLeftRight className="h-3 w-3 text-cyber-cyan" />
          <span>Panel Lateral ({layout.sidebarPosition === 'right' ? 'Derecho' : 'Izquierdo'})</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggleSidebarPosition}
            title={`Mover barra a la ${layout.sidebarPosition === 'right' ? 'izquierda' : 'derecha'}`}
            className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface hover:bg-surface-high border border-surface-high text-cyber-cyan transition-colors"
          >
            <span>⇄ {layout.sidebarPosition === 'right' ? 'A Izquierda' : 'A Derecha'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
        {/* Chat Unificado con Canales Conectables */}
        {layout.isChatExpanded && (
          <div
            style={{ height: `${layout.chatHeightPx}px` }}
            className="flex flex-col shrink-0 min-h-[140px] max-h-[500px]"
          >
            <div className="flex items-center justify-between mb-1 px-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3 text-oxide-rust" />
                Interacción Omnicanal
              </span>
              <button
                type="button"
                onClick={() => setLayout((prev) => ({ ...prev, isChatExpanded: false }))}
                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface hover:bg-surface-high text-gray-400 hover:text-white border border-surface-high transition-colors"
              >
                Ocultar
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <UnifiedChat
                channels={config.chatChannels}
                onUpdateChannels={handleUpdateChannels}
              />
            </div>
          </div>
        )}

        {layout.isChatExpanded && (
          <Splitter
            direction="horizontal"
            onDragStart={handleStartResizeChat}
            title="Arrastra para ajustar alto del chat"
          />
        )}

        {/* Mezclador de Audio WASAPI DSP (Stitch Professional Console) */}
        {layout.isAudioExpanded && (
          <div className="flex-1 bg-surface-low border border-surface-high rounded p-2.5 flex flex-col justify-between shadow-xs min-h-[140px]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-200">
                  <Sliders className="h-3.5 w-3.5 text-oxide-rust" />
                  <span>Mezclador WASAPI DSP</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[9px]">
                  <span className="px-1.5 py-0.2 rounded bg-surface border border-surface-high text-cyber-cyan font-bold">
                    GATE -45dB
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-oxide-rust text-white font-bold">
                    LIMITER -1dB
                  </span>
                  <button
                    type="button"
                    onClick={() => setLayout((prev) => ({ ...prev, isAudioExpanded: false }))}
                    className="ml-1 text-[10px] px-1 py-0.2 rounded bg-surface hover:bg-surface-high text-gray-400 hover:text-white border border-surface-high transition-colors"
                  >
                    Ocultar
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {/* Canal 1: Audio del Escritorio */}
                <div className="bg-surface p-1.5 rounded border border-surface-high flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px] text-gray-300">
                    <span className="font-medium">Audio del Escritorio</span>
                    <span className="text-cyber-cyan font-mono font-bold">-6.0 dBFS</span>
                  </div>
                  {/* Vúmetro Segmentado */}
                  <div className="w-full h-2 bg-surface-lowest rounded-xs overflow-hidden flex gap-0.5 p-0.5 border border-surface-high">
                    <div className={`h-full ${isLive ? 'bg-cyber-cyan w-[68%]' : 'bg-surface-high w-[20%]'}`} />
                    <div className={`h-full ${isLive ? 'bg-oxide-rust w-[12%]' : 'bg-surface-high/50 w-[4%]'}`} />
                    <div className="h-full bg-surface-lowest flex-1" />
                  </div>
                  <div className="flex items-center justify-between pt-0.5 text-[9px] font-mono text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="px-1 py-0.2 rounded bg-surface-high text-gray-300 hover:text-white cursor-pointer">MUTE</span>
                      <span className="px-1 py-0.2 rounded bg-surface-high text-gray-400 hover:text-cyber-cyan cursor-pointer">SOLO</span>
                    </div>
                    <span>Sidechain Ducking: ON</span>
                  </div>
                </div>

                {/* Canal 2: Micrófono */}
                <div className="bg-surface p-1.5 rounded border border-surface-high flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px] text-gray-300">
                    <span className="font-medium">Micrófono (Puerta -45 dB | Limitador -1 dB)</span>
                    <span className="text-cyber-cyan font-mono font-bold">-12.0 dBFS</span>
                  </div>
                  {/* Vúmetro Segmentado */}
                  <div className="w-full h-2 bg-surface-lowest rounded-xs overflow-hidden flex gap-0.5 p-0.5 border border-surface-high">
                    <div className={`h-full ${isLive ? 'bg-cyber-cyan w-[54%]' : 'bg-surface-high w-[15%]'}`} />
                    <div className={`h-full ${isLive ? 'bg-oxide-rust w-[10%]' : 'bg-surface-high/50 w-[3%]'}`} />
                    <div className="h-full bg-surface-lowest flex-1" />
                  </div>
                  <div className="flex items-center justify-between pt-0.5 text-[9px] font-mono text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="px-1 py-0.2 rounded bg-surface-high text-gray-300 hover:text-white cursor-pointer">MUTE</span>
                      <span className="px-1 py-0.2 rounded bg-surface-high text-gray-400 hover:text-cyber-cyan cursor-pointer">SOLO</span>
                    </div>
                    <span>WASAPI Buff: 1.3ms</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-surface-high flex justify-between items-center text-[9px] text-gray-400 font-mono">
              <span>Peak Limiter: -1.0 dBFS Activo</span>
              <span>Noise Gate: -45.0 dBFS</span>
            </div>
          </div>
        )}

        {/* Telemetría de Red y Hardware (RTX 4050) */}
        <div className="h-36 shrink-0 bg-surface-low border border-surface-high rounded p-2.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-200">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyber-cyan" />
              <span>Telemetría de Red y Hardware</span>
            </div>
            <span className="text-[10px] font-mono text-cyber-cyan font-semibold">ESTADO ÓPTIMO</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div className="p-1.5 bg-surface rounded border border-surface-high">
              <span className="text-gray-500 block text-[9px]">CPU (TOKIO WORKER)</span>
              <span className="text-gray-200 font-semibold">{isLive ? '2.4%' : '0.9%'}</span>
            </div>
            <div className="p-1.5 bg-surface rounded border border-surface-high">
              <span className="text-gray-500 block text-[9px]">RAM (INGEST RUST)</span>
              <span className="text-cyber-cyan font-semibold">{isLive ? '42 MB' : '38 MB'}</span>
            </div>
            <div className="p-1.5 bg-surface rounded border border-surface-high">
              <span className="text-gray-500 block text-[9px]">FPS DUAL</span>
              <span className="text-gray-200 font-semibold">{isLive ? '60.0 SOLID' : '0.0'}</span>
            </div>
            <div className="p-1.5 bg-surface rounded border border-surface-high">
              <span className="text-gray-500 block text-[9px]">BITRATE AGREGADO</span>
              <span className="text-cyber-cyan font-semibold">
                {isLive ? '11.0 Mbps' : '0.0 Mbps'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface-lowest text-gray-200 flex flex-col font-sans select-none">
      {/* Header Bar Workstation (Stitch Workstation Header) */}
      <header className="h-12 border-b border-surface-high bg-surface-low px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded bg-oxide-rust flex items-center justify-center text-white shadow-sm">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              OxideCast Studio
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-surface-high text-oxide-rust-light font-mono font-medium">
                v0.1.0-release
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-surface-high text-cyber-cyan font-mono font-medium hidden sm:inline">
                🇨🇱 CL-PROD-NODE
              </span>
            </h1>
          </div>
        </div>

        {/* Live & Connections Controls */}
        <div className="flex items-center gap-2">
          {/* Botón Gestión de Conexiones */}
          <button
            type="button"
            onClick={() => setIsConnectionsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface hover:bg-surface-high border border-surface-high text-xs font-mono font-semibold text-gray-200 hover:text-white transition-colors shadow-xs"
          >
            <Settings className="h-3.5 w-3.5 text-cyber-cyan" />
            <span>Conexiones ({enabledDestinationsCount} Activas)</span>
          </button>

          {/* Indicador de Estado */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-lowest border border-surface-high rounded text-xs font-mono">
            <Activity className={`h-3 w-3 ${isLive ? 'text-cyber-green animate-pulse' : 'text-gray-500'}`} />
            <span className={isLive ? 'text-cyber-green font-bold' : 'text-gray-400'}>
              {isLive ? 'EN VIVO' : 'STANDBY'}
            </span>
          </div>

          {/* Botón Maestro de Transmisión */}
          <button
            onClick={toggleBroadcast}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded font-mono font-bold text-xs uppercase tracking-wider transition-all duration-150 ${
              isLive
                ? 'bg-cyber-red hover:bg-red-700 text-white shadow-[0_0_12px_rgba(255,0,0,0.5)]'
                : 'bg-oxide-rust hover:bg-orange-600 text-white shadow-[0_0_14px_rgba(255,87,34,0.4)] active:scale-95'
            }`}
          >
            {isLive ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Detener Emisión</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Iniciar Emisión Dual</span>
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
        onOpenChatChannels={() => setLayout((prev) => ({ ...prev, isChatExpanded: true }))}
        isChatExpanded={layout.isChatExpanded}
        onToggleChat={() => setLayout((prev) => ({ ...prev, isChatExpanded: !prev.isChatExpanded }))}
        isAudioExpanded={layout.isAudioExpanded}
        onToggleAudio={() => setLayout((prev) => ({ ...prev, isAudioExpanded: !prev.isAudioExpanded }))}
        isBroadcasting={isLive}
        onToggleBroadcast={toggleBroadcast}
        onShowAbout={() => setIsAboutOpen(true)}
        sidebarPosition={layout.sidebarPosition}
        onToggleSidebarPosition={handleToggleSidebarPosition}
        onSwapDocksOrder={handleSwapDocksOrder}
        onResetLayout={handleResetLayout}
      />

      {/* Sub-Header Studio Action Bar & Multi-Destination Pipeline (Stitch Ribbon) */}
      <div className="w-full bg-surface-low border-b border-surface-high px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-xs select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-surface-high font-mono text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-cyber-green animate-pulse' : 'bg-cyber-cyan'}`} />
            <span className="text-gray-300 font-semibold">
              {isLive ? 'EN VIVO // DUAL EMISIÓN 16:9 + 9:16' : 'STANDBY // LISTO PARA EMISIÓN'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-surface-high font-mono text-[10px] text-gray-400">
            <span className="text-gray-500">DESTINOS:</span>
            <span className="flex items-center gap-1 text-gray-200 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-red" />YT
              <span className="text-surface-high">•</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-purple" />Twitch
              <span className="text-surface-high">•</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" />TikTok
              <span className="text-surface-high">•</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />Kick
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-surface-high font-mono text-[10px] text-cyber-cyan hidden lg:flex">
            <span>VRAM Ingest:</span>
            <span className="font-bold">1.4ms Zero-Copy</span>
          </div>
        </div>

        {/* Master Action CTA Group */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setIsBufferActive(!isBufferActive)}
            className={`px-2.5 py-0.5 rounded border flex items-center gap-1.5 transition-colors ${
              isBufferActive
                ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50 font-semibold'
                : 'bg-surface hover:bg-surface-high text-gray-300 border-surface-high'
            }`}
          >
            <RotateCcw className="h-3 w-3 text-cyber-cyan" />
            <span>Buffer Repetición</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`px-2.5 py-0.5 rounded border flex items-center gap-1.5 transition-colors ${
              isRecording
                ? 'bg-cyber-red/20 text-cyber-red border-cyber-red/50 font-semibold'
                : 'bg-surface hover:bg-surface-high text-gray-300 border-surface-high'
            }`}
          >
            <Disc className={`h-3 w-3 ${isRecording ? 'text-cyber-red animate-pulse' : 'text-gray-400'}`} />
            <span>Grabar Máster (ProRes 422)</span>
          </button>
        </div>
      </div>

      {/* Input Oculto para Selección de Archivo OBS */}
      <input
        type="file"
        ref={obsFileInputRef}
        onChange={handleObsFileInputChange}
        accept=".json"
        className="hidden"
      />

      {/* Main Studio Viewport (Modular Dockable Workspace with Resizable Splitters) */}
      <main
        ref={mainContainerRef}
        className="flex-1 p-2 flex overflow-hidden gap-1"
      >
        {/* Posición lateral izquierda si está configurada */}
        {layout.sidebarPosition === 'left' && renderSidebar()}
        {layout.sidebarPosition === 'left' && (
          <Splitter
            direction="vertical"
            onDragStart={handleStartResizeSidebar}
            title="Arrastra para cambiar ancho de la barra lateral"
          />
        )}

        {/* Sección central principal (Lienzos y Bahía de Escenas/Fuentes) */}
        {renderMainSection()}

        {/* Posición lateral derecha (predeterminada) */}
        {layout.sidebarPosition === 'right' && (
          <Splitter
            direction="vertical"
            onDragStart={handleStartResizeSidebar}
            title="Arrastra para cambiar ancho de la barra lateral"
          />
        )}
        {layout.sidebarPosition === 'right' && renderSidebar()}
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
      <footer className="h-7 border-t border-surface-high bg-surface-lowest px-4 flex items-center justify-between text-[10px] font-mono text-gray-400 select-none">
        <div className="flex items-center gap-4">
          <span>Motor: <span className="text-cyber-cyan font-semibold">Rust / Tokio</span></span>
          <span>Audio: <span className="text-gray-200 font-semibold">WASAPI DSP Puro</span></span>
          <span>Render: <span className="text-gray-200 font-semibold">wgpu / Zero-Copy</span></span>
          <span className="text-oxide-rust font-semibold">Creado con orgullo en Chile 🇨🇱</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-cyber-green animate-pulse' : 'bg-cyber-green'}`} />
            {isLive ? 'Transmitiendo Dual 16:9 + 9:16' : 'Tauri v2 IPC Conectado'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
