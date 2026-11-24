import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  loadWorkspaceLayout,
  saveWorkspaceLayout,
  resetWorkspaceLayout,
  DEFAULT_WORKSPACE_LAYOUT,
} from '../src/services/storage';
import App from '../src/App';

describe('Gestor de Disposición Modular del Workspace (Dockable & Resizable Panels)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe devolver la disposición por defecto al iniciar en un entorno limpio', () => {
    const layout = loadWorkspaceLayout();
    expect(layout.sidebarWidthPercent).toBe(32);
    expect(layout.bottomDockHeightPx).toBe(210);
    expect(layout.sidebarPosition).toBe('right');
    expect(layout.dockOrder).toEqual(['scenes', 'sources']);
  });

  it('debe persistir y recuperar dimensiones personalizadas del workspace', () => {
    const customLayout = {
      ...DEFAULT_WORKSPACE_LAYOUT,
      sidebarWidthPercent: 40,
      bottomDockHeightPx: 300,
      sidebarPosition: 'left' as const,
      dockOrder: ['sources', 'scenes'] as ('scenes' | 'sources')[],
    };

    saveWorkspaceLayout(customLayout);
    const loaded = loadWorkspaceLayout();

    expect(loaded.sidebarWidthPercent).toBe(40);
    expect(loaded.bottomDockHeightPx).toBe(300);
    expect(loaded.sidebarPosition).toBe('left');
    expect(loaded.dockOrder).toEqual(['sources', 'scenes']);
  });

  it('debe restablecer a los valores originales con resetWorkspaceLayout', () => {
    saveWorkspaceLayout({
      ...DEFAULT_WORKSPACE_LAYOUT,
      sidebarWidthPercent: 48,
    });

    const reset = resetWorkspaceLayout();
    expect(reset.sidebarWidthPercent).toBe(32);

    const loaded = loadWorkspaceLayout();
    expect(loaded.sidebarWidthPercent).toBe(32);
  });

  it('debe renderizar los divisores arrastrables (Splitters) en el DOM de la aplicación', () => {
    render(<App />);

    // Buscar divisores con títulos descriptivos de arrastre
    expect(
      screen.getByTitle(/Arrastra para cambiar ancho de la barra lateral/i)
    ).toBeInTheDocument();

    expect(
      screen.getByTitle(/Arrastra para redimensionar la bahía inferior/i)
    ).toBeInTheDocument();

    expect(
      screen.getByTitle(/Arrastra para cambiar proporción entre Escenas y Fuentes/i)
    ).toBeInTheDocument();
  });
});
