import React from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';

interface SplitterProps {
  direction: 'horizontal' | 'vertical';
  onDragStart: (e: React.MouseEvent) => void;
  className?: string;
  title?: string;
}

export const Splitter: React.FC<SplitterProps> = ({
  direction,
  onDragStart,
  className = '',
  title,
}) => {
  return (
    <div
      onMouseDown={onDragStart}
      title={
        title ||
        (direction === 'vertical'
          ? 'Arrastra para ajustar ancho'
          : 'Arrastra para ajustar alto')
      }
      className={`group select-none flex items-center justify-center transition-colors shrink-0 z-30 ${
        direction === 'vertical'
          ? 'w-1.5 cursor-col-resize hover:bg-oxide-rust active:bg-oxide-rust bg-surface-high/80'
          : 'h-1.5 cursor-row-resize hover:bg-oxide-rust active:bg-oxide-rust bg-surface-high/80'
      } ${className}`}
    >
      <div className="opacity-0 group-hover:opacity-100 group-active:opacity-100 text-white transition-opacity pointer-events-none">
        {direction === 'vertical' ? (
          <GripVertical className="h-3 w-3" />
        ) : (
          <GripHorizontal className="h-3 w-3" />
        )}
      </div>
    </div>
  );
};

export default Splitter;
