import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnifiedChat } from '../src/components/UnifiedChat';

describe('Componente UnifiedChat', () => {
  it('test_renders_unified_chat_header: renderiza el encabezado "Chat Unificado" y el botón "Desacoplar Ventana"', () => {
    render(<UnifiedChat />);

    expect(screen.getByText(/Chat Unificado/i)).toBeInTheDocument();
    const popoutBtn = screen.getByRole('button', { name: /Desacoplar Ventana/i });
    expect(popoutBtn).toBeInTheDocument();
  });

  it('test_renders_platform_filters: verifica la presencia de los filtros por plataforma ("Todos", "Twitch", "YouTube", "TikTok", "Kick")', () => {
    render(<UnifiedChat />);

    expect(screen.getByRole('button', { name: /Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Twitch/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /YouTube/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TikTok/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kick/i })).toBeInTheDocument();
  });

  it('test_renders_mock_chat_messages: renderiza mensajes simulados con formato legible e insignias en español', () => {
    render(<UnifiedChat />);

    // Verificar autores simulados por defecto
    expect(screen.getByText(/JuanStreaming/i)).toBeInTheDocument();
    expect(screen.getByText(/GamerChileno/i)).toBeInTheDocument();

    // Insignias en español
    expect(screen.getAllByText(/Moderador/i).length).toBeGreaterThanOrEqual(1);

    // Contenido de mensajes
    expect(screen.getByText(/¡Tremenda calidad a 60fps!/i)).toBeInTheDocument();
  });
});
