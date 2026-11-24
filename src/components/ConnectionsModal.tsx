import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Trash2,
  Tv,
  Smartphone,
  Eye,
  EyeOff,
  X,
  Activity,
} from 'lucide-react';
import { StreamingDestination, PlatformType } from '../types/studio';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: StreamingDestination[];
  onUpdateDestinations: (destinations: StreamingDestination[]) => void;
  isBroadcasting: boolean;
  onToggleBroadcast: () => void;
}

const PLATFORM_PRESETS: Record<
  PlatformType,
  { name: string; defaultUrl: string; defaultCanvas: 'horizontal' | 'vertical'; color: string; badgeColor: string }
> = {
  twitch: {
    name: 'Twitch',
    defaultUrl: 'rtmp://live.twitch.tv/app/',
    defaultCanvas: 'horizontal',
    color: '#9146FF',
    badgeColor: 'bg-purple-950/60 text-purple-400 border-purple-800',
  },
  youtube: {
    name: 'YouTube Live',
    defaultUrl: 'rtmp://a.rtmp.youtube.com/live2/',
    defaultCanvas: 'horizontal',
    color: '#FF0000',
    badgeColor: 'bg-red-950/60 text-red-400 border-red-800',
  },
  tiktok: {
    name: 'TikTok Live Studio',
    defaultUrl: 'rtmp://live-push.tiktok.com/live/',
    defaultCanvas: 'vertical',
    color: '#00F2FE',
    badgeColor: 'bg-cyan-950/60 text-cyan-400 border-cyan-800',
  },
  kick: {
    name: 'Kick',
    defaultUrl: 'rtmps://fa723fc1b171.global-contribute.live-video.net:443/app/',
    defaultCanvas: 'horizontal',
    color: '#53FC18',
    badgeColor: 'bg-green-950/60 text-green-400 border-green-800',
  },
  custom: {
    name: 'RTMP Personalizado',
    defaultUrl: 'rtmp://',
    defaultCanvas: 'horizontal',
    color: '#F97316',
    badgeColor: 'bg-orange-950/60 text-orange-400 border-orange-800',
  },
};

export const ConnectionsModal: React.FC<ConnectionsModalProps> = ({
  isOpen,
  onClose,
  destinations,
  onUpdateDestinations,
  isBroadcasting,
  onToggleBroadcast,
}) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Formulario nuevo destino
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('twitch');
  const [destName, setDestName] = useState('Twitch Stream');
  const [destUrl, setDestUrl] = useState(PLATFORM_PRESETS.twitch.defaultUrl);
  const [destKey, setDestKey] = useState('');
  const [destCanvas, setDestCanvas] = useState<'horizontal' | 'vertical'>('horizontal');
  const [destBitrate, setDestBitrate] = useState(6000);

  if (!isOpen) return null;

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleDestinationEnabled = (id: string) => {
    const updated = destinations.map((d) =>
      d.id === id ? { ...d, enabled: !d.enabled } : d
    );
    onUpdateDestinations(updated);
  };

  const handleUpdateField = (id: string, updates: Partial<StreamingDestination>) => {
    const updated = destinations.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    );
    onUpdateDestinations(updated);
  };

  const handleDeleteDestination = (id: string) => {
    if (confirm('¿Eliminar esta conexión de streaming?')) {
      onUpdateDestinations(destinations.filter((d) => d.id !== id));
    }
  };

  const handlePlatformChange = (p: PlatformType) => {
    setSelectedPlatform(p);
    setDestName(PLATFORM_PRESETS[p].name);
    setDestUrl(PLATFORM_PRESETS[p].defaultUrl);
    setDestCanvas(PLATFORM_PRESETS[p].defaultCanvas);
  };

  const handleAddDestination = () => {
    if (!destName.trim() || !destUrl.trim()) return;

    const newDest: StreamingDestination = {
      id: `dest-${selectedPlatform}-${Date.now()}`,
      name: destName.trim(),
      platform: selectedPlatform,
      serverUrl: destUrl.trim(),
      streamKey: destKey.trim(),
      targetCanvas: destCanvas,
      enabled: true,
      status: isBroadcasting ? 'live' : 'idle',
      bitrateKbps: destBitrate,
      fps: 60,
    };

    onUpdateDestinations([...destinations, newDest]);
    setIsAdding(false);
    setDestKey('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-oxide-surface border border-gray-700 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-oxide-surface select-none">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-oxide-rust/20 border border-oxide-rust/40 flex items-center justify-center text-oxide-rust">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Conexiones de Transmisión Multi-Destino
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-orange-400 border border-gray-700">
                  RTMP Dual NVENC
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Configura emisión simultánea en 16:9 (Twitch/YouTube) y 9:16 (TikTok/Instagram).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Barra de Estado y Botón Agregar */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-400 font-medium">Destinos Configurados:</span>
              <span className="px-2 py-0.5 rounded bg-gray-800 text-white font-mono font-semibold">
                {destinations.length}
              </span>
              <span className="text-gray-400">Activos:</span>
              <span className="px-2 py-0.5 rounded bg-green-950 text-green-400 font-mono font-semibold border border-green-800">
                {destinations.filter((d) => d.enabled).length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-oxide-rust hover:bg-orange-600 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Destino</span>
            </button>
          </div>

          {/* Formulario Inline Agregar Destino */}
          {isAdding && (
            <div className="p-4 bg-gray-900 border border-orange-500/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5 text-oxide-rust" />
                  Nuevo Destino RTMP
                </span>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Selector de Plataforma */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                {(['twitch', 'youtube', 'tiktok', 'kick', 'custom'] as PlatformType[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePlatformChange(p)}
                    className={`py-2 px-1 text-center rounded text-xs font-medium border transition-colors ${
                      selectedPlatform === p
                        ? 'border-orange-500 bg-orange-950/40 text-white font-semibold'
                        : 'border-gray-800 bg-gray-800/60 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {PLATFORM_PRESETS[p].name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Nombre Descriptivo:</label>
                  <input
                    type="text"
                    value={destName}
                    onChange={(e) => setDestName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Lienzo Transmitido:</label>
                  <select
                    value={destCanvas}
                    onChange={(e) => setDestCanvas(e.target.value as 'horizontal' | 'vertical')}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="horizontal">Horizontal (16:9 - 1920×1080)</option>
                    <option value="vertical">Vertical (9:16 - 1080×1920 para Móvil)</option>
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-gray-400 mb-1">URL Servidor RTMP:</label>
                <input
                  type="text"
                  value={destUrl}
                  onChange={(e) => setDestUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block text-gray-400 mb-1">Clave de Transmisión (Stream Key):</label>
                  <input
                    type="password"
                    value={destKey}
                    onChange={(e) => setDestKey(e.target.value)}
                    placeholder="live_..."
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Bitrate (kbps):</label>
                  <input
                    type="number"
                    value={destBitrate}
                    onChange={(e) => setDestBitrate(Number(e.target.value))}
                    step={500}
                    min={1000}
                    max={15000}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-xs font-medium hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddDestination}
                  className="px-4 py-1.5 bg-oxide-rust text-white rounded text-xs font-semibold hover:bg-orange-600 shadow-md"
                >
                  Guardar Destino
                </button>
              </div>
            </div>
          )}

          {/* Lista de Destinos Configurados */}
          <div className="space-y-3">
            {destinations.map((dest) => {
              const preset = PLATFORM_PRESETS[dest.platform] || PLATFORM_PRESETS.custom;
              const isKeyVisible = !!showKeys[dest.id];

              return (
                <div
                  key={dest.id}
                  className={`p-4 rounded-xl border transition-all ${
                    dest.enabled
                      ? 'bg-gray-900/80 border-gray-700 shadow-md'
                      : 'bg-gray-950/40 border-gray-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Switch Habilitar */}
                      <button
                        type="button"
                        onClick={() => handleToggleDestinationEnabled(dest.id)}
                        className={`h-5 w-9 rounded-full transition-colors relative p-0.5 ${
                          dest.enabled ? 'bg-orange-600' : 'bg-gray-700'
                        }`}
                        title={dest.enabled ? 'Deshabilitar emisión a este canal' : 'Habilitar emisión a este canal'}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white transition-transform ${
                            dest.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${preset.badgeColor}`}>
                          {preset.name}
                        </span>
                        <span className="font-semibold text-sm text-white">{dest.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Asignación de Lienzo */}
                      <span className="flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-gray-950 px-2.5 py-1 rounded border border-gray-800">
                        {dest.targetCanvas === 'horizontal' ? (
                          <>
                            <Tv className="h-3.5 w-3.5 text-blue-400" />
                            <span>16:9 (Horizontal)</span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="h-3.5 w-3.5 text-pink-400" />
                            <span>9:16 (Vertical)</span>
                          </>
                        )}
                      </span>

                      {/* Estado de Transmisión */}
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isBroadcasting && dest.enabled
                              ? 'bg-green-500 animate-pulse'
                              : 'bg-gray-600'
                          }`}
                        />
                        <span
                          className={
                            isBroadcasting && dest.enabled
                              ? 'text-green-400 font-semibold'
                              : 'text-gray-500'
                          }
                        >
                          {isBroadcasting && dest.enabled ? 'EN VIVO' : 'STANDBY'}
                        </span>
                      </div>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDestination(dest.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
                        title="Eliminar conexión"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Campos de URL y Clave */}
                  <div className="grid grid-cols-12 gap-3 text-xs">
                    <div className="col-span-6">
                      <label className="block text-[11px] text-gray-400 mb-1">Servidor Ingesta:</label>
                      <input
                        type="text"
                        value={dest.serverUrl}
                        onChange={(e) => handleUpdateField(dest.id, { serverUrl: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1 text-gray-200 font-mono focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="block text-[11px] text-gray-400 mb-1">Clave de Emisión:</label>
                      <div className="relative flex items-center">
                        <input
                          type={isKeyVisible ? 'text' : 'password'}
                          value={dest.streamKey}
                          onChange={(e) => handleUpdateField(dest.id, { streamKey: e.target.value })}
                          placeholder="Ingresa tu clave de stream..."
                          className="w-full bg-gray-950 border border-gray-800 rounded pl-2.5 pr-8 py-1 text-gray-200 font-mono focus:border-orange-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowKey(dest.id)}
                          className="absolute right-2 text-gray-500 hover:text-gray-300"
                        >
                          {isKeyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-1">Bitrate:</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={dest.bitrateKbps}
                          onChange={(e) => handleUpdateField(dest.id, { bitrateKbps: Number(e.target.value) })}
                          className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-gray-200 font-mono text-center focus:border-orange-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-gray-500 font-mono">k</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Modal con Acción de Transmisión Global */}
        <div className="px-6 py-4 border-t border-gray-800 bg-oxide-surface flex items-center justify-between">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <span>Los cambios se guardan y aplican automáticamente en tu equipo.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={onToggleBroadcast}
              className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                isBroadcasting
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-oxide-rust hover:bg-orange-600'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>{isBroadcasting ? 'Detener Transmisión' : 'Iniciar Emisión Multi-Destino'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
