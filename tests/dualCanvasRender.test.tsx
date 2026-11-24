import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  DualCanvas,
  computeCssTransform,
  computeCssFilter,
} from '../src/components/DualCanvas';
import { Scene } from '../src/types/studio';
import {
  DEFAULT_SOURCE_TRANSFORM,
  DEFAULT_SOURCE_FILTERS,
} from '../src/services/storage';

describe('DualCanvas Render with Transformations and Filters', () => {
  describe('computeCssTransform helper', () => {
    it('retorna "none" cuando no hay transformaciones activas o es undefined', () => {
      expect(computeCssTransform()).toBe('none');
      expect(computeCssTransform(DEFAULT_SOURCE_TRANSFORM)).toBe('none');
    });

    it('genera scaleX(-1) para modo espejo (flipHorizontal)', () => {
      expect(
        computeCssTransform({ ...DEFAULT_SOURCE_TRANSFORM, flipHorizontal: true })
      ).toBe('scaleX(-1)');
    });

    it('genera scaleY(-1) para volteo vertical (flipVertical)', () => {
      expect(
        computeCssTransform({ ...DEFAULT_SOURCE_TRANSFORM, flipVertical: true })
      ).toBe('scaleY(-1)');
    });

    it('genera rotate(90deg) para rotacion', () => {
      expect(
        computeCssTransform({ ...DEFAULT_SOURCE_TRANSFORM, rotation: 90 })
      ).toBe('rotate(90deg)');
    });

    it('encadena multiples transformaciones', () => {
      expect(
        computeCssTransform({
          flipHorizontal: true,
          flipVertical: true,
          rotation: 180,
          scaleMode: 'fit',
        })
      ).toBe('scaleX(-1) scaleY(-1) rotate(180deg)');
    });
  });

  describe('computeCssFilter helper', () => {
    it('retorna "none" cuando los filtros son los predeterminados o undefined', () => {
      expect(computeCssFilter()).toBe('none');
      expect(computeCssFilter(DEFAULT_SOURCE_FILTERS)).toBe('none');
    });

    it('encadena filtros individuales de correccion de color y desenfoque', () => {
      expect(
        computeCssFilter({
          ...DEFAULT_SOURCE_FILTERS,
          brightness: 1.5,
          contrast: 1.2,
          blur: 4,
          invert: true,
        })
      ).toBe('brightness(1.5) contrast(1.2) blur(4px) invert(100%)');
    });

    it('soporta saturacion, opacidad, escala de grises, sepia y tono', () => {
      expect(
        computeCssFilter({
          ...DEFAULT_SOURCE_FILTERS,
          saturation: 1.8,
          opacity: 0.7,
          grayscale: 0.5,
          sepia: 0.3,
          hueRotate: 45,
        })
      ).toBe('saturate(1.8) opacity(0.7) blur(0px) grayscale(50%) sepia(30%) hue-rotate(45deg)'.replace(' blur(0px)', ''));
    });
  });

  describe('Renderizado en el DOM de DualCanvas', () => {
    it('debe aplicar transform scaleX(-1) cuando el modo espejo (flipHorizontal) está activo', () => {
      const sceneWithMirror: Scene = {
        id: 'scene-test',
        name: 'Escena Test',
        sources: [
          {
            id: 'src-cam-mirror',
            name: 'Cámara Espejada',
            type: 'camera',
            targetCanvas: 'both',
            rect16_9: { x: 0, y: 0, width: 480, height: 270 },
            visible: true,
            locked: false,
            color: '#FF5722',
            properties: {},
            transform: { ...DEFAULT_SOURCE_TRANSFORM, flipHorizontal: true },
            filters: { ...DEFAULT_SOURCE_FILTERS },
          },
        ],
      };

      const { container } = render(<DualCanvas activeScene={sceneWithMirror} />);
      const sourceEl = container.querySelector('[data-source-id="src-cam-mirror"]');
      expect(sourceEl).toBeInTheDocument();
      expect(sourceEl?.getAttribute('style')).toContain('scaleX(-1)');
    });

    it('debe aplicar filtros CSS en el atributo style de la capa', () => {
      const sceneWithFilter: Scene = {
        id: 'scene-filter',
        name: 'Escena Filtros',
        sources: [
          {
            id: 'src-filtered',
            name: 'Cámara con Filtro',
            type: 'camera',
            targetCanvas: 'both',
            rect16_9: { x: 0, y: 0, width: 480, height: 270 },
            visible: true,
            locked: false,
            color: '#FF5722',
            properties: {},
            transform: { ...DEFAULT_SOURCE_TRANSFORM },
            filters: { ...DEFAULT_SOURCE_FILTERS, brightness: 1.4, blur: 5 },
          },
        ],
      };

      const { container } = render(<DualCanvas activeScene={sceneWithFilter} />);
      const sourceEl = container.querySelector('[data-source-id="src-filtered"]');
      expect(sourceEl).toBeInTheDocument();
      expect(sourceEl?.getAttribute('style')).toContain('brightness(1.4)');
      expect(sourceEl?.getAttribute('style')).toContain('blur(5px)');
    });

    it('debe renderizar el entorno de escritorio en la captura de pantalla por defecto', () => {
      const sceneWithScreen: Scene = {
        id: 'scene-screen',
        name: 'Escena Pantalla',
        sources: [
          {
            id: 'src-screen',
            name: 'Captura de Pantalla (Monitor 1)',
            type: 'screen',
            targetCanvas: 'both',
            rect16_9: { x: 0, y: 0, width: 1920, height: 1080 },
            visible: true,
            locked: false,
            color: '#3B82F6',
            properties: {},
            transform: { ...DEFAULT_SOURCE_TRANSFORM },
            filters: { ...DEFAULT_SOURCE_FILTERS },
          },
        ],
      };

      render(<DualCanvas activeScene={sceneWithScreen} />);
      expect(screen.getAllByText(/Monitor 1/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Escritorio Windows/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Este Equipo/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Terminal PowerShell/i).length).toBeGreaterThan(0);
    });
  });
});
