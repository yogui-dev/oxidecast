import React, { useState } from 'react';
import {
  MessageSquare,
  ExternalLink,
  Send,
  Search,
  Filter,
} from 'lucide-react';

export type PlatformType = 'Twitch' | 'YouTube' | 'TikTok' | 'Kick' | 'Instagram';

export interface ChatMessageItem {
  id: string;
  platform: PlatformType;
  author: string;
  content: string;
  timestamp: string;
  badge?: string;
  isStreamer?: boolean;
}

const DEFAULT_MESSAGES: ChatMessageItem[] = [
  {
    id: 'msg-1',
    platform: 'Twitch',
    author: 'JuanStreaming',
    content: '¡Tremenda calidad a 60fps! El setup dual 16:9 y 9:16 funciona de lujo.',
    timestamp: '14:20',
    badge: 'Moderador',
  },
  {
    id: 'msg-2',
    platform: 'YouTube',
    author: 'GamerChileno',
    content: 'Saludos desde Santiago! Excelente codificación con NVENC en tiempo real.',
    timestamp: '14:21',
    badge: 'Suscriptor',
  },
  {
    id: 'msg-3',
    platform: 'TikTok',
    author: 'ViralTok',
    content: 'La pantalla vertical en TikTok se ve súper nítida y fluida!',
    timestamp: '14:22',
    badge: 'VIP',
  },
  {
    id: 'msg-4',
    platform: 'Kick',
    author: 'KickMaster99',
    content: 'Latencia ultra baja gracias al backend en Rust. ¡Increíble proyecto!',
    timestamp: '14:23',
    badge: 'Espectador',
  },
  {
    id: 'msg-5',
    platform: 'Instagram',
    author: 'InstaLiveUser',
    content: 'Me encanta el diseño oscuro de la app. Mucho éxito con el stream.',
    timestamp: '14:24',
    badge: 'Espectador',
  },
];

const PLATFORM_COLORS: Record<PlatformType, { bg: string; text: string; border: string }> = {
  Twitch: {
    bg: 'bg-purple-900/30',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
  },
  YouTube: {
    bg: 'bg-red-900/30',
    text: 'text-red-400',
    border: 'border-red-500/40',
  },
  TikTok: {
    bg: 'bg-cyan-900/30',
    text: 'text-cyan-400',
    border: 'border-cyan-500/40',
  },
  Kick: {
    bg: 'bg-emerald-900/30',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
  },
  Instagram: {
    bg: 'bg-pink-900/30',
    text: 'text-pink-400',
    border: 'border-pink-500/40',
  },
};

const FILTER_PLATFORMS: (PlatformType | 'Todos')[] = [
  'Todos',
  'Twitch',
  'YouTube',
  'TikTok',
  'Kick',
];

export interface UnifiedChatProps {
  isPopOut?: boolean;
  onPopOut?: () => void;
  className?: string;
}

export const UnifiedChat: React.FC<UnifiedChatProps> = ({
  isPopOut = false,
  onPopOut,
  className = '',
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>(DEFAULT_MESSAGES);
  const [selectedFilter, setSelectedFilter] = useState<PlatformType | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputContent, setInputContent] = useState('');

  const handlePopOut = () => {
    if (onPopOut) {
      onPopOut();
    } else {
      // Intento estándar de ventana pop-out desacoplada
      try {
        if (typeof window !== 'undefined' && window.open) {
          window.open('/chat-popout', '_blank', 'width=420,height=700,menubar=no,toolbar=no');
        }
      } catch (err) {
        console.warn('No se pudo abrir ventana desacoplada:', err);
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const newMsg: ChatMessageItem = {
      id: `streamer-msg-${Date.now()}`,
      platform: 'Twitch',
      author: 'Streamer (Tú)',
      content: inputContent.trim(),
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      badge: 'Streamer',
      isStreamer: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputContent('');
  };

  const filteredMessages = messages.filter((msg) => {
    const matchesPlatform = selectedFilter === 'Todos' || msg.platform === selectedFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div
      className={`bg-oxide-surface border border-gray-800 rounded-lg flex flex-col h-full overflow-hidden shadow-md ${className}`}
    >
      {/* Encabezado del Chat */}
      <div className="px-3.5 py-2.5 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-oxide-rust" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Chat Unificado</h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
            {filteredMessages.length} msgs
          </span>
        </div>

        {!isPopOut && (
          <button
            type="button"
            onClick={handlePopOut}
            title="Desacoplar ventana flotante"
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700 border border-gray-700 transition-colors shadow-sm"
          >
            <ExternalLink className="h-3 w-3 text-orange-400" />
            <span>Desacoplar Ventana</span>
          </button>
        )}
      </div>

      {/* Selector de Filtros por Plataforma */}
      <div className="px-3 py-2 border-b border-gray-800 bg-oxide-surface/80 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        <Filter className="h-3 w-3 text-gray-500 shrink-0 mr-1" />
        {FILTER_PLATFORMS.map((platform) => {
          const isActive = selectedFilter === platform;
          return (
            <button
              key={platform}
              type="button"
              onClick={() => setSelectedFilter(platform)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-oxide-rust text-white border-orange-500 shadow-sm'
                  : 'bg-gray-900/80 text-gray-400 hover:text-gray-200 border-gray-800 hover:border-gray-700'
              }`}
            >
              {platform}
            </button>
          );
        })}
      </div>

      {/* Barra de Búsqueda Rápida */}
      <div className="px-3 py-1.5 border-b border-gray-800/60 bg-gray-900/30 flex items-center gap-2">
        <Search className="h-3 w-3 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar en chat..."
          className="w-full bg-transparent text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[10px] text-gray-500 hover:text-gray-300 font-mono"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lista de Mensajes del Chat */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs py-8">
            <MessageSquare className="h-6 w-6 mb-1 text-gray-600" />
            <span>No hay mensajes en este filtro</span>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const platformStyle = PLATFORM_COLORS[msg.platform] || {
              bg: 'bg-gray-800',
              text: 'text-gray-300',
              border: 'border-gray-700',
            };

            return (
              <div
                key={msg.id}
                className={`p-2 rounded-lg border transition-all ${
                  msg.isStreamer
                    ? 'bg-orange-950/20 border-orange-700/40 ml-4'
                    : 'bg-gray-900/60 border-gray-800/80 hover:border-gray-700'
                }`}
              >
                {/* Cabecera del Mensaje */}
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Insignia de Plataforma */}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border font-mono ${platformStyle.bg} ${platformStyle.text} ${platformStyle.border}`}
                    >
                      {msg.platform}
                    </span>

                    {/* Insignia de Rol / Rol en Español */}
                    {msg.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 border border-gray-700 font-medium">
                        {msg.badge}
                      </span>
                    )}

                    {/* Nombre del Autor */}
                    <span
                      className={`font-semibold ${
                        msg.isStreamer ? 'text-orange-400' : 'text-gray-200'
                      }`}
                    >
                      {msg.author}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] font-mono text-gray-500 shrink-0">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Contenido del Mensaje */}
                <p className="text-gray-300 text-[12px] leading-relaxed break-words">
                  {msg.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Caja de Respuesta Rápida para el Streamer */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 border-t border-gray-800 bg-gray-900/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          placeholder="Enviar respuesta como streamer..."
          className="flex-1 bg-gray-950/80 border border-gray-800 rounded px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputContent.trim()}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
            inputContent.trim()
              ? 'bg-oxide-rust hover:bg-orange-600 text-white shadow-sm'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
};

export default UnifiedChat;
