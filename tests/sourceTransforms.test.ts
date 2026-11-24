import { describe, it, expect } from 'vitest';
import {
  INITIAL_DEFAULT_SCENES,
  DEFAULT_SOURCE_TRANSFORM,
  DEFAULT_SOURCE_FILTERS,
  sanitizeSourceItem,
} from '../src/services/storage';
import { SourceItem } from '../src/types/studio';

describe('Source Transformations & Default Screen Scene', () => {
  it('debe tener exactamente una escena principal por defecto con captura de pantalla', () => {
    expect(INITIAL_DEFAULT_SCENES).toHaveLength(1);
    const mainScene = INITIAL_DEFAULT_SCENES[0];
    expect(mainScene.name).toMatch(/Escena Principal/i);
    expect(mainScene.sources).toHaveLength(1);

    const screenSource = mainScene.sources[0];
    expect(screenSource.type).toBe('screen');
    expect(screenSource.name).toMatch(/Captura de Pantalla/i);
    expect(screenSource.rect16_9).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    expect(screenSource.transform.flipHorizontal).toBe(false);
  });

  it('debe sanitizar fuentes antiguas agregando transform y filters por defecto', () => {
    const legacySource: Partial<SourceItem> = {
      id: 'src-legacy',
      name: 'Fuente Antigua',
      type: 'camera',
      visible: true,
      locked: false,
      color: '#FF5722',
      rect16_9: { x: 0, y: 0, width: 480, height: 270 },
      properties: {},
    };

    const sanitized = sanitizeSourceItem(legacySource as any);
    expect(sanitized.transform).toEqual(DEFAULT_SOURCE_TRANSFORM);
    expect(sanitized.filters).toEqual(DEFAULT_SOURCE_FILTERS);
  });

  it('debe permitir activar el modo espejo (flipHorizontal) y rotación', () => {
    const source: Partial<SourceItem> = {
      id: 'src-camera',
      name: 'Cámara',
      type: 'camera',
      transform: {
        flipHorizontal: true,
        flipVertical: false,
        rotation: 90,
        scaleMode: 'fit',
      },
    };

    const sanitized = sanitizeSourceItem(source as any);
    expect(sanitized.transform.flipHorizontal).toBe(true);
    expect(sanitized.transform.rotation).toBe(90);
  });
});
