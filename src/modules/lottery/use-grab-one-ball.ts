import { ref } from 'vue';

import { Engine, Body, IEventCollision, Events, Composite, Vector } from 'matter-js';
import { Observable, tap, switchMap, Subscription } from 'rxjs';

export function useGrabOneBall(): (engine: Engine, hand: Body, fullSizeSensor: Body, handPosition: Vector) => void {
  const lastGrabSubscription = ref<Subscription>();

  return (engine: Engine, hand: Body, fullSizeSensor: Body, handPosition: Vector) => {
    lastGrabSubscription.value?.unsubscribe();

    const grab = (): void => {
      Body.setPosition(hand, handPosition);
      Body.setStatic(hand, false);
      Body.setAngle(hand, (Math.PI / 180) * 110);
      Body.setVelocity(hand, { x: -20, y: 70 });
    };
    const removeBallOnTouch = (collidedBall: Body): void => {
      Composite.remove(engine.world, collidedBall);
      Body.setVelocity(hand, { x: 0, y: -50 });
    };
    const resetHand = (): void => {
      Body.setPosition(hand, { ...handPosition });
      Body.setStatic(hand, true);
    };

    grab();

    lastGrabSubscription.value = onCollisionStart$(engine, hand)
      .pipe(
        tap(removeBallOnTouch),
        switchMap(() => handOnMoveOutOfScreen$(engine, hand, fullSizeSensor)),
      )
      .subscribe(resetHand);
  };
}

function onCollisionStart$(engine: Engine, hand: Body): Observable<Body> {
  return new Observable<Body>((subscriber) => {
    const onCollision = (event: IEventCollision<Engine>): void => {
      const idMatch = (body: Body): boolean => body.id === hand.id;
      const labelMatch = (body: Body): boolean => body.label.startsWith('Ball');

      const matchedPair = event.pairs.find(
        ({ bodyA, bodyB }) => (idMatch(bodyA) || idMatch(bodyB)) && (labelMatch(bodyA) || labelMatch(bodyB)),
      );
      if (!matchedPair) {
        return;
      }
      unregisterEvent();

      const collidedBall = idMatch(matchedPair.bodyA) ? matchedPair.bodyB : matchedPair.bodyA;
      subscriber.next(collidedBall);
      subscriber.complete();
    };
    const unregisterEvent = (): void => Events.off(engine, 'collisionStart', onCollision);
    Events.on(engine, 'collisionStart', onCollision);

    return unregisterEvent;
  });
}

function handOnMoveOutOfScreen$(engine: Engine, hand: Body, fullSizeSensor: Body): Observable<void> {
  return new Observable((subscriber) => {
    const targetsId = [hand.id, fullSizeSensor.id];

    const onCollisionEnd = (event: IEventCollision<Engine>): void => {
      const isHandLeaveScreen = event.pairs.some(
        (pair) => targetsId.includes(pair.bodyA.id) && targetsId.includes(pair.bodyB.id),
      );
      if (isHandLeaveScreen) {
        unregisterEvent();
        subscriber.next();
        subscriber.complete();
      }
    };
    const unregisterEvent = (): void => Events.off(engine, 'collisionEnd', onCollisionEnd);
    Events.on(engine, 'collisionEnd', onCollisionEnd);
    return unregisterEvent;
  });
}