import {
  Bodies,
  Body,
  IChamferableBodyDefinition,
  Constraint,
  World,
  Composite,
  Engine,
  Mouse,
  MouseConstraint,
} from 'matter-js';

import {
  defaultCategory,
  boxCategory,
  octagonCategory,
  ballsCategory,
  handCategory,
  sensorCategory,
  combineCategory,
  mouseCategory,
} from '@modules/lottery/collision-categories';

export interface Scenes {
  octagon: Body;
  hand: Body;
  fullSizeSensor: Body;
}

export function createSense(world: World, worldWidth: number, worldHeight: number): Scenes {
  const centerPoint = { x: worldWidth / 2, y: worldHeight / 2 };

  const boxBound = createBoxBound(worldWidth, worldHeight);
  const { octagon, octagonConstraint } = createOctagonBound(
    centerPoint.x,
    centerPoint.y,
    Math.min(worldWidth, worldHeight),
  );
  const balls = createBalls(centerPoint.x, centerPoint.y);
  const { hand, handConstraint } = createHand(worldWidth * 0.8, -worldHeight / 2, worldHeight * 0.9, 50);
  const fullSizeSensor = createFullSizeSensor(worldWidth, worldHeight);

  Composite.add(world, [boxBound, octagon, octagonConstraint, ...balls, hand, handConstraint, fullSizeSensor]);
  return { octagon, hand, fullSizeSensor };
}

export function createMouseConstraint(canvas: HTMLCanvasElement, engine: Engine): Mouse {
  const mouse = Mouse.create(canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      angularStiffness: 0,
      render: { visible: false },
    } as Constraint & { angularStiffness: number },
    collisionFilter: combineCategory([defaultCategory, mouseCategory], [octagonCategory, ballsCategory]),
  });
  Composite.add(engine.world, mouseConstraint);
  return mouse;
}

function createBoxBound(width: number, height: number): Body {
  const wallThickness = 100;
  const offset = wallThickness / 2;

  const roof = Bodies.rectangle(width / 2, 0 - offset, width * 1.1, wallThickness, {});
  const ground = Bodies.rectangle(width / 2, height + offset, width * 1.1, wallThickness, {});
  const leftWall = Bodies.rectangle(-offset, height / 2, wallThickness, height * 1.1, {});
  const rightWall = Bodies.rectangle(width + offset, height / 2, wallThickness, height * 1.1, {});

  return Body.create({
    label: 'Box bound',
    parts: [roof, ground, leftWall, rightWall],
    render: { fillStyle: 'black' },
    isStatic: true,
    collisionFilter: combineCategory([defaultCategory, boxCategory]),
  });
}

function createOctagonBound(x: number, y: number, size: number): { octagon: Body; octagonConstraint: Constraint } {
  const thickness = 30;
  const sideLength = size * 0.31;
  const bodyLength = sideLength + thickness / 2;
  const outerLength = sideLength / Math.sqrt(2);

  const createSide = (
    offsetX: number,
    offsetY: number,
    angle: number,
    width?: number,
    options?: IChamferableBodyDefinition,
  ): Body =>
    Bodies.rectangle(x + offsetX, y + offsetY, width || bodyLength, thickness, {
      label: `Octagon side ${angle}°`,
      angle: (Math.PI / 180) * angle,
      density: 1,
      frictionAir: 0,
      render: { fillStyle: '#BA8C63' },
      ...(options || {}),
    });

  const sides = [
    createSide(0, -(sideLength / 2 + outerLength), 0),
    createSide(sideLength / 2 + outerLength / 2, -(sideLength / 2 + outerLength / 2), 45),
    createSide(sideLength / 2 + outerLength, 0, 90),
    createSide(sideLength / 2 + outerLength / 2, sideLength / 2 + outerLength / 2, 135),
    createSide(0, sideLength / 2 + outerLength, 180),
    createSide(-(sideLength / 2 + outerLength / 2), sideLength / 2 + outerLength / 2, 225),
    createSide(-(sideLength / 2 + outerLength), 0, 270),
    createSide(-(sideLength / 2 + outerLength / 2), -(sideLength / 2 + outerLength / 2), 315),
  ];

  const octagon = Body.create({
    parts: [...sides],
    collisionFilter: combineCategory([defaultCategory, octagonCategory]),
  });
  const octagonConstraint = Constraint.create({
    pointA: { x, y },
    pointB: { x: 0, y: 0 },
    bodyB: octagon,
    length: 0,
  });
  return { octagon, octagonConstraint };
}

function createBalls(x: number, y: number): Body[] {
  const ballSize = 30;
  const ballsCount = 75;
  const rowsCount = Math.ceil(Math.sqrt(ballsCount));

  const startPoint = {
    x: x - (rowsCount / 2) * ballSize + ballSize / 2,
    y: y - (rowsCount / 2) * ballSize + ballSize / 2,
  };

  const randomVelocity = (): number => (Math.random() - 0.5) * 10;
  const balls: Body[] = [];
  for (let i = 0; i < ballsCount; i += 1) {
    balls.push(
      Bodies.circle(
        startPoint.x + (i % rowsCount) * ballSize,
        startPoint.y + Math.floor(i / rowsCount) * ballSize,
        ballSize / 2,
        {
          label: `Ball${i + 1}`,
          restitution: 0.3,
          frictionAir: 0,
          render: { fillStyle: 'gray', text: `${i + 1}`, fontSize: i <= 10 ? 22 : 18 },
          collisionFilter: combineCategory([defaultCategory, ballsCategory]),
        },
      ),
    );
    Body.setVelocity(balls[i], { x: randomVelocity(), y: randomVelocity() });
  }
  return balls;
}

function createHand(
  x: number,
  y: number,
  length: number,
  thickness: number,
): { hand: Body; handConstraint: Constraint } {
  const hand = Bodies.rectangle(x, y, length, thickness, {
    label: 'Hand',
    angle: (Math.PI / 180) * 110,
    render: { fillStyle: 'lightblue' },
    chamfer: { radius: 25 },
    isStatic: true,
    collisionFilter: combineCategory([defaultCategory, handCategory], [ballsCategory, sensorCategory]),
  });
  const handConstraint = Constraint.create({
    pointA: { x, y },
    pointB: { x: 0, y: 0 },
    bodyB: hand,
    length: 0,
    stiffness: 0.001,
  });

  return { hand, handConstraint };
}

function createFullSizeSensor(worldWidth: number, worldHeight: number): Body {
  return Bodies.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, {
    label: 'Full size sensor',
    isSensor: true,
    isStatic: true,
    render: { visible: false },
    collisionFilter: combineCategory([defaultCategory, sensorCategory]),
  });
}
