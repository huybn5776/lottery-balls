<template>
  <div class="lottery-container">
    <div class="placeholder"></div>

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
        <NButton class="rotate-button" :disabled="pickingBall" @mousedown="pickBall">Pick</NButton>
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
import { Subject, interval, takeUntil, startWith, fromEvent, BehaviorSubject } from 'rxjs';

import { autoPauseRender } from '@/auto-pause-render';
import BallNumbers from '@components/BallNumbers.vue';
import { createSense, createMouseConstraint, Scenes } from '@modules/lottery/scenes';
import { useClawPick } from '@modules/lottery/use-claw-pick';
import { useRenderer } from '@modules/lottery/use-renderer';

const canvasContainer = ref<HTMLDivElement>();

const scenesRef = ref<Scenes>();
const initialRopePositionRef = ref<Vector>();
const rotateSpeed = ref(0);
const pickingBall = ref(false);
const pickedBalls = ref<number[]>([]);

const destroy$$ = new Subject<void>();
const running$$ = new BehaviorSubject<boolean>(false);
const stopRotate$$ = new Subject<void>();

const { rendererRef, engineRef, rendererReady$$ } = useRenderer(canvasContainer);

const clawPick = useClawPick(running$$.asObservable());

rendererReady$$.subscribe(({ renderer, engine, width, height }) => {
  running$$.next(true);
  autoPauseRender(renderer, destroy$$)
    .pipe(takeUntil(destroy$$))
    .subscribe((running) => running$$.next(running));

  scenesRef.value = createSense(engine.world, width, height);
  initialRopePositionRef.value = { ...scenesRef.value.ropeHandle.position };

  const mouse = createMouseConstraint(renderer.canvas, engine);
  renderer.addMouse(mouse);

  fromEvent<KeyboardEvent>(document.body, 'keydown')
    .pipe(takeUntil(destroy$$))
    .subscribe((event) => {
      let handled = true;
      switch (event.code) {
        case 'Space':
          pickBall();
          break;
        case 'ArrowLeft':
          setRotateInterval((rotateSpeed.value -= 5));
          break;
        case 'ArrowRight':
          setRotateInterval((rotateSpeed.value += 5));
          break;
        default:
          handled = false;
          break;
      }
      if (handled) {
        event.preventDefault();
      }
    });
});

onUnmounted(() => {
  destroy$$.next();
  destroy$$.complete();
  running$$.next(false);
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

function pickBall(): void {
  if (pickingBall.value) {
    return;
  }

  const engine = engineRef.value;
  const scenes = scenesRef.value;
  const ropeHandlePosition = initialRopePositionRef.value;
  const renderer = rendererRef.value;
  if (!engine || !scenes || !ropeHandlePosition || !renderer) {
    return;
  }
  pickingBall.value = true;

  const ball$ = clawPick(engine, scenes, ropeHandlePosition);
  const { clientWidth: width } = renderer.canvas;
  ball$.subscribe((ball) => {
    pickingBall.value = false;
    if (ball) {
      Body.setPosition(ball, { x: width - 15, y: -30 });
      Body.setVelocity(ball, { x: 0, y: 0 });

      const ballNumber = +ball.label.replace('Ball', '');
      pickedBalls.value = [ballNumber, ...pickedBalls.value].slice(0, 16);
    }
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
