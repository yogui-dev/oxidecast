import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuBar } from '../src/components/MenuBar';

describe('Barra de Menú Superior de OxideCast (MenuBar)', () => {
  it('debe renderizar los menús principales del sistema', () => {
    render(
      <MenuBar
        onNewScene={vi.fn()}
        onImportObs={vi.fn()}
        onExportConfig={vi.fn()}
        onDuplicateScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onOpenConnections={vi.fn()}
        onOpenChatChannels={vi.fn()}
        isChatExpanded={true}
        onToggleChat={vi.fn()}
        isAudioExpanded={true}
        onToggleAudio={vi.fn()}
        isBroadcasting={false}
        onToggleBroadcast={vi.fn()}
        onShowAbout={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Archivo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transmisión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Herramientas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ayuda' })).toBeInTheDocument();
  });

  it('debe desplegar el menú Archivo con la opción de Importar OBS', () => {
    const handleImportObs = vi.fn();
    render(
      <MenuBar
        onNewScene={vi.fn()}
        onImportObs={handleImportObs}
        onExportConfig={vi.fn()}
        onDuplicateScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onOpenConnections={vi.fn()}
        onOpenChatChannels={vi.fn()}
        isChatExpanded={true}
        onToggleChat={vi.fn()}
        isAudioExpanded={true}
        onToggleAudio={vi.fn()}
        isBroadcasting={false}
        onToggleBroadcast={vi.fn()}
        onShowAbout={vi.fn()}
      />
    );

    const archivoBtn = screen.getByRole('button', { name: 'Archivo' });
    fireEvent.click(archivoBtn);

    const importObsBtn = screen.getByText(/Importar Colección de OBS Studio/i);
    expect(importObsBtn).toBeInTheDocument();

    fireEvent.click(importObsBtn);
    expect(handleImportObs).toHaveBeenCalled();
  });

  it('debe desplegar el menú Ayuda y permitir abrir el modal Acerca de', () => {
    const handleShowAbout = vi.fn();
    render(
      <MenuBar
        onNewScene={vi.fn()}
        onImportObs={vi.fn()}
        onExportConfig={vi.fn()}
        onDuplicateScene={vi.fn()}
        onDeleteScene={vi.fn()}
        onOpenConnections={vi.fn()}
        onOpenChatChannels={vi.fn()}
        isChatExpanded={true}
        onToggleChat={vi.fn()}
        isAudioExpanded={true}
        onToggleAudio={vi.fn()}
        isBroadcasting={false}
        onToggleBroadcast={vi.fn()}
        onShowAbout={handleShowAbout}
      />
    );

    const ayudaBtn = screen.getByRole('button', { name: 'Ayuda' });
    fireEvent.click(ayudaBtn);

    const aboutItem = screen.getByText(/Acerca de OxideCast/i);
    expect(aboutItem).toBeInTheDocument();

    fireEvent.click(aboutItem);
    expect(handleShowAbout).toHaveBeenCalled();
  });
});
