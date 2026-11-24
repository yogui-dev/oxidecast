import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SourceFiltersModal } from '../src/components/SourceFiltersModal';
import { SourceItem } from '../src/types/studio';
import { DEFAULT_SOURCE_TRANSFORM, DEFAULT_SOURCE_FILTERS } from '../src/services/storage';

describe('SourceFiltersModal', () => {
  const mockSource: SourceItem = {
    id: 'src-filters-1',
    name: 'Cámara Principal',
    type: 'camera',
    targetCanvas: 'both',
    rect16_9: { x: 0, y: 0, width: 480, height: 270 },
    visible: true,
    locked: false,
    color: '#FF5722',
    properties: {},
    transform: { ...DEFAULT_SOURCE_TRANSFORM },
    filters: { ...DEFAULT_SOURCE_FILTERS },
  };

  it('no debe renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <SourceFiltersModal
        isOpen={false}
        onClose={vi.fn()}
        source={mockSource}
        onUpdateFilters={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('no debe renderizar nada cuando source es null', () => {
    const { container } = render(
      <SourceFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        source={null}
        onUpdateFilters={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar el título con el nombre de la fuente y las 4 categorías', () => {
    render(
      <SourceFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        source={mockSource}
        onUpdateFilters={vi.fn()}
      />
    );

    expect(screen.getByText(/Filtros para: Cámara Principal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Corrección de Color/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fondo y Clave Croma/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Efectos & Nitidez/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recorte/i })).toBeInTheDocument();
  });

  it('debe permitir modificar brillo y saturación en Corrección de Color', () => {
    const onUpdate = vi.fn();
    render(
      <SourceFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        source={mockSource}
        onUpdateFilters={onUpdate}
      />
    );

    const brightnessSlider = screen.getByLabelText(/Brillo/i);
    fireEvent.change(brightnessSlider, { target: { value: '1.4' } });

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({ brightness: 1.4 })
    );

    const saturationSlider = screen.getByLabelText(/Saturación/i);
    fireEvent.change(saturationSlider, { target: { value: '1.8' } });

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({ saturation: 1.8 })
    );
  });

  it('debe permitir interactuar con la pestaña Fondo y Clave Croma', () => {
    const onUpdate = vi.fn();
    render(
      <SourceFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        source={mockSource}
        onUpdateFilters={onUpdate}
      />
    );

    // Cambiar a la pestaña de Croma
    fireEvent.click(screen.getByRole('button', { name: /Fondo y Clave Croma/i }));

    const enableSwitch = screen.getByLabelText(/Habilitar Clave Croma/i);
    fireEvent.click(enableSwitch);

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({
        chromaKey: expect.objectContaining({ enabled: true }),
      })
    );

    // Seleccionar preset Verde o Azul
    const bluePreset = screen.getByRole('button', { name: /Azul/i });
    fireEvent.click(bluePreset);

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({
        chromaKey: expect.objectContaining({ color: '#0000FF' }),
      })
    );

    // Modificar similitud
    const similaritySlider = screen.getByLabelText(/Similitud/i);
    fireEvent.change(similaritySlider, { target: { value: '65' } });

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({
        chromaKey: expect.objectContaining({ similarity: 65 }),
      })
    );
  });

  it('debe permitir modificar desenfoque y efectos en Efectos & Nitidez', () => {
    const onUpdate = vi.fn();
    render(
      <SourceFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        source={mockSource}
        onUpdateFilters={onUpdate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Efectos & Nitidez/i }));

    const blurSlider = screen.getByLabelText(/Desenfoque/i);
    fireEvent.change(blurSlider, { target: { value: '8' } });

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({ blur: 8 })
    );

    const invertSwitch = screen.getByLabelText(/Invertir Colores/i);
    fireEvent.click(invertSwitch);

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({ invert: true })
    );
  });

  it('debe permitir configurar valores de recorte (Crop)', () => {
    const onUpdate = vi.fn();
    render(
      <SourceFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        source={mockSource}
        onUpdateFilters={onUpdate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Recorte/i }));

    const topCrop = screen.getByLabelText(/Arriba/i);
    fireEvent.change(topCrop, { target: { value: '50' } });

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({
        crop: expect.objectContaining({ top: 50 }),
      })
    );
  });

  it('debe restablecer todos los filtros a DEFAULT_SOURCE_FILTERS', () => {
    const onUpdate = vi.fn();
    const sourceWithModifiedFilters: SourceItem = {
      ...mockSource,
      filters: {
        ...DEFAULT_SOURCE_FILTERS,
        brightness: 1.8,
        blur: 10,
        grayscale: 0.5,
      },
    };

    render(
      <SourceFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        source={sourceWithModifiedFilters}
        onUpdateFilters={onUpdate}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /Restablecer Filtros/i });
    fireEvent.click(resetBtn);

    expect(onUpdate).toHaveBeenCalledWith('src-filters-1', DEFAULT_SOURCE_FILTERS);
  });

  it('debe llamar a onClose al presionar Cerrar o Aceptar', () => {
    const onClose = vi.fn();
    render(
      <SourceFiltersModal
        isOpen={true}
        onClose={onClose}
        source={mockSource}
        onUpdateFilters={vi.fn()}
      />
    );

    const closeBtns = screen.getAllByRole('button', { name: /Cerrar/i });
    expect(closeBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(closeBtns[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
