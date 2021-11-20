<template>
  <div class="lottery-view">
    <div class="matter-container" ref="canvasContainer"></div>

    <div class="rotate-action-container">
      <NButton class="rotate-button" @mousedown="startRotateLeft">← Left</NButton>
      <NButton class="rotate-button" @mousedown="grabBall">Grab</NButton>
      <NButton class="rotate-button" @mousedown="startRotateRight">Right →</NButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted } from 'vue';

import { Body, Vector } from 'matter-js';
// noinspection ES6UnusedImports
import { NButton } from 'naive-ui';
import { Subject, interval, takeUntil, fromEvent, startWith } from 'rxjs';

import { autoPauseRender } from '@/auto-pause-render';
import { createSense, createMouseConstraint, Scenes } from '@modules/lottery/scenes';
import { useGrabOneBall } from '@modules/lottery/use-grab-one-ball';
import { useRenderer } from '@modules/lottery/use-renderer';

const canvasContainer = ref<HTMLDivElement>();

const scenesRef = ref<Scenes>();
const handPositionRef = ref<Vector>();

const grabOneBall = useGrabOneBall();
const destroy$ = new Subject<void>();

const { engineRef, isRunning, rendererReady$$ } = useRenderer(canvasContainer);

rendererReady$$.subscribe(({ renderer, engine, width, height }) => {
  const running$ = autoPauseRender(renderer, destroy$);
  running$.subscribe((running) => {
    isRunning.value = running;
  });

  scenesRef.value = createSense(engine.world, width, height);
  handPositionRef.value = scenesRef.value.hand.position;

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
  if (!scenesRef.value) {
    return;
  }
  Body.setAngularVelocity(scenesRef.value.octagon, velocity);
}

function grabBall(): void {
  const engine = engineRef.value;
  const scenes = scenesRef.value;
  const handPosition = handPositionRef.value;
  if (!engine || !scenes || !handPosition) {
    return;
  }
  grabOneBall(engine, scenes.hand, scenes.fullSizeSensor, handPosition);
}
</script>

<style lang="scss" scoped>
@import './Lottery';
</style>
