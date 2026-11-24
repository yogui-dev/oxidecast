import React, { useState, useRef, useEffect } from 'react';
import {
  FileDown,
  FileUp,
  Plus,
  Trash2,
  Copy,
  Sliders,
  Radio,
  Eye,
  EyeOff,
  Maximize2,
  Info,
  ExternalLink,
  ShieldCheck,
  Activity,
  Sparkles,
  Columns3,
  ArrowLeftRight,
  RotateCcw,
} from 'lucide-react';

interface MenuBarProps {
  onNewScene: () => void;
  onImportObs: () => void;
  onExportConfig: () => void;
  onDuplicateScene: () => void;
  onDeleteScene: () => void;
  onOpenConnections: () => void;
  onOpenChatChannels: () => void;
  isChatExpanded: boolean;
  onToggleChat: () => void;
  isAudioExpanded: boolean;
  onToggleAudio: () => void;
  isBroadcasting: boolean;
  onToggleBroadcast: () => void;
  onShowAbout: () => void;
  sidebarPosition?: 'left' | 'right';
  onToggleSidebarPosition?: () => void;
  onSwapDocksOrder?: () => void;
  onResetLayout?: () => void;
}

type MenuKey = 'archivo' | 'editar' | 'ver' | 'transmision' | 'herramientas' | 'ayuda' | null;

export const MenuBar: React.FC<MenuBarProps> = ({
  onNewScene,
  onImportObs,
  onExportConfig,
  onDuplicateScene,
  onDeleteScene,
  onOpenConnections,
  onOpenChatChannels,
  isChatExpanded,
  onToggleChat,
  isAudioExpanded,
  onToggleAudio,
  isBroadcasting,
  onToggleBroadcast,
  onShowAbout,
  sidebarPosition = 'right',
  onToggleSidebarPosition,
  onSwapDocksOrder,
  onResetLayout,
}) => {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMenu = (menu: MenuKey) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMenuHover = (menu: MenuKey) => {
    if (openMenu !== null) {
      setOpenMenu(menu);
    }
  };

  const handleAction = (callback: () => void) => {
    callback();
    setOpenMenu(null);
  };

  return (
    <div
      ref={menuBarRef}
      className="h-7 bg-surface-lowest border-b border-surface-high px-4 flex items-center gap-1 select-none text-[12px] font-medium text-gray-300 relative z-40"
    >
      {/* --- MENÚ: ARCHIVO --- */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('archivo')}
          onMouseEnter={() => handleMenuHover('archivo')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            openMenu === 'archivo'
              ? 'bg-surface-high text-white font-semibold'
              : 'hover:bg-surface-high/60 hover:text-white'
          }`}
        >
          Archivo
        </button>

        {openMenu === 'archivo' && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-surface border border-surface-high rounded shadow-2xl py-1 z-50 text-xs">
            <button
              onClick={() => handleAction(onNewScene)}
              className="w-full text-left px-3 py-1.5 hover:bg-surface-high flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 text-oxide-rust" />
                Nueva Escena
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Ctrl+N</span>
            </button>

            <div className="my-1 border-t border-surface-high" />

            <button
              onClick={() => handleAction(onImportObs)}
              className="w-full text-left px-3 py-1.5 hover:bg-surface-high flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <FileDown className="h-3.5 w-3.5 text-cyber-cyan" />
                Importar Colección de OBS Studio...
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Ctrl+O</span>
            </button>

            <button
              onClick={() => handleAction(onExportConfig)}
              className="w-full text-left px-3 py-1.5 hover:bg-surface-high flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <FileUp className="h-3.5 w-3.5 text-cyber-green" />
                Exportar Configuración (.json)...
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Ctrl+S</span>
            </button>

            <div className="my-1 border-t border-gray-800" />

            <button
              onClick={() => handleAction(onOpenConnections)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-yellow-400" />
                Ajustes de Conexiones RTMP...
              </span>
            </button>

            <div className="my-1 border-t border-gray-800" />

            <button
              onClick={() => window.close()}
              className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 text-red-400 flex items-center justify-between"
            >
              <span>Salir</span>
              <span className="text-[10px] text-gray-500 font-mono">Alt+F4</span>
            </button>
          </div>
        )}
      </div>

      {/* --- MENÚ: EDITAR --- */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('editar')}
          onMouseEnter={() => handleMenuHover('editar')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            openMenu === 'editar'
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-800/60 hover:text-white'
          }`}
        >
          Editar
        </button>

        {openMenu === 'editar' && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-gray-900 border border-gray-700/80 rounded-lg shadow-2xl py-1 z-50 text-xs">
            <button
              onClick={() => handleAction(onDuplicateScene)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <Copy className="h-3.5 w-3.5 text-gray-400" />
                Duplicar Escena Actual
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Ctrl+D</span>
            </button>

            <button
              onClick={() => handleAction(onDeleteScene)}
              className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 text-red-400 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar Escena Actual
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Supr</span>
            </button>
          </div>
        )}
      </div>

      {/* --- MENÚ: VER --- */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('ver')}
          onMouseEnter={() => handleMenuHover('ver')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            openMenu === 'ver'
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-800/60 hover:text-white'
          }`}
        >
          Ver
        </button>

        {openMenu === 'ver' && (
          <div className="absolute left-0 top-full mt-1 w-60 bg-gray-900 border border-gray-700/80 rounded-lg shadow-2xl py-1 z-50 text-xs">
            <button
              onClick={() => handleAction(onToggleChat)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                {isChatExpanded ? (
                  <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-green-400" />
                )}
                {isChatExpanded ? 'Ocultar Panel de Chat' : 'Mostrar Panel de Chat'}
              </span>
            </button>

            <button
              onClick={() => handleAction(onToggleAudio)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                {isAudioExpanded ? (
                  <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-green-400" />
                )}
                {isAudioExpanded ? 'Ocultar Mezclador de Audio' : 'Mostrar Mezclador de Audio'}
              </span>
            </button>

            <div className="my-1 border-t border-surface-high" />

            {onToggleSidebarPosition && (
              <button
                onClick={() => handleAction(onToggleSidebarPosition)}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-high flex items-center justify-between text-gray-200"
              >
                <span className="flex items-center gap-2">
                  <Columns3 className="h-3.5 w-3.5 text-cyber-cyan" />
                  {sidebarPosition === 'left' ? 'Mover Barra Lateral a la Derecha' : 'Mover Barra Lateral a la Izquierda'}
                </span>
              </button>
            )}

            {onSwapDocksOrder && (
              <button
                onClick={() => handleAction(onSwapDocksOrder)}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-high flex items-center justify-between text-gray-200"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-oxide-rust" />
                  Intercambiar Posición Escenas / Fuentes
                </span>
              </button>
            )}

            {onResetLayout && (
              <button
                onClick={() => handleAction(onResetLayout)}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-high flex items-center justify-between text-oxide-rust-light"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-oxide-rust" />
                  Restablecer Disposición de Paneles
                </span>
              </button>
            )}

            <div className="my-1 border-t border-surface-high" />

            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
                setOpenMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-surface-high flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <Maximize2 className="h-3.5 w-3.5 text-purple-400" />
                Alternar Pantalla Completa
              </span>
              <span className="text-[10px] text-gray-500 font-mono">F11</span>
            </button>
          </div>
        )}
      </div>

      {/* --- MENÚ: TRANSMISIÓN --- */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('transmision')}
          onMouseEnter={() => handleMenuHover('transmision')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            openMenu === 'transmision'
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-800/60 hover:text-white'
          }`}
        >
          Transmisión
        </button>

        {openMenu === 'transmision' && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-gray-900 border border-gray-700/80 rounded-lg shadow-2xl py-1 z-50 text-xs">
            <button
              onClick={() => handleAction(onToggleBroadcast)}
              className={`w-full text-left px-3 py-1.5 flex items-center justify-between font-semibold ${
                isBroadcasting
                  ? 'bg-red-950/40 text-red-400 hover:bg-red-900/50'
                  : 'text-green-400 hover:bg-green-950/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                {isBroadcasting ? 'Detener Emisión Dual' : 'Iniciar Emisión Dual'}
              </span>
            </button>

            <div className="my-1 border-t border-gray-800" />

            <button
              onClick={() => handleAction(onOpenConnections)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-orange-400" />
                Destinos RTMP (Twitch, YouTube, TikTok, Kick)...
              </span>
            </button>

            <button
              onClick={() => handleAction(onOpenChatChannels)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-cyan-400" />
                Conectar Canales de Chat...
              </span>
            </button>
          </div>
        )}
      </div>

      {/* --- MENÚ: HERRAMIENTAS --- */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('herramientas')}
          onMouseEnter={() => handleMenuHover('herramientas')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            openMenu === 'herramientas'
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-800/60 hover:text-white'
          }`}
        >
          Herramientas
        </button>

        {openMenu === 'herramientas' && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-gray-900 border border-gray-700/80 rounded-lg shadow-2xl py-1 z-50 text-xs">
            <div className="px-3 py-1.5 text-gray-400 flex items-center gap-2 border-b border-gray-800">
              <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
              <span>Limitador DSP: -1.0 dBFS Activo</span>
            </div>
            <div className="px-3 py-1.5 text-gray-400 flex items-center gap-2 border-b border-gray-800">
              <Activity className="h-3.5 w-3.5 text-blue-400" />
              <span>Puerta de Ruido: -45.0 dBFS Activa</span>
            </div>
            <div className="px-3 py-1.5 text-gray-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              <span>Zero-Copy WGC + wgpu</span>
            </div>
          </div>
        )}
      </div>

      {/* --- MENÚ: AYUDA --- */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu('ayuda')}
          onMouseEnter={() => handleMenuHover('ayuda')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            openMenu === 'ayuda'
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-800/60 hover:text-white'
          }`}
        >
          Ayuda
        </button>

        {openMenu === 'ayuda' && (
          <div className="absolute left-0 top-full mt-1 w-60 bg-gray-900 border border-gray-700/80 rounded-lg shadow-2xl py-1 z-50 text-xs">
            <button
              onClick={() => handleAction(onShowAbout)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center gap-2 text-gray-200"
            >
              <Info className="h-3.5 w-3.5 text-orange-400" />
              <span>Acerca de OxideCast...</span>
            </button>

            <a
              href="https://github.com/yogui-dev/oxidecast"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpenMenu(null)}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-800 flex items-center justify-between text-gray-200"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                Repositorio en GitHub
              </span>
              <span className="text-[10px] text-gray-500">v0.1.0</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
