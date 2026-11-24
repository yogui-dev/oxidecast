import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionsModal } from '../src/components/ConnectionsModal';
import { StreamingDestination } from '../src/types/studio';

describe('Gestor de Conexiones de Streaming (ConnectionsModal)', () => {
  const mockDestinations: StreamingDestination[] = [
    {
      id: 'dest-1',
      name: 'Canal Twitch Oficial',
      platform: 'twitch',
      serverUrl: 'rtmp://live.twitch.tv/app/',
      streamKey: 'live_secret_key_123',
      targetCanvas: 'horizontal',
      enabled: true,
      status: 'idle',
      bitrateKbps: 6000,
      fps: 60,
    },
    {
      id: 'dest-2',
      name: 'TikTok Móvil',
      platform: 'tiktok',
      serverUrl: 'rtmp://live-push.tiktok.com/live/',
      streamKey: 'tiktok_secret_456',
      targetCanvas: 'vertical',
      enabled: false,
      status: 'idle',
      bitrateKbps: 4500,
      fps: 60,
    },
  ];

  it('debe renderizar los destinos configurados y sus lienzos asignados', () => {
    render(
      <ConnectionsModal
        isOpen={true}
        onClose={vi.fn()}
        destinations={mockDestinations}
        onUpdateDestinations={vi.fn()}
        isBroadcasting={false}
        onToggleBroadcast={vi.fn()}
      />
    );

    expect(screen.getByText(/Conexiones de Transmisión Multi-Destino/i)).toBeInTheDocument();
    expect(screen.getByText('Canal Twitch Oficial')).toBeInTheDocument();
    expect(screen.getByText('TikTok Móvil')).toBeInTheDocument();
    expect(screen.getByText(/16:9 \(Horizontal\)/i)).toBeInTheDocument();
    expect(screen.getByText(/9:16 \(Vertical\)/i)).toBeInTheDocument();
  });

  it('debe permitir alternar el estado habilitado/deshabilitado de un destino', () => {
    const handleUpdate = vi.fn();
    render(
      <ConnectionsModal
        isOpen={true}
        onClose={vi.fn()}
        destinations={mockDestinations}
        onUpdateDestinations={handleUpdate}
        isBroadcasting={false}
        onToggleBroadcast={vi.fn()}
      />
    );

    const toggleBtns = screen.getAllByTitle(/emisión a este canal/i);
    expect(toggleBtns.length).toBe(2);

    fireEvent.click(toggleBtns[0]);
    expect(handleUpdate).toHaveBeenCalledWith([
      { ...mockDestinations[0], enabled: false },
      mockDestinations[1],
    ]);
  });
});
