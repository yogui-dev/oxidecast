import { StudioConfig, Scene, StreamingDestination, ChatChannelConfig } from '../types/studio';

const STORAGE_KEY = 'oxidecast_studio_profile_v1';

export const INITIAL_DEFAULT_SCENES: Scene[] = [
  {
    id: 'scene-full-stream',
    name: 'Escena 1 - Juego + Cámara',
    sources: [
      {
        id: 'src-screen-main',
        name: 'Captura de Pantalla 1',
        type: 'screen',
        targetCanvas: 'both',
        rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
        visible: true,
        locked: true,
        color: '#3B82F6',
        properties: { displayIndex: 0 },
      },
      {
        id: 'src-camera-pip',
        name: 'Cámara Web HD',
        type: 'camera',
        targetCanvas: 'both',
        rect16_9: { x: 1440, y: 810, width: 480, height: 270 },
        visible: true,
        locked: false,
        color: '#FF5722',
        properties: {},
      },
      {
        id: 'src-watermark',
        name: 'Distintivo de Emisión',
        type: 'text',
        targetCanvas: 'horizontal',
        rect16_9: { x: 40, y: 40, width: 300, height: 50 },
        visible: true,
        locked: true,
        color: '#F59E0B',
        properties: { text: 'OxideCast 🇨🇱', fontSize: 24, textColor: '#FFFFFF' },
      },
    ],
  },
  {
    id: 'scene-just-chatting',
    name: 'Escena 2 - Solo Cámara',
    sources: [
      {
        id: 'src-camera-full',
        name: 'Cámara Web Pantalla Completa',
        type: 'camera',
        targetCanvas: 'both',
        rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
        visible: true,
        locked: true,
        color: '#FF5722',
        properties: {},
      },
      {
        id: 'src-chat-overlay',
        name: 'Widget de Chat',
        type: 'browser',
        targetCanvas: 'vertical',
        rect16_9: { x: 50, y: 600, width: 450, height: 400 },
        visible: true,
        locked: false,
        color: '#8B5CF6',
        properties: { url: 'https://streamlabs.com/widgets/chat-box/v1/...' },
      },
    ],
  },
  {
    id: 'scene-pause-screen',
    name: 'Escena 3 - En Pausa / Volvemos',
    sources: [
      {
        id: 'src-pause-background',
        name: 'Fondo Oscuro',
        type: 'color',
        targetCanvas: 'both',
        rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
        visible: true,
        locked: true,
        color: '#1E293B',
        properties: { backgroundColor: '#0B0F19' },
      },
      {
        id: 'src-pause-text',
        name: 'Texto de Pausa',
        type: 'text',
        targetCanvas: 'both',
        rect16_9: { x: 560, y: 490, width: 800, height: 100 },
        visible: true,
        locked: true,
        color: '#F59E0B',
        properties: { text: '¡Transmisión en pausa! Volvemos en breve...', fontSize: 32, textColor: '#FFA500' },
      },
    ],
  },
];

export const INITIAL_DEFAULT_DESTINATIONS: StreamingDestination[] = [
  {
    id: 'dest-twitch',
    name: 'Twitch',
    platform: 'twitch',
    serverUrl: 'rtmp://live.twitch.tv/app/',
    streamKey: '',
    targetCanvas: 'horizontal',
    enabled: true,
    status: 'idle',
    bitrateKbps: 6000,
    fps: 60,
  },
  {
    id: 'dest-youtube',
    name: 'YouTube Live',
    platform: 'youtube',
    serverUrl: 'rtmp://a.rtmp.youtube.com/live2/',
    streamKey: '',
    targetCanvas: 'horizontal',
    enabled: false,
    status: 'idle',
    bitrateKbps: 8000,
    fps: 60,
  },
  {
    id: 'dest-tiktok',
    name: 'TikTok Live (Vertical 9:16)',
    platform: 'tiktok',
    serverUrl: 'rtmp://live-push.tiktok.com/live/',
    streamKey: '',
    targetCanvas: 'vertical',
    enabled: true,
    status: 'idle',
    bitrateKbps: 4500,
    fps: 60,
  },
  {
    id: 'dest-kick',
    name: 'Kick',
    platform: 'kick',
    serverUrl: 'rtmps://fa723fc1b171.global-contribute.live-video.net:443/app/',
    streamKey: '',
    targetCanvas: 'horizontal',
    enabled: false,
    status: 'idle',
    bitrateKbps: 6000,
    fps: 60,
  },
];

export const INITIAL_DEFAULT_CHANNELS: ChatChannelConfig[] = [
  { id: 'ch-twitch', platform: 'twitch', channelName: 'yogui_dev', connected: true },
  { id: 'ch-youtube', platform: 'youtube', channelName: 'YoguiDev', connected: true },
  { id: 'ch-tiktok', platform: 'tiktok', channelName: '@yoguidev', connected: true },
  { id: 'ch-kick', platform: 'kick', channelName: 'yoguidev', connected: false },
];

export const INITIAL_DEFAULT_CONFIG: StudioConfig = {
  version: '1.0.0',
  scenes: INITIAL_DEFAULT_SCENES,
  activeSceneId: 'scene-full-stream',
  destinations: INITIAL_DEFAULT_DESTINATIONS,
  chatChannels: INITIAL_DEFAULT_CHANNELS,
  audioSettings: {
    desktopVolume: 0.8,
    micVolume: 0.9,
    limiterCeilingDb: -1.0,
    noiseGateThresholdDb: -45.0,
  },
};

export function loadStudioConfig(): StudioConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.scenes) &&
      parsed.scenes.length > 0 &&
      typeof parsed.activeSceneId === 'string'
    ) {
      return {
        ...INITIAL_DEFAULT_CONFIG,
        ...parsed,
      };
    }
    return INITIAL_DEFAULT_CONFIG;
  } catch {
    return INITIAL_DEFAULT_CONFIG;
  }
}

export function saveStudioConfig(config: StudioConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error al guardar configuración local de OxideCast:', e);
  }
}
