import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SourceContextMenu } from '../src/components/SourceContextMenu';
import { SourceList } from '../src/components/SourceList';
import { SourceItem } from '../src/types/studio';
import {
  DEFAULT_SOURCE_TRANSFORM,
  DEFAULT_SOURCE_FILTERS,
} from '../src/services/storage';

describe('SourceContextMenu', () => {
  const mockSource: SourceItem = {
    id: 'src-1',
    name: 'Cámara Web HD',
    type: 'camera',
    targetCanvas: 'both',
    rect16_9: { x: 0, y: 0, width: 480, height: 270 },
    visible: true,
    locked: false,
    color: '#FF5722',
    properties: {},
    transform: { ...DEFAULT_SOURCE_TRANSFORM, flipHorizontal: false },
    filters: { ...DEFAULT_SOURCE_FILTERS },
  };

  const createDefaultProps = () => ({
    source: mockSource,
    x: 100,
    y: 150,
    onClose: vi.fn(),
    onToggleMirror: vi.fn(),
    onToggleFlipVertical: vi.fn(),
    onRotate: vi.fn(),
    onFitToScreen: vi.fn(),
    onStretchToScreen: vi.fn(),
    onCenterToScreen: vi.fn(),
    onResetTransform: vi.fn(),
    onOpenFilters: vi.fn(),
    onOpenProperties: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
  });

  it('debe renderizar la cabecera con el nombre de la fuente y su insignia', () => {
    const props = createDefaultProps();
    render(<SourceContextMenu {...props} />);

    expect(screen.getByText('Cámara Web HD')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-type-badge')).toHaveTextContent(/camera/i);
  });

  it('debe renderizar opciones de Transformar y ejecutar sus callbacks', () => {
    const props = createDefaultProps();
    render(<SourceContextMenu {...props} />);

    // Modo Espejo / Voltear Horizontalmente
    const mirrorBtn = screen.getByText(/Voltear Horizontalmente \(Modo Espejo\)/i);
    expect(mirrorBtn).toBeInTheDocument();
    fireEvent.click(mirrorBtn);
    expect(props.onToggleMirror).toHaveBeenCalledTimes(1);

    // Voltear Verticalmente
    const flipVertBtn = screen.getByText(/Voltear Verticalmente/i);
    expect(flipVertBtn).toBeInTheDocument();
    fireEvent.click(flipVertBtn);
    expect(props.onToggleFlipVertical).toHaveBeenCalledTimes(1);

    // Rotar 90
    const rotateBtn = screen.getByText(/Rotar 90°/i);
    expect(rotateBtn).toBeInTheDocument();
    fireEvent.click(rotateBtn);
    expect(props.onRotate).toHaveBeenCalled();

    // Ajustar a la Pantalla
    const fitBtn = screen.getByText(/Ajustar a la Pantalla/i);
    expect(fitBtn).toBeInTheDocument();
    fireEvent.click(fitBtn);
    expect(props.onFitToScreen).toHaveBeenCalledTimes(1);

    // Estirar a la Pantalla
    const stretchBtn = screen.getByText(/Estirar a la Pantalla/i);
    expect(stretchBtn).toBeInTheDocument();
    fireEvent.click(stretchBtn);
    expect(props.onStretchToScreen).toHaveBeenCalledTimes(1);

    // Centrar en la Pantalla
    const centerBtn = screen.getByText(/Centrar en la Pantalla/i);
    expect(centerBtn).toBeInTheDocument();
    fireEvent.click(centerBtn);
    expect(props.onCenterToScreen).toHaveBeenCalledTimes(1);

    // Restablecer Transformación
    const resetBtn = screen.getByText(/Restablecer Transformación/i);
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(props.onResetTransform).toHaveBeenCalledTimes(1);
  });

  it('debe indicar visualmente cuando el Modo Espejo está activo', () => {
    const activeMirrorSource: SourceItem = {
      ...mockSource,
      transform: { ...DEFAULT_SOURCE_TRANSFORM, flipHorizontal: true },
    };
    const props = {
      ...createDefaultProps(),
      source: activeMirrorSource,
    };
    render(<SourceContextMenu {...props} />);

    const mirrorItem = screen.getByTestId('context-menu-item-mirror');
    expect(mirrorItem.getAttribute('data-active')).toBe('true');
  });

  it('debe ejecutar los callbacks de Filtros, Propiedades, Duplicar y Eliminar', () => {
    const props = createDefaultProps();
    render(<SourceContextMenu {...props} />);

    // Filtros
    const filtersBtn = screen.getByText(/Filtros\.\.\./i);
    fireEvent.click(filtersBtn);
    expect(props.onOpenFilters).toHaveBeenCalledTimes(1);

    // Propiedades
    const propsBtn = screen.getByText(/Propiedades\.\.\./i);
    fireEvent.click(propsBtn);
    expect(props.onOpenProperties).toHaveBeenCalledTimes(1);

    // Duplicar
    const duplicateBtn = screen.getByText(/Duplicar/i);
    fireEvent.click(duplicateBtn);
    expect(props.onDuplicate).toHaveBeenCalledTimes(1);

    // Eliminar
    const deleteBtn = screen.getByText(/Eliminar Fuente|Eliminar/i);
    fireEvent.click(deleteBtn);
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('debe cerrar el menú al presionar la tecla Escape', () => {
    const props = createDefaultProps();
    render(<SourceContextMenu {...props} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('debe cerrar el menú al hacer clic fuera (pointerdown en document)', () => {
    const props = createDefaultProps();
    render(
      <div>
        <div data-testid="outside-element">Afuera</div>
        <SourceContextMenu {...props} />
      </div>
    );

    const outside = screen.getByTestId('outside-element');
    fireEvent.pointerDown(outside);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('contiene las coordenadas dentro de la ventana cuando x o y desbordan', () => {
    // Simulamos ventana de 1000x800
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 800);

    const props = {
      ...createDefaultProps(),
      x: 950,
      y: 750,
    };

    const { container } = render(<SourceContextMenu {...props} />);
    const menuEl = container.firstElementChild as HTMLElement;

    // Con ancho aproximado de 240 y alto de 350, el left debe ser <= 1000 - 240
    const leftStyle = parseInt(menuEl.style.left || '0', 10);
    const topStyle = parseInt(menuEl.style.top || '0', 10);
    expect(leftStyle).toBeLessThanOrEqual(1000 - 240);
    expect(topStyle).toBeLessThanOrEqual(800 - 300);

    vi.unstubAllGlobals();
  });
});

describe('SourceList Context Menu & Quick Action Buttons Integration', () => {
  const sources: SourceItem[] = [
    {
      id: 'src-screen',
      name: 'Captura de Pantalla (Monitor 1)',
      type: 'screen',
      targetCanvas: 'both',
      rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
      visible: true,
      locked: false,
      color: '#3B82F6',
      properties: {},
      transform: { ...DEFAULT_SOURCE_TRANSFORM, flipHorizontal: false },
      filters: { ...DEFAULT_SOURCE_FILTERS },
    },
    {
      id: 'src-camera',
      name: 'Cámara Web HD',
      type: 'camera',
      targetCanvas: 'both',
      rect16_9: { x: 1440, y: 810, width: 480, height: 270 },
      visible: true,
      locked: false,
      color: '#FF5722',
      properties: {},
      transform: { ...DEFAULT_SOURCE_TRANSFORM, flipHorizontal: true },
      filters: { ...DEFAULT_SOURCE_FILTERS },
    },
  ];

  it('debe renderizar botones rápidos de Modo Espejo y Filtros en cada fila de fuente', () => {
    const onUpdateSource = vi.fn();
    const onOpenFilters = vi.fn();

    render(
      <SourceList
        sources={sources}
        selectedSourceId="src-screen"
        onSelectSource={vi.fn()}
        onToggleVisibility={vi.fn()}
        onToggleLock={vi.fn()}
        onDeleteSource={vi.fn()}
        onMoveSource={vi.fn()}
        onAddSource={vi.fn()}
        onUpdateSource={onUpdateSource}
        onOpenFilters={onOpenFilters}
      />
    );

    // Botones de modo espejo
    const mirrorButtons = screen.getAllByTitle(/Modo Espejo/i);
    expect(mirrorButtons).toHaveLength(2);

    // Botones de filtros
    const filtersButtons = screen.getAllByTitle(/Filtros/i);
    expect(filtersButtons).toHaveLength(2);

    // Clic en botón rápido de modo espejo para src-screen debe activar flipHorizontal
    fireEvent.click(mirrorButtons[0]);
    expect(onUpdateSource).toHaveBeenCalledWith(
      'src-screen',
      expect.objectContaining({
        transform: expect.objectContaining({ flipHorizontal: true }),
      })
    );

    // Clic en botón rápido de filtros debe invocar onOpenFilters
    fireEvent.click(filtersButtons[0]);
    expect(onOpenFilters).toHaveBeenCalledWith(sources[0]);
  });

  it('debe abrir el SourceContextMenu al hacer clic derecho en una fila de fuente', () => {
    const onSelectSource = vi.fn();
    const onUpdateSource = vi.fn();

    render(
      <SourceList
        sources={sources}
        selectedSourceId={null}
        onSelectSource={onSelectSource}
        onToggleVisibility={vi.fn()}
        onToggleLock={vi.fn()}
        onDeleteSource={vi.fn()}
        onMoveSource={vi.fn()}
        onAddSource={vi.fn()}
        onUpdateSource={onUpdateSource}
      />
    );

    const sourceRow = screen.getByText('Captura de Pantalla (Monitor 1)').closest('.group');
    expect(sourceRow).not.toBeNull();

    // Clic derecho
    fireEvent.contextMenu(sourceRow!, { clientX: 250, clientY: 300 });

    // Se debe haber seleccionado la fuente y abierto el menú contextual
    expect(onSelectSource).toHaveBeenCalledWith('src-screen');
    expect(screen.getByText(/Voltear Horizontalmente \(Modo Espejo\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ajustar a la Pantalla/i)).toBeInTheDocument();
  });
});
