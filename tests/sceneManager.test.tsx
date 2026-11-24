import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SceneList } from '../src/components/SceneList';
import { Scene } from '../src/types/studio';

describe('Gestor de Escenas de OxideCast (SceneList)', () => {
  const mockScenes: Scene[] = [
    {
      id: 'scene-1',
      name: 'Escena Principal',
      sources: [
        {
          id: 'src-1',
          name: 'Juego',
          type: 'screen',
          targetCanvas: 'both',
          rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
          visible: true,
          locked: false,
          color: '#3B82F6',
          properties: {},
        },
      ],
    },
    {
      id: 'scene-2',
      name: 'Solo Cámara',
      sources: [],
    },
  ];

  it('debe renderizar la lista de escenas con el conteo correcto', () => {
    render(
      <SceneList
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={vi.fn()}
        onAddScene={vi.fn()}
        onRenameScene={vi.fn()}
        onDuplicateScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onImportScenes={vi.fn()}
      />
    );

    expect(screen.getByText(/Escenas \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('Escena Principal')).toBeInTheDocument();
    expect(screen.getByText('Solo Cámara')).toBeInTheDocument();
  });

  it('debe llamar a onSelectScene al hacer clic en una escena', () => {
    const handleSelect = vi.fn();
    render(
      <SceneList
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={handleSelect}
        onAddScene={vi.fn()}
        onRenameScene={vi.fn()}
        onDuplicateScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onImportScenes={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Solo Cámara'));
    expect(handleSelect).toHaveBeenCalledWith('scene-2');
  });

  it('debe permitir crear una nueva escena', () => {
    const handleAdd = vi.fn();
    render(
      <SceneList
        scenes={mockScenes}
        activeSceneId="scene-1"
        onSelectScene={vi.fn()}
        onAddScene={handleAdd}
        onRenameScene={vi.fn()}
        onDuplicateScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onImportScenes={vi.fn()}
      />
    );

    const newBtn = screen.getByRole('button', { name: /Nueva/i });
    fireEvent.click(newBtn);

    const input = screen.getByPlaceholderText(/Nombre de la escena/i);
    fireEvent.change(input, { target: { value: 'Escena Torneo' } });

    const createBtn = screen.getByRole('button', { name: /^Crear$/i });
    fireEvent.click(createBtn);

    expect(handleAdd).toHaveBeenCalledWith('Escena Torneo');
  });
});
