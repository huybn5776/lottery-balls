import { Engine, Mouse, Runner, World } from 'matter-js';
import P5 from 'p5';

import { ViewRenderer, ViewRendererConfig } from '@/modules/view-render/view-render';
import { drawBodies } from '@/p5-helpers';

export function createP5Renderer({
  containerElement,
  width,
  height,
  engine,
}: ViewRendererConfig): Promise<ViewRenderer> {
  let runner: Runner;

  return new Promise((resolve) => {
    const sketch = (p5: P5): void => {
      // eslint-disable-next-line no-param-reassign
      p5.setup = () => {
        const p5Canvas = p5.createCanvas(width, height);
        const canvas: HTMLCanvasElement = p5Canvas.elt;

        resolve({
          canvas,
          addMouse: (mouse: Mouse) => {
            // eslint-disable-next-line no-param-reassign
            mouse.pixelRatio = p5Instance.pixelDensity();
          },
          run: () => {
            runner = Runner.run(engine);
          },
          pause: () => {
            p5Instance.noLoop();
            Runner.stop(runner);
          },
          resume: () => {
            p5Instance.loop();
            runner = Runner.run(engine);
          },
          stop: () => {
            p5Instance.noLoop();
            World.clear(engine.world, false);
            Engine.clear(engine);
            Runner.stop(runner);
          },
        });
      };

      // eslint-disable-next-line no-param-reassign
      p5.draw = () => {
        p5.background('#242424');
        p5.strokeWeight(0);

        drawBodies(p5, engine.world.bodies);

        p5.fill('yellow');
        p5.circle(p5.mouseX, p5.mouseY, 10);
      };
    };
    const p5Instance = new P5(sketch, containerElement);
  });
}
