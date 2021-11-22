<template>
  <div class="lottery-container">
    <div class="lottery-view">
      <div class="matter-container" ref="canvasContainer"></div>
      <div class="rotate-action-container">
        <NButton class="rotate-button" @mousedown="reset">Reset</NButton>
        <NSlider
          class="rotate-speed-slider"
          :min="-50"
          :max="50"
          :marks="{ 0: 'Free rotate' }"
          v-model:value="rotateSpeed"
          @mousedown="setRotateToZero"
          @click="setRotateToZero"
        />
        <NButton class="rotate-button" @mousedown="grabBall">Grab</NButton>
      </div>
    </div>
    <BallNumbers :ball-numbers="pickedBalls" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted, watch } from 'vue';

import { Body, Vector, Composite } from 'matter-js';
// noinspection ES6UnusedImports
import { NButton, NSlider } from 'naive-ui';
import { Subject, interval, takeUntil, startWith } from 'rxjs';

import { autoPauseRender } from '@/auto-pause-render';
import { createSense, createMouseConstraint, Scenes } from '@modules/lottery/scenes';
import { useGrabOneBall } from '@modules/lottery/use-grab-one-ball';
import { useRenderer } from '@modules/lottery/use-renderer';

const canvasContainer = ref<HTMLDivElement>();

const scenesRef = ref<Scenes>();
const handPositionRef = ref<Vector>();
const rotateSpeed = ref(0);

const grabOneBall = useGrabOneBall();
const destroy$$ = new Subject<void>();
const stopRotate$$ = new Subject<void>();

const { rendererRef, engineRef, isRunning, rendererReady$$ } = useRenderer(canvasContainer);

rendererReady$$.subscribe(({ renderer, engine, width, height }) => {
  const running$ = autoPauseRender(renderer, destroy$$);
  running$.subscribe((running) => {
    isRunning.value = running;
  });

  scenesRef.value = createSense(engine.world, width, height);
  handPositionRef.value = { ...scenesRef.value.hand.position };

  const mouse = createMouseConstraint(renderer.canvas, engine);
  renderer.addMouse(mouse);
});

onUnmounted(() => {
  destroy$$.next();
  destroy$$.complete();
});

watch(rotateSpeed, (speed) => setRotateInterval(speed / 200));

function setRotateInterval(velocity: number): void {
  stopRotate$$.next();
  if (velocity === 0) {
    return;
  }
  interval(500)
    .pipe(takeUntil(destroy$$), takeUntil(stopRotate$$), startWith(null))
    .subscribe(() => rotateOctagonBound(velocity));
}

function setRotateToZero(event: MouseEvent): void {
  if (!(event.target as HTMLElement).classList.contains('n-slider-mark')) {
    return;
  }
  rotateSpeed.value = 0;
  event.preventDefault();
  event.stopPropagation();
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
  const ball$ = grabOneBall(engine, scenes.hand, scenes.fullSizeSensor, { ...handPosition });
  ball$.subscribe((ball) => {
    Composite.remove(engine.world, ball);
  });
}

function reset(): void {
  if (!engineRef.value || !rendererRef.value) {
    return;
  }

  Composite.clear(engineRef.value.world, false);
  const { clientWidth, clientHeight } = rendererRef.value.canvas;
  scenesRef.value = createSense(engineRef.value.world, clientWidth, clientHeight);
}
</script>

<style lang="scss" scoped>
@import './Lottery';
</style>
