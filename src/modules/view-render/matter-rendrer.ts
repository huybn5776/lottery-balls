import { Engine, Render, Runner, World, Mouse } from 'matter-js';

import { ViewRendererConfig, ViewRenderer } from '@/modules/view-render/view-render';

export function createMatterRenderer(
  { containerElement, width, height, engine }: ViewRendererConfig,
  wireframes = true,
): ViewRenderer {
  const render = Render.create({
    element: containerElement,
    engine,
    options: {
      width,
      height,
      wireframes,
    },
  });
  let runner: Runner;

  return {
    canvas: render.canvas,
    addMouse: (mouse: Mouse) => {
      render.mouse = mouse;
    },
    run: () => {
      Render.run(render);
      runner = Runner.run(engine);
    },
    pause: () => {
      Render.stop(render);
      Runner.stop(runner);
    },
    resume: () => {
      Render.run(render);
      runner = Runner.run(engine);
    },
    stop: () => {
      World.clear(engine.world, false);
      Engine.clear(engine);
      Render.stop(render);
      Runner.stop(runner);
      render.canvas.remove();
      render.textures = {};
    },
  };
}
