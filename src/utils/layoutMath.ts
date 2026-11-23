export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

export type LayerType = 'game' | 'camera' | 'overlay' | 'chat';

export interface LayerAnchorOptions {
  layerType?: LayerType;
  sourceCanvas?: CanvasDimensions;
  customThird?: 'top' | 'center' | 'bottom';
}

export const CANVAS_16_9: CanvasDimensions = { width: 1920, height: 1080 };
export const CANVAS_9_16: CanvasDimensions = { width: 1080, height: 1920 };

/**
 * Calcula la posición y dimensiones óptimas de una capa para el lienzo vertical (9:16)
 * preservando la relación de aspecto y aplicando reglas de anclaje inteligente.
 * 
 * Reglas por defecto:
 * - 'game': centrado vertical y horizontalmente a ancho completo.
 * - 'camera': anclada en el tercio superior (y >= 0, y < targetHeight / 3).
 * - 'chat' / 'overlay': anclada en el tercio inferior.
 */
export function calculateVerticalAnchor(
  source: Rect,
  targetCanvas: CanvasDimensions = CANVAS_9_16,
  optionsOrType?: LayerAnchorOptions | LayerType
): Rect {
  const options: LayerAnchorOptions =
    typeof optionsOrType === 'string'
      ? { layerType: optionsOrType }
      : optionsOrType || {};

  const sourceCanvas = options.sourceCanvas || CANVAS_16_9;

  // Si no se especifica el tipo, auto-detectar por posición típica
  let layerType: LayerType = options.layerType || 'game';
  if (!options.layerType) {
    const isBottomRight =
      source.x >= (sourceCanvas.width * 0.5) - 100 &&
      source.y >= (sourceCanvas.height * 0.5) - 100 &&
      source.width <= sourceCanvas.width * 0.6;

    if (isBottomRight) {
      layerType = 'camera';
    }
  }

  const aspectRatio = source.width / (source.height || 1);

  if (layerType === 'camera') {
    // Tercio superior: [0, targetCanvas.height / 3]
    const upperThirdHeight = targetCanvas.height / 3;

    // Escalar al ancho completo si cabe en altura en el tercio superior
    let scaledWidth = targetCanvas.width;
    let scaledHeight = scaledWidth / aspectRatio;

    if (scaledHeight > upperThirdHeight) {
      scaledHeight = upperThirdHeight;
      scaledWidth = scaledHeight * aspectRatio;
    }

    const x = (targetCanvas.width - scaledWidth) / 2;
    const y = (upperThirdHeight - scaledHeight) / 2;

    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      width: Math.round(scaledWidth * 100) / 100,
      height: Math.round(scaledHeight * 100) / 100,
    };
  }

  if (layerType === 'chat' || layerType === 'overlay') {
    // Tercio inferior: [(targetCanvas.height * 2) / 3, targetCanvas.height]
    const lowerThirdY = (targetCanvas.height * 2) / 3;
    const lowerThirdHeight = targetCanvas.height / 3;

    let scale = Math.min(
      targetCanvas.width / source.width,
      lowerThirdHeight / source.height
    );
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;

    const scaledWidth = source.width * scale;
    const scaledHeight = source.height * scale;

    const x = (targetCanvas.width - scaledWidth) / 2;
    const y = lowerThirdY + (lowerThirdHeight - scaledHeight) / 2;

    return {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      width: Math.round(scaledWidth * 100) / 100,
      height: Math.round(scaledHeight * 100) / 100,
    };
  }

  // Por defecto (game / pantalla principal): Centrado vertical en 9:16
  const scale = targetCanvas.width / source.width;
  const scaledWidth = targetCanvas.width;
  const scaledHeight = source.height * scale;
  const centeredY = (targetCanvas.height - scaledHeight) / 2;

  return {
    x: 0,
    y: Math.round(centeredY * 100) / 100,
    width: Math.round(scaledWidth * 100) / 100,
    height: Math.round(scaledHeight * 100) / 100,
  };
}

/**
 * Escala y ajusta un rectángulo conteniéndolo dentro del contenedor manteniendo el aspecto.
 */
export function calculateAspectFit(
  source: { width: number; height: number },
  container: { width: number; height: number }
): { width: number; height: number; scale: number } {
  const scale = Math.min(
    container.width / source.width,
    container.height / source.height
  );
  return {
    width: source.width * scale,
    height: source.height * scale,
    scale,
  };
}
