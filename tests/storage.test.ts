import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStudioConfig,
  saveStudioConfig,
  INITIAL_DEFAULT_CONFIG,
} from '../src/services/storage';

describe('Servicio de Persistencia Local de OxideCast', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe devolver la configuración inicial por defecto si el storage está vacío', () => {
    const config = loadStudioConfig();
    expect(config.scenes.length).toBeGreaterThanOrEqual(1);
    expect(config.activeSceneId).toBe('scene-main');
    expect(config.destinations.length).toBeGreaterThanOrEqual(4);
    expect(config.chatChannels.length).toBeGreaterThanOrEqual(3);
  });

  it('debe guardar y cargar correctamente una configuración personalizada', () => {
    const customConfig = {
      ...INITIAL_DEFAULT_CONFIG,
      activeSceneId: 'mi-escena-personalizada',
      scenes: [
        {
          id: 'mi-escena-personalizada',
          name: 'Escena de Torneo eSports',
          sources: [],
        },
      ],
    };

    saveStudioConfig(customConfig);
    const loaded = loadStudioConfig();

    expect(loaded.activeSceneId).toBe('mi-escena-personalizada');
    expect(loaded.scenes.length).toBe(1);
    expect(loaded.scenes[0].name).toBe('Escena de Torneo eSports');
  });

  it('debe manejar datos corruptos en localStorage volviendo a los valores por defecto', () => {
    localStorage.setItem('oxidecast_studio_profile_v1', '{ corrupt json');
    const loaded = loadStudioConfig();
    expect(loaded.activeSceneId).toBe('scene-main');
  });
});
