import { ref } from 'vue';

import { Engine, Body, IEventCollision, Events, Vector, Constraint, Composite } from 'matter-js';
import {
  Observable,
  Subscription,
  Subject,
  tap,
  switchMap,
  map,
  filter,
  timer,
  takeUntil,
  take,
  merge,
  shareReplay,
} from 'rxjs';

import {
  removeMaskCategory,
  clawCategory,
  ballsCategory,
  addMaskCategory,
  pickedBallCategory,
  boxCategory,
  octagonCategory,
  addCategory,
  removeCategory,
} from '@modules/lottery/collision-categories';
import { Scenes } from '@modules/lottery/scenes';

export function useClawPick(
  running$: Observable<boolean>,
): (engine: Engine, scenes: Scenes, initialRopeHandlePosition: Vector) => Observable<Body | undefined> {
  const ballSize = 15;
  const baseSize = 20;
  const moveIntervalTime = 10;
  const moveDistance = 10;

  const interval$ = createInterval(running$, moveIntervalTime);
  const lastPickSubscription = ref<Subscription>();
  const ballConstraintRef = ref<Constraint>();

  return (engine: Engine, scenes: Scenes, initialRopeHandlePosition: Vector) => {
    lastPickSubscription.value?.unsubscribe();
    const { ropeHandle, ropeChains, clawBase, leftClaw, rightClaw, bottomClawLimit } = scenes;
    const position = { ...initialRopeHandlePosition };
    const clawGroup = [clawBase, leftClaw, rightClaw];
    const ball$$ = new Subject<Body | undefined>();

    lastPickSubscription.value = moveDownClaw()
      .pipe(
        switchMap((ball) => {
          if (ball) {
            markCollisionBallAsPicked(ball);
            setBallIntoClaw(ball);
            gripClaw();
            setClawToOnlyCollisionToPickedBall();
            return moveBallOutOfTop(ball).pipe(map(() => ball));
          }
          return moveClawToTop().pipe(map(() => undefined));
        }),
        take(1),
      )
      .subscribe((ball) => {
        releaseClaw();
        resetRope();
        resetClaw();

        if (ballConstraintRef.value) {
          Composite.remove(engine.world, ballConstraintRef.value);
          ballConstraintRef.value = undefined;
        }

        if (ball) {
          addMaskCategory(ball, [ballsCategory, boxCategory, octagonCategory]);
          removeCategory(ball, [pickedBallCategory]);
        }
        requestAnimationFrame(() => {
          ball$$.next(ball);
          ball$$.complete();
        });
      });

    resetClaw();
    return ball$$.asObservable();

    function resetClaw(): void {
      Body.setPosition(ropeHandle, { ...position });
      clawGroup.forEach((body) => {
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngle(body, 0);
        Body.setAngularVelocity(body, 0);
        addMaskCategory(body, [ballsCategory]);
      });
    }

    function moveDownClaw(): Observable<Body | undefined> {
      const onReachEnd$$ = new Subject<undefined>();
      const onClawCollisionBall$ = onClawCollisionBall(engine, scenes).pipe(takeUntil(onReachEnd$$));
      const done$: Observable<Body | undefined> = merge(onClawCollisionBall$, onReachEnd$$).pipe(shareReplay(1));
      const maxYPosition = scenes.octagon.bounds.max.y;

      interval$.pipe(takeUntil(done$)).subscribe(() => {
        if (ropeHandle.position.y > 0 || leftClaw.position.y > maxYPosition || rightClaw.position.y > maxYPosition) {
          clawGroup.forEach((body) => Body.setVelocity(body, { x: body.velocity.x, y: 0 }));
          onReachEnd$$.next(undefined);
          onReachEnd$$.complete();
          return;
        }

        Body.setPosition(ropeHandle, { x: position.x, y: ropeHandle.position.y + moveDistance });

        ropeChains.bodies.forEach((ropeChain) => Body.setVelocity(ropeChain, { x: 0, y: moveDistance * 1.5 }));
        Body.setVelocity(clawBase, { x: 0, y: moveDistance * 1.5 });
        Body.setVelocity(leftClaw, { x: 0, y: moveDistance });
        Body.setVelocity(rightClaw, { x: 0, y: moveDistance });
      });
      return done$;
    }

    function gripClaw(): void {
      removeMaskCategory(bottomClawLimit, [clawCategory]);
      Body.setAngularVelocity(leftClaw, -0.3);
      Body.setAngularVelocity(rightClaw, 0.3);
    }

    function releaseClaw(): void {
      addMaskCategory(bottomClawLimit, [clawCategory]);
      Body.setAngularVelocity(leftClaw, 0.1);
      Body.setAngularVelocity(rightClaw, -0.1);
    }

    function markCollisionBallAsPicked(ball: Body): void {
      removeMaskCategory(ball, [ballsCategory, boxCategory, octagonCategory]);
      addCategory(ball, [pickedBallCategory]);
    }

    function setClawToOnlyCollisionToPickedBall(): void {
      clawGroup.forEach((body) => removeMaskCategory(body, [ballsCategory]));
    }

    function setBallIntoClaw(ball: Body): void {
      const angle = (clawBase.angle / Math.PI) * 180;
      const distance = baseSize + ballSize;
      const posX = Math.sin((Math.PI / 180) * angle) * distance;
      const posY = Math.sin((Math.PI / 180) * (90 - angle)) * distance;
      Body.setPosition(ball, { x: clawBase.position.x - posX, y: clawBase.position.y + posY });
      ballConstraintRef.value = Constraint.create({
        bodyA: clawBase,
        bodyB: ball,
        pointA: { x: -posX, y: posY },
        length: 0,
      });
      Composite.add(engine.world, [ballConstraintRef.value]);
      Body.setVelocity(ball, { x: 0, y: 0 });
    }

    function moveBallOutOfTop(ball: Body): Observable<void> {
      return moveClawUpUntil(() => ball.position.y < -ballSize * 2);
    }

    function moveClawToTop(): Observable<void> {
      return moveClawUpUntil(() => clawBase.position.y < 0);
    }

    function moveClawUpUntil(predicate: () => boolean): Observable<void> {
      return interval$.pipe(
        tap(() => {
          Body.setPosition(ropeHandle, { x: position.x, y: ropeHandle.position.y - moveDistance });
          ropeChains.bodies.forEach((ropeChain) => Body.setVelocity(ropeChain, { x: 0, y: -moveDistance }));

          Body.setAngularVelocity(leftClaw, -0.1);
          Body.setAngularVelocity(rightClaw, 0.1);
        }),
        filter(predicate),
        take(1),
      );
    }

    function resetRope(): void {
      Body.setPosition(ropeHandle, { x: position.x, y: position.y });
      ropeChains.bodies.forEach((ropeChain) => {
        Body.setVelocity(ropeChain, { x: 0, y: moveDistance });
        Body.setAngle(ropeChain, 0);
      });
    }
  };
}

function onClawCollisionBall(engine: Engine, scenes: Scenes): Observable<Body> {
  const { leftClaw, rightClaw } = scenes;
  const clawIdList = [...leftClaw.parts, ...rightClaw.parts].map((body) => body.id);

  return new Observable<Body>((subscriber) => {
    const onCollision = (event: IEventCollision<Engine>): void => {
      const idMatch = (body: Body): boolean => clawIdList.includes(body.id);
      const labelMatch = (body: Body): boolean => body.label.startsWith('Ball');

      const matchedPair = event.pairs.find(
        ({ bodyA, bodyB }) => (idMatch(bodyA) || idMatch(bodyB)) && (labelMatch(bodyA) || labelMatch(bodyB)),
      );
      if (!matchedPair) {
        return;
      }
      unregisterEvent();

      const ball = idMatch(matchedPair.bodyA) ? matchedPair.bodyB : matchedPair.bodyA;
      subscriber.next(ball);
      subscriber.complete();
    };
    const unregisterEvent = (): void => Events.off(engine, 'collisionStart', onCollision);
    Events.on(engine, 'collisionStart', onCollision);

    return unregisterEvent;
  });
}

function createInterval(running$: Observable<boolean>, intervalTime: number): Observable<void> {
  return running$.pipe(
    switchMap((running) => {
      return running
        ? timer(0, intervalTime)
        : running$.pipe(
            filter((r) => r),
            switchMap(() => timer(0, intervalTime)),
          );
    }),
    map(() => undefined),
  );
}
