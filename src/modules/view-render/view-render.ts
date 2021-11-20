import { Mouse, Engine } from 'matter-js';

import { createMatterRenderer } from '@/modules/view-render/matter-rendrer';

export interface ViewRenderer {
  resume: () => void;
  canvas: HTMLCanvasElement;
  addMouse: (mouse: Mouse) => void;
  stop: () => void;
  run: () => void;
  pause: () => void;
}

export interface ViewRendererConfig {
  containerElement: HTMLElement;
  width: number;
  height: number;
  engine: Engine;
}

export enum RendererType {
  MatterWireframes,
  Matter,
}

export function createViewRenderer(type: RendererType, config: ViewRendererConfig): Promise<ViewRenderer> {
  switch (type) {
    case RendererType.MatterWireframes:
      return Promise.resolve(createMatterRenderer(config));
    case RendererType.Matter:
      return Promise.resolve(createMatterRenderer(config, false));
    default:
      throw new Error('Incorrect type');
  }
}
