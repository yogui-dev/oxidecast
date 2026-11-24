import {
  StudioConfig,
  Scene,
  StreamingDestination,
  ChatChannelConfig,
  WorkspaceLayout,
  SourceItem,
  SourceTransform,
  SourceFilterSettings,
} from '../types/studio';

const STORAGE_KEY = 'oxidecast_studio_profile_v1';
const LAYOUT_STORAGE_KEY = 'oxidecast_workspace_layout_v1';

export const DEFAULT_SOURCE_TRANSFORM: SourceTransform = {
  flipHorizontal: false,
  flipVertical: false,
  rotation: 0,
  scaleMode: 'fit',
};

export const DEFAULT_SOURCE_FILTERS: SourceFilterSettings = {
  opacity: 1,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hueRotate: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: false,
  chromaKey: {
    enabled: false,
    color: '#00FF00',
    similarity: 40,
    smoothness: 20,
  },
  crop: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

export function sanitizeSourceItem(item: Partial<SourceItem>): SourceItem {
  return {
    id: item.id || `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: item.name || 'Nueva Fuente',
    type: item.type || 'screen',
    targetCanvas: item.targetCanvas || 'both',
    rect16_9: item.rect16_9 || { x: 0, y: 0, width: 1920, height: 1080 },
    rect9_16: item.rect9_16,
    visible: item.visible !== undefined ? item.visible : true,
    locked: item.locked !== undefined ? item.locked : false,
    color: item.color || '#3B82F6',
    properties: item.properties || {},
    transform: { ...DEFAULT_SOURCE_TRANSFORM, ...(item.transform || {}) },
    filters: {
      ...DEFAULT_SOURCE_FILTERS,
      ...(item.filters || {}),
      chromaKey: {
        ...DEFAULT_SOURCE_FILTERS.chromaKey,
        ...(item.filters?.chromaKey || {}),
      },
      crop: {
        ...DEFAULT_SOURCE_FILTERS.crop,
        ...(item.filters?.crop || {}),
      },
    },
  };
}

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayout = {
  sidebarWidthPercent: 32,
  bottomDockHeightPx: 210,
  scenesWidthPercent: 45,
  chatHeightPx: 260,
  isChatExpanded: true,
  isAudioExpanded: true,
  sidebarPosition: 'right',
  dockOrder: ['scenes', 'sources'],
};

export function loadWorkspaceLayout(): WorkspaceLayout {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE_LAYOUT;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_WORKSPACE_LAYOUT, ...parsed };
  } catch {
    return DEFAULT_WORKSPACE_LAYOUT;
  }
}

export function saveWorkspaceLayout(layout: WorkspaceLayout): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch (e) {
    console.error('Error al guardar layout del workspace:', e);
  }
}

export function resetWorkspaceLayout(): WorkspaceLayout {
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch {}
  return DEFAULT_WORKSPACE_LAYOUT;
}

export const INITIAL_DEFAULT_SCENES: Scene[] = [
  {
    id: 'scene-main',
    name: 'Escena Principal',
    sources: [
      {
        id: 'src-screen-primary',
        name: 'Captura de Pantalla (Monitor 1)',
        type: 'screen',
        targetCanvas: 'both',
        rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
        visible: true,
        locked: false,
        color: '#3B82F6',
        properties: { displayIndex: 0 },
        transform: { ...DEFAULT_SOURCE_TRANSFORM },
        filters: { ...DEFAULT_SOURCE_FILTERS },
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
  activeSceneId: 'scene-main',
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
      const sanitizedScenes = parsed.scenes.map((scene: any) => ({
        ...scene,
        sources: Array.isArray(scene.sources)
          ? scene.sources.map((s: any) => sanitizeSourceItem(s))
          : [],
      }));

      return {
        ...INITIAL_DEFAULT_CONFIG,
        ...parsed,
        scenes: sanitizedScenes,
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
