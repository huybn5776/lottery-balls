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
  Composites,
  Vector,
} from 'matter-js';

import { SettingsModel } from '@interfaces/settings-model';
import {
  defaultCategory,
  boxCategory,
  octagonCategory,
  ballsCategory,
  combineCategory,
  mouseCategory,
  ropeCategory,
  clawCategory,
  pickedBallCategory,
} from '@modules/lottery/collision-categories';
import { loadSettingsFromLocalstorage } from '@services/settings-service';

export interface Scenes {
  worldWidth: number;
  worldHeight: number;
  octagon: Body;
  ropeChains: Composite;
  ropeHandle: Body;
  clawBase: Body;
  leftClaw: Body;
  rightClaw: Body;
  bottomClawLimit: Body;
  clawGroup: (Composite | Constraint | Body)[];
}

export function createSense(world: World, worldWidth: number, worldHeight: number): Scenes {
  const settings = loadSettingsFromLocalstorage();
  const octagonCenterPoint = { x: worldWidth * 0.32, y: worldHeight * 0.42 };

  const boxBound = createBoxBound(worldWidth, worldHeight);
  const { octagon, octagonConstraint } = createOctagonBound(
    octagonCenterPoint.x,
    octagonCenterPoint.y,
    Math.min(worldWidth, worldHeight),
  );
  const balls = createBalls(octagonCenterPoint.x, octagonCenterPoint.y, settings);
  const ballSlot = createBallSlot(worldWidth, worldHeight, 32);
  const ropeLength = worldHeight;
  const { bodies, ropeHandle, ropeChains, clawBase, leftClaw, rightClaw, bottomClawLimit } = createClawWithRope(
    { x: octagonCenterPoint.x, y: -ropeLength },
    ropeLength,
  );

  Composite.add(world, [boxBound, octagon, octagonConstraint, ...balls, ballSlot, ...bodies]);
  return {
    worldWidth,
    worldHeight,
    octagon,
    ropeHandle,
    ropeChains,
    clawBase,
    leftClaw,
    rightClaw,
    bottomClawLimit,
    clawGroup: bodies,
  };
}

export function createMouseConstraint(canvas: HTMLCanvasElement, engine: Engine): Mouse {
  const mouse = Mouse.create(canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      angularStiffness: 0,
      render: { visible: false },
    } as Constraint & { angularStiffness: number },
    collisionFilter: combineCategory(
      [defaultCategory, mouseCategory],
      [octagonCategory, ballsCategory, ropeCategory, clawCategory],
    ),
  });
  Composite.add(engine.world, mouseConstraint);
  return mouse;
}

function createBoxBound(width: number, height: number): Body {
  const wallThickness = 100;
  const offset = wallThickness / 2;

  const roof = Bodies.rectangle(width / 2 - 20, -offset, width - 40, wallThickness, {});
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
  const thickness = 20;
  const sideLength = size * 0.3;
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

function createBallSlot(worldWidth: number, worldHeight: number, slotWidth: number): Body {
  const thickness = 20;
  const sideLength = 80;
  const xOffset = slotWidth + thickness / 2;

  const sideOptions: IChamferableBodyDefinition = { density: 1, friction: 0, render: { fillStyle: 'black' } };
  const side = (x: number, y: number, angle: number, length: number, options?: IChamferableBodyDefinition): Body =>
    Bodies.rectangle(x, y, length, thickness, {
      ...sideOptions,
      label: `Slot side ${angle}°`,
      angle: (Math.PI / 180) * angle,
      ...(options || {}),
    });
  const shortSide = (x: number, y: number, angle: number, length?: number): Body =>
    Bodies.rectangle(x, y, length || sideLength, thickness, {
      ...sideOptions,
      label: `Slot ${angle}°`,
      angle: (Math.PI / 180) * angle,
      chamfer: { radius: thickness / 2 },
    });

  return Body.create({
    parts: [
      side(worldWidth - xOffset, 160, 90, 440),
      side(worldWidth / 2 - 90, worldHeight - 45, -8, worldWidth - 180),
      side(worldWidth / 2 - 90, worldHeight - 25, -8, worldWidth - 180),
      shortSide(worldWidth + 2 - 50, worldHeight - 273 - 40, -75),
      shortSide(worldWidth - 20 - 50, worldHeight - 218 - 40, -60),
      shortSide(worldWidth - 55 - 50, worldHeight - 173 - 40, -45),
      shortSide(worldWidth - 103 - 50, worldHeight - 137 - 40, -30),
      shortSide(worldWidth + 2, worldHeight - 273, -75),
      shortSide(worldWidth - 20, worldHeight - 218, -60),
      shortSide(worldWidth - 55, worldHeight - 173, -45),
      shortSide(worldWidth - 103, worldHeight - 137, -30),
      shortSide(worldWidth - 160, worldHeight - 110, -20),
      shortSide(worldWidth - 128, worldHeight - 118, -34, sideLength * 2),
    ],
    isStatic: true,
    collisionFilter: combineCategory([defaultCategory, boxCategory]),
  });
}

function createBalls(x: number, y: number, settings: SettingsModel): Body[] {
  const ballSize = 30;
  const ballNumbersRange = settings.rangeTo || 75;
  let ballNumbers = [...Array(ballNumbersRange).keys()].map((n) => n + 1);
  const { numbersToOmit } = settings;
  if (numbersToOmit?.length) {
    ballNumbers = ballNumbers.filter((n) => !numbersToOmit.includes(n));
  }
  const rowsCount = Math.ceil(Math.sqrt(ballNumbers.length));

  const startPoint = {
    x: x - (rowsCount / 2) * ballSize + ballSize / 2,
    y: y - (rowsCount / 2) * ballSize + ballSize / 2,
  };

  const shuffledNumbers = ballNumbers.sort(() => 0.5 - Math.random());
  const randomVelocity = (): number => (Math.random() - 0.5) * 15;
  const balls: Body[] = shuffledNumbers.map((number, i) =>
    Bodies.circle(
      startPoint.x + (i % rowsCount) * ballSize,
      startPoint.y + Math.floor(i / rowsCount) * ballSize,
      ballSize / 2,
      {
        label: `Ball${number}`,
        restitution: 0.3,
        frictionAir: 0,
        render: { fillStyle: 'gold', text: `${number}`, textColor: 'black', fontSize: number <= 10 ? 22 : 18 },
        collisionFilter: combineCategory(
          [ballsCategory],
          [mouseCategory, ballsCategory, boxCategory, octagonCategory, clawCategory],
        ),
      },
    ),
  );
  balls.forEach((ball) => Body.setVelocity(ball, { x: randomVelocity(), y: randomVelocity() }));
  return balls;
}

function createClawWithRope(
  position: Vector,
  ropeLength: number,
): {
  bodies: (Composite | Constraint | Body)[];
  ropeChains: Composite;
  clawBase: Body;
  leftClaw: Body;
  rightClaw: Body;
  ropeHandle: Body;
  bottomClawLimit: Body;
} {
  const clawPosition = { x: position.x, y: position.y + ropeLength };
  const { ropeHandle, ropeChains } = createRope(position, ropeLength);
  const { bodies, clawBase, leftClaw, rightClaw, bottomClawLimit } = createClaw(clawPosition);

  const ropeConstraint = Constraint.create({
    bodyA: ropeChains.bodies[ropeChains.bodies.length - 1],
    bodyB: clawBase,
    pointA: { x: 0, y: 15 },
    pointB: { x: 0, y: -10 },
    length: 0,
  });

  return {
    bodies: [ropeChains, ropeConstraint, ...bodies],
    ropeHandle,
    ropeChains,
    clawBase,
    leftClaw,
    rightClaw,
    bottomClawLimit,
  };
}

function createClaw(position: Vector): {
  bodies: (Body | Constraint)[];
  clawBase: Body;
  leftClaw: Body;
  rightClaw: Body;
  bottomClawLimit: Body;
} {
  const baseSize = 20;
  const clawWidth = 50;
  const clawDeep = 40;
  const clawThickness = 10;
  const clawColor = 'gainsboro';

  const clawBase = Bodies.circle(position.x, position.y, baseSize, {
    label: 'Claw base',
    collisionFilter: combineCategory([clawCategory], [mouseCategory, ballsCategory, pickedBallCategory]),
    render: { fillStyle: 'snow' },
  });

  const clawArmXOffset = clawWidth / 2 + baseSize / 2;
  const clawArmYOffset = baseSize / 2;
  const clawPawXOffset = clawArmXOffset + clawWidth / 2 - clawThickness / 2;
  const clawPawYOffset = clawArmYOffset + clawDeep / 2 - clawThickness / 2;

  const createClawRect = (xOffset: number, yOffset: number, width: number, height: number): Body =>
    Bodies.rectangle(position.x + xOffset, position.y + yOffset, width, height, {
      chamfer: { radius: clawThickness / 2 },
      render: { fillStyle: clawColor },
    });
  const combineClaw = (parts: Body[]): Body =>
    Body.create({
      label: 'Claw arm',
      parts,
      collisionFilter: combineCategory(
        [clawCategory],
        [mouseCategory, clawCategory, ballsCategory, pickedBallCategory],
      ),
      friction: 1,
    });
  const createClawConstraint = (claw: Body, xDirection: number): Constraint =>
    Constraint.create({
      bodyA: clawBase,
      bodyB: claw,
      pointA: { x: (xDirection * baseSize) / 2, y: baseSize / 2 },
      pointB: { x: -xDirection * clawWidth * 0.55, y: -clawThickness * 0.75 },
      length: 0,
    });

  const leftClawArm = createClawRect(-clawArmXOffset, clawArmYOffset, clawWidth, clawThickness);
  const leftClawPaw = createClawRect(-clawPawXOffset, clawPawYOffset, clawThickness, clawDeep);
  const leftClaw = combineClaw([leftClawArm, leftClawPaw]);
  const leftClawConstraint = createClawConstraint(leftClaw, -1);

  const rightClawArm = createClawRect(clawArmXOffset, clawArmYOffset, clawWidth, clawThickness);
  const rightClawPaw = createClawRect(clawPawXOffset, clawPawYOffset, clawThickness, clawDeep);
  const rightClaw = combineClaw([rightClawArm, rightClawPaw]);
  const rightClawConstraint = createClawConstraint(rightClaw, 1);

  const createClawLimit = (
    yOffset: number,
    thickness: number,
    options: IChamferableBodyDefinition,
  ): { bodies: (Body | Constraint)[]; clawLimit: Body } => {
    const clawLimit = Bodies.rectangle(position.x, position.y + baseSize / 2 + yOffset, clawWidth, thickness, options);
    const clawLimitLeftConstraint = Constraint.create({
      bodyA: clawBase,
      bodyB: clawLimit,
      pointA: { x: -clawWidth / 2, y: clawLimit.position.y - clawBase.position.y },
      pointB: { x: -clawWidth / 2, y: 0 },
      length: 0,
    });
    const clawRightConstraint = Constraint.create({
      bodyA: clawBase,
      bodyB: clawLimit,
      pointA: { x: clawWidth / 2, y: clawLimit.position.y - clawBase.position.y },
      pointB: { x: clawWidth / 2, y: 0 },
      length: 0,
    });
    return { clawLimit, bodies: [clawLimit, clawLimitLeftConstraint, clawRightConstraint] };
  };

  const { bodies: topClawLimitBodies } = createClawLimit(-clawThickness, clawThickness, {
    chamfer: { radius: clawThickness / 2 },
    label: 'Claw top limit',
    collisionFilter: combineCategory([clawCategory], [clawCategory]),
    render: { fillStyle: 'darkgray' },
  });
  const { clawLimit: bottomClawLimit, bodies: bottomClawLimitBodies } = createClawLimit(
    clawThickness * 2,
    clawThickness * 2,
    {
      label: 'Claw bottom limit',
      collisionFilter: combineCategory([clawCategory], [clawCategory]),
      render: { visible: false },
    },
  );

  return {
    bodies: [
      leftClaw,
      leftClawConstraint,
      rightClaw,
      rightClawConstraint,
      clawBase,
      ...topClawLimitBodies,
      ...bottomClawLimitBodies,
    ],
    clawBase,
    leftClaw,
    rightClaw,
    bottomClawLimit,
  };
}

function createRope(position: Vector, length: number): { ropeChains: Composite; ropeHandle: Body } {
  const width = 10;
  const maxChainLength = width * 2.5;
  const chainCount = Math.floor(length / maxChainLength);
  const chainLength = (length / chainCount) * 1.35;

  const ropeChains = Composites.stack(
    position.x - width / 2,
    position.y,
    1,
    chainCount,
    0,
    -chainLength * 0.3,
    (x: number, y: number) =>
      Bodies.rectangle(x, y, width, chainLength, {
        collisionFilter: combineCategory([ropeCategory], [mouseCategory, ballsCategory]),
        chamfer: { radius: width / 2 },
        render: { fillStyle: 'dimgray' },
      }),
  );
  const ropeHandle = Bodies.circle(position.x, position.y, 10, { isStatic: true });

  const yOffset = 0.35;
  Composites.chain(ropeChains, 0, yOffset, 0, -yOffset, { stiffness: 1, length: 0 });
  const ropeTopConstraint = Constraint.create({
    bodyA: ropeHandle,
    bodyB: ropeChains.bodies[0],
    pointB: { x: 0, y: -chainLength / 2 },
  });
  Composite.add(ropeChains, ropeTopConstraint);
  return { ropeChains, ropeHandle };
}
