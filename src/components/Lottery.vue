<template>
  <div class="lottery-view">
    <div class="matter-container" ref="canvasContainer"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted } from 'vue';

import { Body } from 'matter-js';
import { Subject } from 'rxjs';

import { autoPauseRender } from '@/auto-pause-render';
import { createSense, createMouseConstraint } from '@modules/lottery/scenes';
import { useRenderer } from '@modules/lottery/use-renderer';

const canvasContainer = ref<HTMLDivElement>();

const octagonBound = ref<Body>();

const destroy$ = new Subject<void>();

const { rendererReady$$, isRunning } = useRenderer(canvasContainer);

rendererReady$$.subscribe(({ renderer, engine, width, height }) => {
  const running$ = autoPauseRender(renderer, destroy$);
  running$.subscribe((running) => {
    isRunning.value = running;
  });

  const { octagon } = createSense(engine.world, width, height);
  octagonBound.value = octagon;

  const mouse = createMouseConstraint(renderer.canvas, engine);
  renderer.addMouse(mouse);
});

onUnmounted(() => {
  destroy$.next();
  destroy$.complete();
});
</script>

<style lang="scss" scoped>
@import './Lottery';
</style>
