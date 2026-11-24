import { describe, it, expect } from 'vitest';
import { importObsCollection } from '../src/utils/obsImporter';

describe('Importador de Colecciones de Escenas de OBS Studio', () => {
  it('debe rechazar JSONs inválidos o corruptos', () => {
    const res1 = importObsCollection('esto no es un json');
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('JSON');

    const res2 = importObsCollection('null');
    expect(res2.success).toBe(false);
  });

  it('debe importar correctamente una colección con escenas y fuentes de OBS', () => {
    const mockObsJson = JSON.stringify({
      name: 'Stream Gamer Pro',
      current_scene: 'Escena Principal',
      sources: [
        {
          name: 'Escena Principal',
          id: 'scene',
          settings: {
            items: [
              {
                name: 'Pantalla Juego',
                pos: { x: 0, y: 0 },
                scale: { x: 1.0, y: 1.0 },
                visible: true,
                locked: true,
              },
              {
                name: 'Webcam C920',
                pos: { x: 1440, y: 810 },
                scale: { x: 1.0, y: 1.0 },
                visible: true,
                locked: false,
              },
            ],
          },
        },
        {
          name: 'Pantalla Juego',
          id: 'monitor_capture',
          settings: { monitor: 0 },
        },
        {
          name: 'Webcam C920',
          id: 'dshow_input',
          settings: { device: 'Logitech C920' },
        },
      ],
    });

    const result = importObsCollection(mockObsJson);
    expect(result.success).toBe(true);
    expect(result.collectionName).toBe('Stream Gamer Pro');
    expect(result.scenes.length).toBe(1);
    expect(result.scenes[0].name).toBe('Escena Principal');
    expect(result.scenes[0].sources.length).toBe(2);

    const pantalla = result.scenes[0].sources[0];
    expect(pantalla.name).toBe('Pantalla Juego');
    expect(pantalla.type).toBe('screen');
    expect(pantalla.locked).toBe(true);
    expect(pantalla.rect16_9.width).toBe(1920);

    const cam = result.scenes[0].sources[1];
    expect(cam.name).toBe('Webcam C920');
    expect(cam.type).toBe('camera');
    expect(cam.rect16_9.x).toBe(1440);
    expect(cam.rect16_9.y).toBe(810);
  });

  it('debe manejar colecciones sin escenas devolviendo error legible', () => {
    const mockEmpty = JSON.stringify({
      name: 'Coleccion Vacia',
      sources: [],
    });

    const result = importObsCollection(mockEmpty);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No se encontraron escenas');
  });
});
