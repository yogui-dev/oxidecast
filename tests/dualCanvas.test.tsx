import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DualCanvas } from '../src/components/DualCanvas';

describe('Componente DualCanvas', () => {
  it('renderiza las etiquetas de los dos lienzos: "Lienzo Horizontal (16:9)" y "Lienzo Vertical (9:16)"', () => {
    render(<DualCanvas />);

    expect(screen.getByText(/Lienzo Horizontal \(16:9\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Lienzo Vertical \(9:16\)/i)).toBeInTheDocument();
  });

  it('muestra indicadores de resolución y plataformas de destino en español', () => {
    render(<DualCanvas />);

    // Resoluciones de ambos lienzos
    const res16_9 = screen.getAllByText(/1920\s*[×x]\s*1080/i);
    expect(res16_9.length).toBeGreaterThanOrEqual(1);

    const res9_16 = screen.getAllByText(/1080\s*[×x]\s*1920/i);
    expect(res9_16.length).toBeGreaterThanOrEqual(1);

    // Indicador de sincronización reactiva
    expect(screen.getByText(/Sincronización Inteligente/i)).toBeInTheDocument();
  });

  it('muestra las capas predeterminadas (Juego y Cámara) sincronizadas', () => {
    render(<DualCanvas />);

    const gameLayers = screen.getAllByText(/Juego \/ Pantalla/i);
    expect(gameLayers.length).toBeGreaterThanOrEqual(1);

    const cameraLayers = screen.getAllByText(/Cámara Web/i);
    expect(cameraLayers.length).toBeGreaterThanOrEqual(1);
  });
});
