import { Scene, SourceItem, SourceType } from '../types/studio';

export interface ObsImportResult {
  success: boolean;
  collectionName?: string;
  scenes: Scene[];
  error?: string;
  importedCount: number;
}

function mapObsSourceType(obsId: string): SourceType {
  switch (obsId) {
    case 'monitor_capture':
    case 'display_capture':
      return 'screen';
    case 'window_capture':
      return 'window';
    case 'dshow_input':
    case 'video_capture_device':
      return 'camera';
    case 'image_source':
      return 'image';
    case 'text_gdiplus_v2':
    case 'text_ft2_source_v2':
      return 'text';
    case 'browser_source':
      return 'browser';
    case 'color_source_v3':
    case 'color_source':
      return 'color';
    default:
      return 'screen';
  }
}

function getSourceDefaultColor(type: SourceType): string {
  switch (type) {
    case 'screen':
      return '#3B82F6'; // Azul
    case 'window':
      return '#60A5FA'; // Azul claro
    case 'camera':
      return '#FF5722'; // Óxido / Naranja
    case 'image':
      return '#10B981'; // Verde
    case 'text':
      return '#F59E0B'; // Amarillo / Dorado
    case 'browser':
      return '#8B5CF6'; // Púrpura
    case 'color':
      return '#64748B'; // Gris pizarra
  }
}

export function importObsCollection(jsonString: string): ObsImportResult {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        scenes: [],
        error: 'El archivo no contiene un objeto JSON válido de OBS Studio.',
        importedCount: 0,
      };
    }

    const collectionName = typeof data.name === 'string' ? data.name : 'Colección OBS';
    const obsSources = Array.isArray(data.sources) ? data.sources : [];

    // En OBS, las escenas son fuentes con id "scene"
    const obsScenes = obsSources.filter(
      (s: any) => s && (s.id === 'scene' || s.version_description === 'scene' || Array.isArray(s.settings?.items))
    );

    if (obsScenes.length === 0) {
      return {
        success: false,
        collectionName,
        scenes: [],
        error: 'No se encontraron escenas dentro de la colección exportada de OBS Studio.',
        importedCount: 0,
      };
    }

    // Mapa de fuentes generales para buscar configuraciones
    const sourceSettingsMap = new Map<string, any>();
    for (const src of obsSources) {
      if (src && src.name) {
        sourceSettingsMap.set(src.name, src);
      }
    }

    const convertedScenes: Scene[] = [];
    let totalSourcesImported = 0;

    for (let i = 0; i < obsScenes.length; i++) {
      const obsScene = obsScenes[i];
      const sceneId = `obs-scene-${i + 1}-${Date.now()}`;
      const sceneName = obsScene.name || `Escena OBS ${i + 1}`;
      const items = Array.isArray(obsScene.settings?.items) ? obsScene.settings.items : [];

      const sources: SourceItem[] = [];

      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        const srcName = item.name || `Fuente ${j + 1}`;
        const sourceDef = sourceSettingsMap.get(srcName);
        const obsTypeId = sourceDef?.id || 'monitor_capture';
        const sourceType = mapObsSourceType(obsTypeId);

        // Posicionamiento de OBS (por defecto en lienzo 1920x1080)
        const posX = typeof item.pos?.x === 'number' ? item.pos.x : 0;
        const posY = typeof item.pos?.y === 'number' ? item.pos.y : 0;
        const scaleX = typeof item.scale?.x === 'number' ? item.scale.x : 1;
        const scaleY = typeof item.scale?.y === 'number' ? item.scale.y : 1;

        // Ancho base estimado según tipo de fuente
        let baseWidth = 1920;
        let baseHeight = 1080;
        if (sourceType === 'camera') {
          baseWidth = 480;
          baseHeight = 270;
        } else if (sourceType === 'text') {
          baseWidth = 600;
          baseHeight = 120;
        }

        const width = Math.max(50, Math.round(baseWidth * Math.abs(scaleX)));
        const height = Math.max(30, Math.round(baseHeight * Math.abs(scaleY)));

        const sourceItem: SourceItem = {
          id: `obs-src-${i}-${j}-${Date.now()}`,
          name: srcName,
          type: sourceType,
          targetCanvas: 'both',
          rect16_9: {
            x: Math.round(posX),
            y: Math.round(posY),
            width,
            height,
          },
          visible: item.visible !== false,
          locked: item.locked === true,
          color: getSourceDefaultColor(sourceType),
          properties: {
            text: sourceDef?.settings?.text || undefined,
            url: sourceDef?.settings?.url || undefined,
            windowTitle: sourceDef?.settings?.window || undefined,
            color: sourceDef?.settings?.color || undefined,
          },
        };

        sources.push(sourceItem);
        totalSourcesImported++;
      }

      convertedScenes.push({
        id: sceneId,
        name: sceneName,
        sources,
      });
    }

    return {
      success: true,
      collectionName,
      scenes: convertedScenes,
      importedCount: totalSourcesImported,
    };
  } catch (err: any) {
    return {
      success: false,
      scenes: [],
      error: `Error al procesar el archivo JSON de OBS: ${err.message || String(err)}`,
      importedCount: 0,
    };
  }
}
