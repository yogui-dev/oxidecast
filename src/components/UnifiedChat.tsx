import React, { useState } from 'react';
import {
  MessageSquare,
  ExternalLink,
  Send,
  Search,
  Filter,
  Radio,
  X,
  Check,
  Smile,
} from 'lucide-react';
import { ChatChannelConfig } from '../types/studio';

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
    bg: 'bg-purple-950/40',
    text: 'text-cyber-purple',
    border: 'border-cyber-purple/40',
  },
  YouTube: {
    bg: 'bg-red-950/40',
    text: 'text-cyber-red',
    border: 'border-cyber-red/40',
  },
  TikTok: {
    bg: 'bg-cyan-950/40',
    text: 'text-cyber-cyan',
    border: 'border-cyber-cyan/40',
  },
  Kick: {
    bg: 'bg-emerald-950/40',
    text: 'text-cyber-green',
    border: 'border-cyber-green/40',
  },
  Instagram: {
    bg: 'bg-pink-950/40',
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
  channels?: ChatChannelConfig[];
  onUpdateChannels?: (channels: ChatChannelConfig[]) => void;
}

export const UnifiedChat: React.FC<UnifiedChatProps> = ({
  isPopOut = false,
  onPopOut,
  className = '',
  channels = [
    { id: 'ch-twitch', platform: 'twitch', channelName: 'yogui_dev', connected: true },
    { id: 'ch-youtube', platform: 'youtube', channelName: '@YoguiDev', connected: true },
    { id: 'ch-tiktok', platform: 'tiktok', channelName: '@yoguidev', connected: true },
    { id: 'ch-kick', platform: 'kick', channelName: 'yoguidev', connected: false },
  ],
  onUpdateChannels,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>(DEFAULT_MESSAGES);
  const [selectedFilter, setSelectedFilter] = useState<PlatformType | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [selectedSendPlatform, setSelectedSendPlatform] = useState<PlatformType>('Twitch');
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [localChannels, setLocalChannels] = useState<ChatChannelConfig[]>(channels);

  const handlePopOut = () => {
    if (onPopOut) {
      onPopOut();
    } else {
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
      platform: selectedSendPlatform,
      author: 'Streamer (Tú)',
      content: inputContent.trim(),
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      badge: 'Streamer',
      isStreamer: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputContent('');
  };

  const handleToggleChannel = (id: string) => {
    const updated = localChannels.map((c) =>
      c.id === id ? { ...c, connected: !c.connected } : c
    );
    setLocalChannels(updated);
    if (onUpdateChannels) {
      onUpdateChannels(updated);
    }
  };

  const handleUpdateChannelName = (id: string, name: string) => {
    const updated = localChannels.map((c) =>
      c.id === id ? { ...c, channelName: name } : c
    );
    setLocalChannels(updated);
    if (onUpdateChannels) {
      onUpdateChannels(updated);
    }
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
      className={`bg-surface-low border border-surface-high rounded flex flex-col h-full overflow-hidden shadow-sm select-none ${className}`}
    >
      {/* Encabezado del Chat */}
      <div className="px-3 py-2 border-b border-surface-high bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-cyber-cyan" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Chat Unificado</h2>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-lowest text-gray-400 border border-surface-high">
            {filteredMessages.length} msgs
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botón Configurar Canales */}
          <button
            type="button"
            onClick={() => setIsChannelModalOpen(true)}
            title="Conectar canales de chat (Twitch, YouTube, TikTok, Kick)"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-gray-300 hover:text-white bg-surface-high hover:bg-surface-highest border border-surface-high transition-colors shadow-xs"
          >
            <Radio className="h-3 w-3 text-oxide-rust" />
            <span className="hidden sm:inline">Canales</span>
          </button>

          {!isPopOut && (
            <button
              type="button"
              onClick={handlePopOut}
              title="Desacoplar ventana flotante"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-gray-300 hover:text-white bg-surface-high hover:bg-surface-highest border border-surface-high transition-colors shadow-xs"
            >
              <ExternalLink className="h-3 w-3 text-cyber-cyan" />
              <span>Desacoplar Ventana</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicadores de Audiencia por Plataforma (Stitch Audience Metrics Pills) */}
      <div className="grid grid-cols-4 gap-1 p-1.5 border-b border-surface-high bg-surface-lowest text-[10px] font-mono">
        <div className="bg-surface p-1 rounded flex flex-col items-center border border-surface-high">
          <span className="text-cyber-purple font-bold">TWITCH</span>
          <span className="text-gray-200 font-semibold">3,420</span>
        </div>
        <div className="bg-surface p-1 rounded flex flex-col items-center border border-surface-high">
          <span className="text-cyber-red font-bold">YOUTUBE</span>
          <span className="text-gray-200 font-semibold">8,910</span>
        </div>
        <div className="bg-surface p-1 rounded flex flex-col items-center border border-surface-high">
          <span className="text-cyber-cyan font-bold">TIKTOK</span>
          <span className="text-gray-200 font-semibold">14,200</span>
        </div>
        <div className="bg-surface p-1 rounded flex flex-col items-center border border-surface-high">
          <span className="text-cyber-green font-bold">KICK</span>
          <span className="text-gray-200 font-semibold">1,850</span>
        </div>
      </div>

      {/* Selector de Filtros por Plataforma */}
      <div className="px-2.5 py-1.5 border-b border-surface-high bg-surface flex items-center gap-1 overflow-x-auto">
        <Filter className="h-3 w-3 text-gray-500 shrink-0 mr-1" />
        {FILTER_PLATFORMS.map((platform) => {
          const isActive = selectedFilter === platform;
          return (
            <button
              key={platform}
              type="button"
              onClick={() => setSelectedFilter(platform)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-oxide-rust text-white border-oxide-rust shadow-xs'
                  : 'bg-surface-lowest text-gray-400 hover:text-gray-200 border-surface-high'
              }`}
            >
              {platform}
            </button>
          );
        })}
      </div>

      {/* Barra de Búsqueda Rápida */}
      <div className="px-2.5 py-1 border-b border-surface-high bg-surface-lowest flex items-center gap-1.5">
        <Search className="h-3 w-3 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar en chat unificado..."
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
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs bg-surface-lowest">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs py-6">
            <MessageSquare className="h-6 w-6 mb-1 text-gray-600" />
            <span>No hay mensajes en este filtro</span>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const platformStyle = PLATFORM_COLORS[msg.platform] || {
              bg: 'bg-surface',
              text: 'text-gray-300',
              border: 'border-surface-high',
            };

            return (
              <div
                key={msg.id}
                className={`p-2 rounded border transition-all ${
                  msg.isStreamer
                    ? 'bg-surface-high/50 border-oxide-rust/40 ml-3'
                    : 'bg-surface border-surface-high hover:border-gray-600'
                }`}
              >
                {/* Cabecera del Mensaje */}
                <div className="flex items-center justify-between mb-0.5 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Insignia de Plataforma */}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${platformStyle.bg} ${platformStyle.text} ${platformStyle.border}`}
                    >
                      {msg.platform}
                    </span>

                    {/* Insignia de Rol */}
                    {msg.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-highest text-gray-300 border border-surface-high font-medium">
                        {msg.badge}
                      </span>
                    )}

                    {/* Nombre del Autor */}
                    <span
                      className={`font-semibold ${
                        msg.isStreamer ? 'text-oxide-rust-light' : 'text-gray-200'
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
                <p className="text-gray-300 text-[11px] leading-relaxed break-words">
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
        className="p-2 border-t border-surface-high bg-surface flex items-center gap-1.5"
      >
        {/* Selector de Plataforma de Envío */}
        <select
          value={selectedSendPlatform}
          onChange={(e) => setSelectedSendPlatform(e.target.value as PlatformType)}
          className="bg-surface-lowest border border-surface-high rounded px-2 py-1 text-[11px] font-mono text-gray-300 focus:outline-none focus:border-oxide-rust"
        >
          <option value="Twitch">Twitch</option>
          <option value="YouTube">YouTube</option>
          <option value="TikTok">TikTok</option>
          <option value="Kick">Kick</option>
        </select>

        <input
          type="text"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          placeholder="Responder a todas las plataformas..."
          className="flex-1 bg-surface-lowest border border-surface-high rounded px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-oxide-rust transition-colors"
        />

        <button
          type="button"
          title="Emoticonos"
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface-high"
        >
          <Smile className="h-4 w-4" />
        </button>

        <button
          type="submit"
          disabled={!inputContent.trim()}
          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${
            inputContent.trim()
              ? 'bg-oxide-rust hover:bg-orange-600 text-white shadow-xs'
              : 'bg-surface-high text-gray-500 cursor-not-allowed'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Enviar</span>
        </button>
      </form>

      {/* Modal Canales de Chat */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-low border border-surface-high rounded-xl p-5 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-surface-high pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-oxide-rust" />
                Conectar Canales de Chat en Vivo
              </h3>
              <button
                onClick={() => setIsChannelModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              Ingresa el nombre o usuario de tus canales para recibir y consolidar los mensajes:
            </p>

            <div className="space-y-2.5 text-xs">
              {localChannels.map((ch) => (
                <div
                  key={ch.id}
                  className="p-2.5 bg-surface border border-surface-high rounded flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-semibold text-white uppercase text-[10px] w-16 font-mono">
                      {ch.platform}
                    </span>
                    <input
                      type="text"
                      value={ch.channelName}
                      onChange={(e) => handleUpdateChannelName(ch.id, e.target.value)}
                      placeholder={`Canal de ${ch.platform}...`}
                      className="flex-1 bg-surface-lowest border border-surface-high rounded px-2.5 py-1 text-white text-xs focus:border-oxide-rust focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleChannel(ch.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-colors ${
                      ch.connected
                        ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/40'
                        : 'bg-surface-high text-gray-400 border-surface-high'
                    }`}
                  >
                    {ch.connected ? 'Conectado' : 'Desconectado'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-surface-high">
              <button
                type="button"
                onClick={() => setIsChannelModalOpen(false)}
                className="px-4 py-1.5 bg-oxide-rust hover:bg-orange-600 text-white rounded font-medium text-xs flex items-center gap-1 shadow-md font-mono"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Listo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedChat;
