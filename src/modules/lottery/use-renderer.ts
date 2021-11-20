import { ref, Ref, onMounted, onUnmounted } from 'vue';

import { Engine } from 'matter-js';
import { Subject } from 'rxjs';

import { ViewRenderer, createViewRenderer, RendererType } from '@modules/view-render/view-render';

export function useRenderer(canvasContainer: Ref<HTMLDivElement | undefined>): {
  rendererRef: Ref<ViewRenderer | undefined>;
  isRunning: Ref<boolean>;
  rendererReady$$: Subject<{ renderer: ViewRenderer; engine: Engine; width: number; height: number }>;
  engineRef: Ref<Engine | undefined>;
} {
  const rendererReady$$ = new Subject<{ renderer: ViewRenderer; engine: Engine; width: number; height: number }>();

  const rendererRef = ref<ViewRenderer>();
  const engineRef = ref<Engine>();
  const isRunning = ref(false);

  onMounted(async () => {
    if (!canvasContainer.value) {
      return;
    }

    const engine = Engine.create();
    engine.gravity.y = 1;
    engineRef.value = engine;

    const width = canvasContainer.value.clientWidth || 800;
    const height = canvasContainer.value.clientHeight || 720;

    rendererRef.value = await createViewRenderer(RendererType.MatterWireframes, {
      containerElement: canvasContainer.value,
      width,
      height,
      engine,
    });

    rendererReady$$.next({ renderer: rendererRef.value, engine, width, height });

    rendererRef.value.run();
    isRunning.value = true;
  });

  onUnmounted(() => rendererRef.value?.stop());

  return { rendererRef, engineRef, isRunning, rendererReady$$ };
}
