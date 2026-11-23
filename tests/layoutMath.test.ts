import { describe, it, expect } from 'vitest';
import {
  calculateVerticalAnchor,
  CANVAS_9_16,
  Rect,
} from '../src/utils/layoutMath';

describe('Layout Math & Anclaje Inteligente (Smart Anchor)', () => {
  it('calcula centrado vertical exacto para fuente horizontal 16:9 (1920x1080) en destino vertical 9:16 (1080x1920)', () => {
    const horizontalSource: Rect = { x: 0, y: 0, width: 1920, height: 1080 };
    const verticalTarget = CANVAS_9_16; // { width: 1080, height: 1920 }

    const result = calculateVerticalAnchor(horizontalSource, verticalTarget);

    expect(result.width).toBe(1080);
    expect(result.height).toBe(607.5);
    expect(result.x).toBe(0);
    // Debe quedar centrado verticalmente: y = (1920 - 607.5) / 2 = 656.25
    expect(result.y).toBeCloseTo(656.25, 2);
  });

  it('ancla automáticamente una cámara en la esquina inferior derecha de 16:9 en el tercio superior en 9:16', () => {
    // Cámara típica PIP en la esquina inferior derecha en 1920x1080
    const cameraSource: Rect = { x: 1440, y: 810, width: 480, height: 270 };
    const verticalTarget = CANVAS_9_16;

    // Con opción explícita de tipo de capa 'camera'
    const resultExplicit = calculateVerticalAnchor(cameraSource, verticalTarget, {
      layerType: 'camera',
    });

    const upperThirdLimit = verticalTarget.height / 3; // 640
    expect(resultExplicit.y).toBeGreaterThanOrEqual(0);
    expect(resultExplicit.y).toBeLessThan(upperThirdLimit);
    expect(resultExplicit.y + resultExplicit.height).toBeLessThanOrEqual(upperThirdLimit + 1);
    expect(resultExplicit.width).toBeGreaterThan(0);
    expect(resultExplicit.height).toBeGreaterThan(0);

    // Auto-detección cuando layerType no se pasa explícitamente pero la posición es esquina inferior derecha
    const resultAuto = calculateVerticalAnchor(cameraSource, verticalTarget);
    expect(resultAuto.y).toBeGreaterThanOrEqual(0);
    expect(resultAuto.y).toBeLessThan(upperThirdLimit);
  });

  it('ancla capa de chat u overlays en el tercio inferior del formato 9:16', () => {
    const chatSource: Rect = { x: 0, y: 720, width: 400, height: 360 };
    const verticalTarget = CANVAS_9_16;

    const result = calculateVerticalAnchor(chatSource, verticalTarget, {
      layerType: 'chat',
    });

    const lowerThirdStart = (verticalTarget.height * 2) / 3; // 1280
    expect(result.y).toBeGreaterThanOrEqual(lowerThirdStart - 10);
  });

  it('preserva la relación de aspecto sin deformación en el escalado de cualquier fuente', () => {
    const customSource: Rect = { x: 100, y: 100, width: 800, height: 450 }; // 16:9
    const originalAspect = customSource.width / customSource.height;

    const result = calculateVerticalAnchor(customSource, CANVAS_9_16, {
      layerType: 'game',
    });

    const resultAspect = result.width / result.height;
    expect(resultAspect).toBeCloseTo(originalAspect, 2);
  });
});
