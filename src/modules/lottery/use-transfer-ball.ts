import { Engine, Body, IEventCollision, Events, Composite, Composites, IBodyRenderOptions, Bodies } from 'matter-js';
import { Observable } from 'rxjs';

import {
  addCategory,
  addMaskCategory,
  slotArrayCategory,
  removeMaskCategory,
  transferredBallCategory,
  ballsCategory,
  transferSensorCategory,
  combineCategory,
} from '@modules/lottery/collision-categories';
import { Scenes } from '@modules/lottery/scenes';

export function useTransferBall() {
  return (engine: Engine, scenes: Scenes, names: string[]) => {
    const { balls, slotArray, slotSensor } = setupScenes(engine, scenes, names);
    const ballsCount = balls.length;
    limitBallsVelocity(balls);

    let slotIndex = 0;
    const subscription = onBallReachSensor(engine, slotSensor).subscribe((ball) => {
      const nextSlotIndex = slotIndex;
      slotIndex += 1;
      const slot = slotArray.bodies[nextSlotIndex].parts[0];

      const stopBall = (): void => {
        Body.setPosition(ball, { x: slot.position.x - 5 / 2, y: slot.position.y - 25 });
        Body.setVelocity(ball, { x: 0, y: 0 });
        Body.setAngle(ball, 0);
        Body.setAngularVelocity(ball, 0);
      };
      stopBall();
      requestAnimationFrame(() => stopBall());
      removeMaskCategory(ball, [ballsCategory]);

      // eslint-disable-next-line no-param-reassign
      ball.friction = 0.1;
      addCategory(ball, [transferredBallCategory]);
      addMaskCategory(ball, [slotArrayCategory]);
      if (slotIndex === ballsCount) {
        subscription.unsubscribe();
      }
    });
  };
}

function setupScenes(
  engine: Engine,
  scenes: Scenes,
  names: string[],
): { balls: Body[]; slotArray: Composite; slotSensor: Body } {
  const { worldWidth, worldHeight } = scenes;
  const balls = engine.world.bodies.filter((body) => body.label.startsWith('Ball'));
  balls.forEach((ball) => {
    // eslint-disable-next-line no-param-reassign
    ball.friction = 0.001;
    addMaskCategory(ball, [transferSensorCategory]);
  });

  Composite.remove(engine.world, scenes.octagon);
  scenes.clawGroup.forEach((body) => Composite.remove(engine.world, body));

  const slotArray = createSlotArray(worldWidth, worldHeight, balls.length);
  const slotSensor = createSlotSensor(worldWidth, worldHeight);
  const slotLabels = createSlotLabels(slotArray, names);
  Composite.add(engine.world, [slotArray, slotSensor, ...slotLabels]);

  return { balls, slotArray, slotSensor };
}

function createSlotArray(worldWidth: number, worldHeight: number, slotCount: number): Composite {
  const columns = 10;
  const rows = Math.ceil(slotCount / columns);
  const slotWidth = 40;
  const slotHeight = 10;
  const slotXGap = 30;
  const slotYGap = 70;
  const slotThickness = 5;

  return Composites.stack(
    worldWidth / 2 - (slotWidth * columns + slotXGap * (columns - 1)) / 2,
    worldHeight / 3 - (slotHeight * rows + slotYGap * (rows - 1)) / 2,
    columns,
    rows,
    slotXGap,
    slotYGap,
    (x: number, y: number) => {
      const render: IBodyRenderOptions = { fillStyle: 'darkslategray' };
      const bottom = Bodies.rectangle(x, y + slotHeight / 2 + slotThickness / 2, slotWidth, slotThickness, { render });
      const left = Bodies.rectangle(x - slotWidth / 2 + slotThickness / 2, y, slotThickness, slotHeight, { render });
      const right = Bodies.rectangle(x + slotWidth / 2 - slotThickness / 2, y, slotThickness, slotHeight, { render });

      return Body.create({
        parts: [bottom, left, right],
        collisionFilter: combineCategory([slotArrayCategory], [slotArrayCategory, transferredBallCategory]),
        isStatic: true,
      });
    },
  );
}

function createSlotLabels(slotArray: Composite, names: string[]): Body[] {
  const slotsCount = slotArray.bodies.length;
  const labels: Body[] = [];
  for (let i = 0; i < slotsCount; i += 10) {
    const slot = slotArray.bodies[i];
    labels.push(
      Bodies.rectangle(slot.position.x - 35, slot.position.y - 15, 0, 0, {
        render: { text: `${i / 10 || '-'}`, fontSize: 22 },
        isStatic: true,
      }),
    );
  }

  for (let i = 0; i < names.length && i < slotsCount; i += 1) {
    const slot = slotArray.bodies[i];
    labels.push(
      Bodies.rectangle(slot.position.x, slot.position.y + 20, 0, 0, {
        render: { text: names[i], fontSize: 20 },
        isStatic: true,
      }),
    );
  }
  return labels;
}

function createSlotSensor(worldWidth: number, worldHeight: number): Body {
  const sensorWidth = 30;
  const sensorHeight = 30;

  return Bodies.rectangle(sensorWidth / 2, worldHeight - sensorHeight / 2, sensorWidth, sensorHeight, {
    collisionFilter: combineCategory([transferSensorCategory], [ballsCategory]),
    isStatic: true,
    isSensor: true,
    render: { fillStyle: 'chartreuse' },
  });
}

function limitBallsVelocity(balls: Body[]): void {
  const maxVelocity = 20;
  balls.forEach((ball) => {
    const { x, y } = ball.velocity;
    const velocity = Math.sqrt(x ** 2 + y ** 2);
    if (velocity > maxVelocity) {
      Body.setVelocity(ball, {
        x: (x * maxVelocity) / velocity,
        y: (y * maxVelocity) / velocity,
      });
    }
  });
}

function onBallReachSensor(engine: Engine, slotSensor: Body): Observable<Body> {
  return new Observable<Body>((subscriber) => {
    const onCollision = (event: IEventCollision<Engine>): void => {
      const idMatch = (body: Body): boolean => body.id === slotSensor.id;
      const labelMatch = (body: Body): boolean => body.label.startsWith('Ball');

      const matchedPairs = event.pairs.filter(
        ({ bodyA, bodyB }) => (idMatch(bodyA) || idMatch(bodyB)) && (labelMatch(bodyA) || labelMatch(bodyB)),
      );
      if (!matchedPairs.length) {
        return;
      }

      matchedPairs.forEach((pair) => {
        const ball = idMatch(pair.bodyA) ? pair.bodyB : pair.bodyA;
        subscriber.next(ball);
      });
    };
    const unregisterEvent = (): void => Events.off(engine, 'collisionStart', onCollision);
    Events.on(engine, 'collisionStart', onCollision);

    return unregisterEvent;
  });
}
