import { Rect } from '../utils/layoutMath';

export type SourceType =
  | 'screen'
  | 'window'
  | 'camera'
  | 'image'
  | 'text'
  | 'browser'
  | 'color';

export type TargetCanvas = 'both' | 'horizontal' | 'vertical';

export interface SourceProperties {
  text?: string;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  color?: string;
  url?: string;
  imageSrc?: string;
  windowTitle?: string;
  displayIndex?: number;
  opacity?: number;
  aspectRatioLock?: boolean;
}

export interface SourceItem {
  id: string;
  name: string;
  type: SourceType;
  targetCanvas: TargetCanvas;
  rect16_9: Rect;
  rect9_16?: Rect;
  visible: boolean;
  locked: boolean;
  color: string;
  properties: SourceProperties;
}

export interface Scene {
  id: string;
  name: string;
  sources: SourceItem[];
}

export type PlatformType = 'twitch' | 'youtube' | 'kick' | 'tiktok' | 'custom';

export interface StreamingDestination {
  id: string;
  name: string;
  platform: PlatformType;
  serverUrl: string;
  streamKey: string;
  targetCanvas: 'horizontal' | 'vertical';
  enabled: boolean;
  status: 'idle' | 'connecting' | 'live' | 'error';
  bitrateKbps: number;
  fps: number;
  errorMessage?: string;
}

export interface ChatChannelConfig {
  id: string;
  platform: 'twitch' | 'youtube' | 'kick' | 'tiktok';
  channelName: string;
  connected: boolean;
}

export interface StudioConfig {
  version: string;
  scenes: Scene[];
  activeSceneId: string;
  destinations: StreamingDestination[];
  chatChannels: ChatChannelConfig[];
  audioSettings: {
    desktopVolume: number;
    micVolume: number;
    limiterCeilingDb: number;
    noiseGateThresholdDb: number;
  };
}

export interface WorkspaceLayout {
  sidebarWidthPercent: number;
  bottomDockHeightPx: number;
  scenesWidthPercent: number;
  chatHeightPx: number;
  isChatExpanded: boolean;
  isAudioExpanded: boolean;
  sidebarPosition: 'left' | 'right';
  dockOrder: ('scenes' | 'sources')[];
}

