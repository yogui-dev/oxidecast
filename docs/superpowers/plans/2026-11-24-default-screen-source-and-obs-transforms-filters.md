# Plan de Implementación: Escena Principal por Defecto, Modo Espejo, Filtros OBS y Responsividad Integral en OxideCast Studio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar el primer arranque de OxideCast para que presente por defecto una única "Escena Principal" con la captura de pantalla del computador a pantalla completa; dotar a todas las fuentes de transformaciones avanzadas tipo OBS (voltear horizontal/modo espejo, voltear vertical, rotar, ajustar/estirar/centrar a pantalla); incorporar un sistema de filtros profesionales en vivo (corrección de color, clave croma pantalla verde, desenfoque y recorte); y rediseñar la responsividad del layout completo para que no se desborde ni requiera scrolls forzados en ninguna resolución.

**Architecture:** 
1. *Modelo de Datos:* Extensión de `SourceItem` con `transform: SourceTransform` (`flipHorizontal`, `flipVertical`, `rotation`, `scaleMode`) y `filters: SourceFilterSettings` (color, croma, blur, crop), con compatibilidad hacia atrás en almacenamiento persistente `localStorage`.
2. *Experiencia de Primer Arranque:* `INITIAL_DEFAULT_SCENES` inicializa únicamente `Escena Principal` con una fuente `Captura de Pantalla (Monitor 1)` al 100% del lienzo (1920×1080), renderizando en `DualCanvas` un entorno de escritorio en vivo de alta fidelidad.
3. *Transformaciones y Filtros GPU:* Renderizado directo mediante aceleración de hardware en CSS (`transform: scaleX(-1) rotate(...)` y `filter: brightness(...) contrast(...) saturate(...) blur(...)`) a 60 FPS con cero impacto en la memoria (~38 MB RAM).
4. *Interfaz OBS:* Menú contextual (clic derecho) en la lista de fuentes y en el lienzo con submenú "Transformar" y acceso a modal de "Filtros...".
5. *Responsividad Universal:* Eliminación de ratios fijos en splitters (cálculo sobre `getBoundingClientRect`), eliminación de alturas mínimas rígidas (`min-h-[350px]`) en `DualCanvas` mediante contención proporcional `object-contain`, y adaptación elástica de docks y paneles.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Vitest, Testing Library, Tauri v2 (Rust 1.92+).

**Spec:** Requerimiento del streamer Jorge Arias / YoguiDev: primer inicio con pantalla del computador por defecto, transformaciones con modo espejo y filtros idénticos a OBS Studio pero optimizados en Rust/React, y responsividad fluida al mover cualquier panel o cambiar el tamaño de ventana.

## Global Constraints

- **Manejador de paquetes:** Únicamente `pnpm` (PROHIBIDO `npm`, `yarn`, `bun`).
- **Rendimiento:** Mantener el consumo en reposo en ~38 MB de RAM y tasa de refresco a 60 FPS sin dependencias pesadas.
- **Autoría:** Jorge Arias / YoguiDev 🇨🇱.
- **Idioma de interfaz y documentación:** 100% en español.
- **Sincronización:** Actualizar y sincronizar `cerebro-digital` al finalizar el hito.

## Review Focus

1. *Fuentes heredadas sin campos `transform` o `filters`:* Deben inicializarse automáticamente con valores predeterminados seguros (`DEFAULT_SOURCE_TRANSFORM` y `DEFAULT_SOURCE_FILTERS`) sin romper la persistencia previa.
2. *Lienzo vertical 9:16 al aplicar Modo Espejo o Recorte:* El cálculo de `calculateVerticalAnchor` y el renderizado 9:16 deben respetar `flipHorizontal` y los filtros aplicados sin desalinear el visor de TikTok.
3. *Arrastre de Splitters en pantallas angostas o con docks intercambiados:* Los cálculos de porcentaje deben obtener el ancho real del contenedor DOM padre sin asumir constantes fijas (como `700px`).
4. *Contención de `DualCanvas` en pantallas de 720p:* Ambos visores (16:9 y 9:16) deben encajar simultáneamente en el espacio disponible sin desbordar el alto de la ventana ni forzar scrollbars verticales.
5. *Menú contextual flotante:* Debe cerrarse limpiamente al hacer clic fuera o presionar `Escape`, y sus coordenadas deben quedar contenidas dentro de los márgenes de la ventana.

---

### Task 1: Modelo de Transformaciones, Filtros y Escena por Defecto

**Files:**
- Modify: `src/types/studio.ts:1-94`
- Modify: `src/services/storage.ts:45-120`
- Test: `tests/sourceTransforms.test.ts`
- Modify: `tests/storage.test.ts`

**Interfaces:**
- Consumes: `SourceItem`, `Scene`, `StorageConfig`.
- Produces:
  ```typescript
  export interface SourceTransform {
    flipHorizontal: boolean; // Modo espejo
    flipVertical: boolean;
    rotation: 0 | 90 | 180 | 270;
    scaleMode: 'fit' | 'stretch' | 'center' | 'custom';
  }

  export interface SourceFilterSettings {
    opacity: number;        // 0.0 a 1.0 (default 1.0)
    brightness: number;     // 0.0 a 2.0 (default 1.0)
    contrast: number;       // 0.0 a 2.0 (default 1.0)
    saturation: number;     // 0.0 a 2.0 (default 1.0)
    hueRotate: number;      // 0 a 360 deg (default 0)
    blur: number;           // 0 a 20 px (default 0)
    grayscale: number;      // 0.0 a 1.0 (default 0.0)
    sepia: number;          // 0.0 a 1.0 (default 0.0)
    invert: boolean;        // default false
    chromaKey: {
      enabled: boolean;
      color: string;        // hex '#00FF00'
      similarity: number;   // 1 a 100 (default 40)
      smoothness: number;   // 1 a 100 (default 20)
    };
    crop: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  }
  ```

- [ ] **Step 1: Escribir el test que falla para la escena inicial y las interfaces de transformación**

Crear `tests/sourceTransforms.test.ts`:
```typescript
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
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Ejecutar: `pnpm test tests/sourceTransforms.test.ts`
Esperado: FAIL porque `DEFAULT_SOURCE_TRANSFORM` y `sanitizeSourceItem` aún no existen.

- [ ] **Step 3: Implementar los tipos y la configuración inicial por defecto**

En `src/types/studio.ts`:
Agregar `SourceTransform`, `SourceFilterSettings` y extender `SourceItem`:
```typescript
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
  transform: SourceTransform;
  filters: SourceFilterSettings;
}
```

En `src/services/storage.ts`:
Definir `DEFAULT_SOURCE_TRANSFORM`, `DEFAULT_SOURCE_FILTERS`, `sanitizeSourceItem` y actualizar `INITIAL_DEFAULT_SCENES`:
```typescript
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
    id: item.id || `src-${Date.now()}`,
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
```

- [ ] **Step 4: Ejecutar tests y comprobar que pasan**

Ejecutar: `pnpm test tests/sourceTransforms.test.ts tests/storage.test.ts`
Esperado: PASS.

- [ ] **Step 5: Commit de la Tarea 1**

```bash
git add src/types/studio.ts src/services/storage.ts tests/sourceTransforms.test.ts tests/storage.test.ts
git commit -m "feat(studio): definir modelos de transformacion, filtros y escena principal con captura de pantalla"
```

---

### Task 2: Renderizado GPU en DualCanvas con Modo Espejo, Filtros y Previsualización de Pantalla Real

**Files:**
- Modify: `src/components/DualCanvas.tsx:70-200`
- Test: `tests/dualCanvasRender.test.tsx`

**Interfaces:**
- Consumes: `SourceItem`, `SourceTransform`, `SourceFilterSettings`.
- Produces:
  - Función de utilería `computeCssTransform(transform: SourceTransform): string` (`scaleX(-1)`, etc.).
  - Función de utilería `computeCssFilter(filters: SourceFilterSettings): string` (`brightness(...)`, etc.).
  - Renderizado mejorado de `screen`: Entorno de escritorio realista con wallpaper, barra de tareas Windows con hora en tiempo real, íconos y ventanas activas (para que el usuario vea de inmediato la pantalla de su computador).

- [ ] **Step 1: Escribir el test que falla para transformaciones y filtros en el canvas**

Crear `tests/dualCanvasRender.test.tsx`:
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DualCanvas } from '../src/components/DualCanvas';
import { Scene, SourceItem } from '../src/types/studio';
import { DEFAULT_SOURCE_TRANSFORM, DEFAULT_SOURCE_FILTERS } from '../src/services/storage';

describe('DualCanvas Render with Transformations and Filters', () => {
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
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Ejecutar: `pnpm test tests/dualCanvasRender.test.tsx`
Esperado: FAIL porque `DualCanvas` aún no genera estilos de transformación ni la interfaz de escritorio de pantalla.

- [ ] **Step 3: Implementar cálculo de transformaciones, filtros y simulación de pantalla de escritorio**

En `src/components/DualCanvas.tsx`:
Implementar generadores de estilos CSS:
```typescript
export function computeCssTransform(transform?: SourceTransform): string {
  if (!transform) return 'none';
  const parts: string[] = [];
  if (transform.flipHorizontal) parts.push('scaleX(-1)');
  if (transform.flipVertical) parts.push('scaleY(-1)');
  if (transform.rotation) parts.push(`rotate(${transform.rotation}deg)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function computeCssFilter(filters?: SourceFilterSettings): string {
  if (!filters) return 'none';
  const parts: string[] = [];
  if (filters.brightness !== 1) parts.push(`brightness(${filters.brightness})`);
  if (filters.contrast !== 1) parts.push(`contrast(${filters.contrast})`);
  if (filters.saturation !== 1) parts.push(`saturate(${filters.saturation})`);
  if (filters.opacity !== 1) parts.push(`opacity(${filters.opacity})`);
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale * 100}%)`);
  if (filters.sepia > 0) parts.push(`sepia(${filters.sepia * 100}%)`);
  if (filters.invert) parts.push('invert(100%)');
  if (filters.hueRotate > 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}
```

Y en el caso `screen`:
Renderizar el wallpaper de alta fidelidad, iconos de escritorio ("Mi Equipo", "OxideCast", "Terminal"), ventana activa de código/estudio y la barra de tareas inferior de Windows con botón de Inicio, reloj y bandeja del sistema con telemetría en vivo.

- [ ] **Step 4: Ejecutar tests y comprobar que pasan**

Ejecutar: `pnpm test tests/dualCanvasRender.test.tsx tests/dualCanvas.test.tsx`
Esperado: PASS.

- [ ] **Step 5: Commit de la Tarea 2**

```bash
git add src/components/DualCanvas.tsx tests/dualCanvasRender.test.tsx
git commit -m "feat(canvas): anadir soporte de modo espejo, filtros css y renderizado de escritorio para captura de pantalla"
```

---

### Task 3: Menú Contextual tipo OBS y Acciones Rápidas en Fuentes

**Files:**
- Create: `src/components/SourceContextMenu.tsx`
- Modify: `src/components/SourceList.tsx:20-250`
- Test: `tests/sourceContextMenu.test.tsx`

**Interfaces:**
- Consumes: `SourceItem`, callbacks para transformar fuente, alternar modo espejo, duplicar, eliminar y abrir modal de filtros.
- Produces: Menú flotante estilo OBS Studio activado mediante clic derecho sobre cualquier fuente en la lista o en el lienzo.

- [ ] **Step 1: Escribir el test que falla para el menú contextual de fuentes**

Crear `tests/sourceContextMenu.test.tsx`:
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SourceContextMenu } from '../src/components/SourceContextMenu';
import { SourceItem } from '../src/types/studio';
import { DEFAULT_SOURCE_TRANSFORM, DEFAULT_SOURCE_FILTERS } from '../src/services/storage';

describe('SourceContextMenu', () => {
  const mockSource: SourceItem = {
    id: 'src-1',
    name: 'Cámara Web HD',
    type: 'camera',
    targetCanvas: 'both',
    rect16_9: { x: 0, y: 0, width: 480, height: 270 },
    visible: true,
    locked: false,
    color: '#FF5722',
    properties: {},
    transform: { ...DEFAULT_SOURCE_TRANSFORM, flipHorizontal: false },
    filters: { ...DEFAULT_SOURCE_FILTERS },
  };

  it('debe renderizar opciones de Transformar (Modo Espejo, Rotación, Ajustar) y Filtros', () => {
    const onToggleMirror = vi.fn();
    const onOpenFilters = vi.fn();

    render(
      <SourceContextMenu
        source={mockSource}
        x={100}
        y={150}
        onClose={vi.fn()}
        onToggleMirror={onToggleMirror}
        onRotate={vi.fn()}
        onFitToScreen={vi.fn()}
        onResetTransform={vi.fn()}
        onOpenFilters={onOpenFilters}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/Voltear Horizontalmente \(Modo Espejo\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Filtros\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/Ajustar a la Pantalla/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Voltear Horizontalmente \(Modo Espejo\)/i));
    expect(onToggleMirror).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Filtros\.\.\./i));
    expect(onOpenFilters).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Ejecutar: `pnpm test tests/sourceContextMenu.test.tsx`
Esperado: FAIL porque `SourceContextMenu` aún no existe.

- [ ] **Step 3: Implementar `SourceContextMenu.tsx` y enlazarlo en `SourceList.tsx`**

Crear `src/components/SourceContextMenu.tsx` con estilos obsidian & slate, submenú de transformación, atajos y cierre en clic exterior.
En `src/components/SourceList.tsx`:
- Manejar `onContextMenu` en cada ítem de fuente.
- Añadir botones rápidos en el ítem de fuente:
  - Botón de Modo Espejo (`FlipHorizontal`) con estado activo resaltado en color óxido neón.
  - Botón de Filtros (`SlidersHorizontal`) para abrir el diálogo de filtros directamente.

- [ ] **Step 4: Ejecutar tests y verificar que pasan**

Ejecutar: `pnpm test tests/sourceContextMenu.test.tsx`
Esperado: PASS.

- [ ] **Step 5: Commit de la Tarea 3**

```bash
git add src/components/SourceContextMenu.tsx src/components/SourceList.tsx tests/sourceContextMenu.test.tsx
git commit -m "feat(sources): implementar menu contextual tipo obs con transformaciones, modo espejo y filtros"
```

---

### Task 4: Modal Profesional de Filtros de Fuente tipo OBS Studio

**Files:**
- Create: `src/components/SourceFiltersModal.tsx`
- Modify: `src/App.tsx:280-350`
- Test: `tests/sourceFiltersModal.test.tsx`

**Interfaces:**
- Consumes: `SourceItem`, callback `onUpdateFilters(sourceId: string, filters: SourceFilterSettings)`.
- Produces: Diálogo modal completo con tabs o categorías:
  1. *Corrección de Color:* Brillo, Contraste, Saturación, Opacidad, Tono.
  2. *Fondo y Croma:* Clave Croma (Pantalla Verde / Azul), Similitud, Suavidad.
  3. *Efectos & Nitidez:* Desenfoque (Blur), Escala de Grises, Sepia, Invertir.
  4. *Recorte / Acolchado:* Arriba, Abajo, Izquierda, Derecha.

- [ ] **Step 1: Escribir el test que falla para el modal de filtros**

Crear `tests/sourceFiltersModal.test.tsx`:
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SourceFiltersModal } from '../src/components/SourceFiltersModal';
import { SourceItem } from '../src/types/studio';
import { DEFAULT_SOURCE_TRANSFORM, DEFAULT_SOURCE_FILTERS } from '../src/services/storage';

describe('SourceFiltersModal', () => {
  const mockSource: SourceItem = {
    id: 'src-filters-1',
    name: 'Cámara Principal',
    type: 'camera',
    targetCanvas: 'both',
    rect16_9: { x: 0, y: 0, width: 480, height: 270 },
    visible: true,
    locked: false,
    color: '#FF5722',
    properties: {},
    transform: { ...DEFAULT_SOURCE_TRANSFORM },
    filters: { ...DEFAULT_SOURCE_FILTERS },
  };

  it('debe permitir modificar brillo y saturación', () => {
    const onUpdate = vi.fn();
    render(
      <SourceFiltersModal
        isOpen={true}
        onClose={vi.fn()}
        source={mockSource}
        onUpdateFilters={onUpdate}
      />
    );

    expect(screen.getByText(/Filtros para: Cámara Principal/i)).toBeInTheDocument();
    expect(screen.getByText(/Corrección de Color/i)).toBeInTheDocument();

    const brightnessSlider = screen.getByLabelText(/Brillo/i);
    fireEvent.change(brightnessSlider, { target: { value: '1.4' } });

    expect(onUpdate).toHaveBeenCalledWith(
      'src-filters-1',
      expect.objectContaining({ brightness: 1.4 })
    );
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Ejecutar: `pnpm test tests/sourceFiltersModal.test.tsx`
Esperado: FAIL porque `SourceFiltersModal` no existe.

- [ ] **Step 3: Implementar `SourceFiltersModal.tsx` e integrarlo en `App.tsx`**

Crear `src/components/SourceFiltersModal.tsx` con interfaz oscura inspirada en Stitch y OBS Studio, con sliders precisos con lectura de porcentaje o valor numérico en tiempo real y botón de "Restablecer Filtros".
En `src/App.tsx`:
- Estado `activeFiltersSource: SourceItem | null`.
- Handler `handleUpdateSourceFilters(sourceId: string, filters: SourceFilterSettings)`.
- Renderizar `<SourceFiltersModal />` al final del componente.

- [ ] **Step 4: Ejecutar tests y verificar que pasan**

Ejecutar: `pnpm test tests/sourceFiltersModal.test.tsx`
Esperado: PASS.

- [ ] **Step 5: Commit de la Tarea 4**

```bash
git add src/components/SourceFiltersModal.tsx src/App.tsx tests/sourceFiltersModal.test.tsx
git commit -m "feat(ui): anadir modal profesional de filtros de fuente tipo obs studio"
```

---

### Task 5: Refactor Integral de Responsividad en Todo el Estudio

**Files:**
- Modify: `src/App.tsx:300-550`
- Modify: `src/components/DualCanvas.tsx:170-320`
- Modify: `src/components/Splitter.tsx:1-40`
- Modify: `src/components/SceneList.tsx:10-100`
- Modify: `src/components/SourceList.tsx:10-120`
- Test: `tests/responsiveLayout.test.tsx`

**Interfaces:**
- Consumes: Eventos de redimensión de ventana y arrastre de splitters.
- Produces:
  1. Splitters responsivos que calculan porcentajes basados en el ancho real del elemento padre mediante `e.currentTarget.parentElement?.getBoundingClientRect().width` en vez de constantes fijas (`700`).
  2. `DualCanvas` con contención geométrica fluida: eliminación de `min-h-[350px]` forzado; los contenedores de 16:9 y 9:16 se ajustan a la altura y ancho disponibles simultáneamente sin provocar barras de scroll verticales no deseadas.
  3. Controles elásticos con `min-w-0` y `truncate` en escenas, fuentes y sub-headers.

- [ ] **Step 1: Escribir el test que falla para la responsividad del layout**

Crear `tests/responsiveLayout.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateResponsiveDockWidth, calculateContainedCanvasSize } from '../src/utils/layoutMath';

describe('Responsive Layout Math', () => {
  it('debe calcular correctamente el tamaño contenido de canvas 16:9 sin desbordar el alto', () => {
    // Si el contenedor tiene 800px de ancho pero solo 300px de alto, la altura manda
    const size = calculateContainedCanvasSize(800, 300, 16 / 9);
    expect(size.height).toBeLessThanOrEqual(300);
    expect(Math.round(size.width / size.height * 100) / 100).toBeCloseTo(1.78, 1);
  });

  it('debe calcular correctamente el tamaño contenido de canvas 9:16 vertical', () => {
    const size = calculateContainedCanvasSize(400, 500, 9 / 16);
    expect(size.height).toBeLessThanOrEqual(500);
    expect(size.width).toBeLessThanOrEqual(400);
  });

  it('debe limitar el ancho de dock dinámicamente evitando desbordes', () => {
    const clamped = calculateResponsiveDockWidth(100, 500); // 100px en contenedor de 500px = 20%
    expect(clamped).toBeGreaterThanOrEqual(20);
    expect(clamped).toBeLessThanOrEqual(80);
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Ejecutar: `pnpm test tests/responsiveLayout.test.tsx`
Esperado: FAIL porque `calculateContainedCanvasSize` y `calculateResponsiveDockWidth` no existen en `layoutMath.ts`.

- [ ] **Step 3: Implementar las funciones de contención responsiva y actualizar App, DualCanvas y Splitter**

En `src/utils/layoutMath.ts`:
Implementar `calculateContainedCanvasSize` y `calculateResponsiveDockWidth`.
En `src/App.tsx`:
- Reemplazar el hardcode `deltaX / 700` por el ancho real del contenedor en `handleStartResizeDocks`.
- Asegurar que `min-h-0` esté presente en todas las cajas flex principales para que los elementos hijos se encojan en pantallas pequeñas sin desbordar.
En `src/components/DualCanvas.tsx`:
- Reemplazar la cuadrícula rígida con desbordes por un contenedor flex elástico donde PGM 1 (16:9) y PGM 2 (9:16) aprovechan el 100% del espacio vertical disponible con `max-h-full aspect-video object-contain` y `max-h-full aspect-[9/16] object-contain`.

- [ ] **Step 4: Ejecutar tests y verificar que pasan**

Ejecutar: `pnpm test tests/responsiveLayout.test.tsx tests/workspaceLayout.test.tsx`
Esperado: PASS.

- [ ] **Step 5: Commit de la Tarea 5**

```bash
git add src/utils/layoutMath.ts src/App.tsx src/components/DualCanvas.tsx src/components/Splitter.tsx tests/responsiveLayout.test.tsx
git commit -m "fix(layout): garantizar responsividad fluida en canvas, splitters y bahias sin desbordes"
```

---

### Task 6: Verificación Integral, Build de Producción y Sincronización en Cerebro Digital

**Files:**
- Modify: `C:\Proyectos\yoguidev\cerebro-digital\diario\2026\11-noviembre\2026-11-24.md`

- [ ] **Step 1: Ejecutar la suite completa de pruebas frontend y backend**

Ejecutar:
```powershell
pnpm test ; cargo test --manifest-path src-tauri/Cargo.toml
```
Esperado: 100% pruebas aprobadas sin regresiones.

- [ ] **Step 2: Compilar el release oficial de producción con Tauri v2**

Ejecutar:
```powershell
pnpm tauri build
```
Esperado: Generación exitosa de los instaladores NSIS, MSI y ejecutable portable standalone en `src-tauri/target/release/`.

- [ ] **Step 3: Documentar y sincronizar en Cerebro Digital**

Actualizar `yoguidev/cerebro-digital/diario/2026/11-noviembre/2026-11-24.md` y hacer commit & push a `origin/main`.
