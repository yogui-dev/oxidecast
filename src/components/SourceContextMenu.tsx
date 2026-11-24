import React, { useEffect, useRef } from 'react';
import {
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Maximize2,
  Expand,
  Crosshair,
  RotateCcw,
  SlidersHorizontal,
  Settings,
  Copy,
  Trash2,
  Check,
} from 'lucide-react';
import { SourceItem } from '../types/studio';

export interface SourceContextMenuProps {
  source: SourceItem;
  x: number;
  y: number;
  onClose: () => void;
  onToggleMirror: () => void;
  onToggleFlipVertical: () => void;
  onRotate: (deg: 0 | 90 | 180 | 270) => void;
  onFitToScreen: () => void;
  onStretchToScreen: () => void;
  onCenterToScreen: () => void;
  onResetTransform: () => void;
  onOpenFilters: () => void;
  onOpenProperties?: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
}

export const SourceContextMenu: React.FC<SourceContextMenuProps> = ({
  source,
  x,
  y,
  onClose,
  onToggleMirror,
  onToggleFlipVertical,
  onRotate,
  onFitToScreen,
  onStretchToScreen,
  onCenterToScreen,
  onResetTransform,
  onOpenFilters,
  onOpenProperties,
  onDuplicate,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose]);

  // Contención de coordenadas dentro de la ventana visible
  const menuWidth = 240;
  const menuHeight = 350;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const safeLeft = Math.max(8, Math.min(x, windowWidth - menuWidth - 8));
  const safeTop = Math.max(8, Math.min(y, windowHeight - menuHeight - 8));

  const currentRotation = source.transform?.rotation || 0;
  const nextRotation = ((currentRotation + 90) % 360) as 0 | 90 | 180 | 270;
  const isMirror = !!source.transform?.flipHorizontal;
  const isFlipV = !!source.transform?.flipVertical;

  return (
    <div
      ref={menuRef}
      style={{ left: `${safeLeft}px`, top: `${safeTop}px` }}
      className="fixed z-50 w-60 bg-[#181B25] border border-[#262A34] rounded-lg shadow-2xl py-1.5 text-xs text-gray-200 font-sans select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Cabecera de la Fuente */}
      <div className="px-3 py-1.5 border-b border-[#262A34] mb-1 flex items-center justify-between">
        <span className="font-semibold text-white truncate max-w-[140px] text-[11px]" title={source.name}>
          {source.name}
        </span>
        <span
          data-testid="context-menu-type-badge"
          className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-[#262A34] text-cyber-cyan border border-surface-high"
        >
          {source.type}
        </span>
      </div>

      {/* Sección Transformar */}
      <div className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
        Transformar
      </div>

      {/* Voltear Horizontalmente (Modo Espejo) */}
      <button
        type="button"
        data-testid="context-menu-item-mirror"
        data-active={isMirror}
        onClick={() => {
          onToggleMirror();
          onClose();
        }}
        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#262A34] transition-colors ${
          isMirror ? 'text-oxide-rust font-semibold bg-[#262A34]/50' : 'text-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <FlipHorizontal className={`h-3.5 w-3.5 ${isMirror ? 'text-oxide-rust' : 'text-gray-400'}`} />
          <span>Voltear Horizontalmente (Modo Espejo)</span>
        </div>
        {isMirror && <Check className="h-3.5 w-3.5 text-oxide-rust shrink-0" />}
      </button>

      {/* Voltear Verticalmente */}
      <button
        type="button"
        data-testid="context-menu-item-flip-v"
        data-active={isFlipV}
        onClick={() => {
          onToggleFlipVertical();
          onClose();
        }}
        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#262A34] transition-colors ${
          isFlipV ? 'text-oxide-rust font-semibold bg-[#262A34]/50' : 'text-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <FlipVertical className={`h-3.5 w-3.5 ${isFlipV ? 'text-oxide-rust' : 'text-gray-400'}`} />
          <span>Voltear Verticalmente</span>
        </div>
        {isFlipV && <Check className="h-3.5 w-3.5 text-oxide-rust shrink-0" />}
      </button>

      {/* Rotar 90° */}
      <button
        type="button"
        onClick={() => {
          onRotate(nextRotation);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#262A34] text-gray-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <RotateCw className="h-3.5 w-3.5 text-gray-400" />
          <span>Rotar 90° ({currentRotation}°)</span>
        </div>
      </button>

      {/* Ajustar a la Pantalla */}
      <button
        type="button"
        onClick={() => {
          onFitToScreen();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#262A34] text-gray-200 transition-colors"
      >
        <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
        <span>Ajustar a la Pantalla</span>
      </button>

      {/* Estirar a la Pantalla */}
      <button
        type="button"
        onClick={() => {
          onStretchToScreen();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#262A34] text-gray-200 transition-colors"
      >
        <Expand className="h-3.5 w-3.5 text-gray-400" />
        <span>Estirar a la Pantalla</span>
      </button>

      {/* Centrar en la Pantalla */}
      <button
        type="button"
        onClick={() => {
          onCenterToScreen();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#262A34] text-gray-200 transition-colors"
      >
        <Crosshair className="h-3.5 w-3.5 text-gray-400" />
        <span>Centrar en la Pantalla</span>
      </button>

      {/* Restablecer Transformación */}
      <button
        type="button"
        onClick={() => {
          onResetTransform();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#262A34] text-gray-400 hover:text-white transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Restablecer Transformación</span>
      </button>

      {/* Separador */}
      <div className="h-px bg-[#262A34] my-1" />

      {/* Filtros... */}
      <button
        type="button"
        onClick={() => {
          onOpenFilters();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#262A34] text-cyber-cyan hover:text-white transition-colors"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-cyber-cyan" />
        <span>Filtros...</span>
      </button>

      {/* Propiedades... */}
      <button
        type="button"
        onClick={() => {
          onOpenProperties?.();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#262A34] text-gray-200 transition-colors"
      >
        <Settings className="h-3.5 w-3.5 text-gray-400" />
        <span>Propiedades...</span>
      </button>

      {/* Duplicar Fuente */}
      <button
        type="button"
        onClick={() => {
          onDuplicate?.();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#262A34] text-gray-200 transition-colors"
      >
        <Copy className="h-3.5 w-3.5 text-gray-400" />
        <span>Duplicar Fuente</span>
      </button>

      {/* Separador */}
      <div className="h-px bg-[#262A34] my-1" />

      {/* Eliminar Fuente */}
      <button
        type="button"
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-red-950/40 text-cyber-red transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5 text-cyber-red" />
        <span>Eliminar Fuente</span>
      </button>
    </div>
  );
};
