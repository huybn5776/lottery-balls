<template>
  <div class="lottery-view">
    <div class="matter-container" ref="canvasContainer"></div>

    <div class="rotate-action-container">
      <NButton class="rotate-button" @mousedown="startRotateLeft">← Left</NButton>
      <NButton class="rotate-button" @mousedown="startRotateRight">Right →</NButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted } from 'vue';

import { Body } from 'matter-js';
// noinspection ES6UnusedImports
import { NButton } from 'naive-ui';
import { Subject, interval, takeUntil, fromEvent, startWith } from 'rxjs';

import { autoPauseRender } from '@/auto-pause-render';
import { createSense, createMouseConstraint } from '@modules/lottery/scenes';
import { useRenderer } from '@modules/lottery/use-renderer';

const canvasContainer = ref<HTMLDivElement>();

const octagonRef = ref<Body>();

const destroy$ = new Subject<void>();

const { rendererReady$$, isRunning } = useRenderer(canvasContainer);

rendererReady$$.subscribe(({ renderer, engine, width, height }) => {
  const running$ = autoPauseRender(renderer, destroy$);
  running$.subscribe((running) => {
    isRunning.value = running;
  });

  const { octagon } = createSense(engine.world, width, height);
  octagonRef.value = octagon;

  const mouse = createMouseConstraint(renderer.canvas, engine);
  renderer.addMouse(mouse);
});

onUnmounted(() => {
  destroy$.next();
  destroy$.complete();
});

function startRotate(event: MouseEvent, velocity: number): void {
  interval(500)
      .pipe(takeUntil(destroy$), takeUntil(fromEvent(event.target as HTMLElement, 'mouseup')), startWith(null))
      .subscribe(() => rotateOctagonBound(velocity));
}

function startRotateLeft(event: MouseEvent): void {
  startRotate(event, -0.03);
}

function startRotateRight(event: MouseEvent): void {
  startRotate(event, 0.03);
}

function rotateOctagonBound(velocity: number): void {
  if (!octagonRef.value) {
    return;
  }
  Body.setAngularVelocity(octagonRef.value, velocity);
}
</script>

<style lang="scss" scoped>
@import './Lottery';
</style>
