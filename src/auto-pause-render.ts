import { Observable, fromEvent, takeUntil, switchMap, timer, tap, take, Subject, merge } from 'rxjs';

import { ViewRenderer } from '@/modules/view-render/view-render';

const mouseLeavePauseTime = 3000;
const idlePauseTime = 5000;

export function autoPauseRender(
  renderer: ViewRenderer,
  destroy$: Observable<void>,
  enableLog = false,
): Observable<boolean> {
  const until = takeUntil(destroy$);
  // eslint-disable-next-line no-console
  const log: (message: string) => void = enableLog ? (message) => console.log(message) : () => {};
  const targetElement = document.body;
  const running$$ = new Subject<boolean>();

  const pauseByMouseLeave$ = fromEvent(targetElement, 'mouseleave').pipe(
    until,
    tap(() => log(`mouseleave, wait ${mouseLeavePauseTime}ms to pause`)),
    switchMap(() =>
      timer(mouseLeavePauseTime).pipe(
        until,
        takeUntil(fromEvent(targetElement, 'mousemove').pipe(tap(() => log('cancel mouseleave pause')))),
      ),
    ),
  );
  const resumeByMouseMove$ = fromEvent(targetElement, 'mousemove').pipe(until);
  const resumeByKeydown$ = fromEvent(targetElement, 'keydown').pipe(until);
  const pauseByIdle$ = timer(idlePauseTime).pipe(
    until,
    takeUntil(
      merge(resumeByMouseMove$, resumeByKeydown$).pipe(
        take(1),
        tap(() => {
          log('idle canceled');
          subscribeForMouseleavePause();
        }),
      ),
    ),
  );

  function subscribeForMouseleavePause(): void {
    log('subscribeForMouseleavePause');
    pauseByMouseLeave$.pipe(take(1)).subscribe(() => {
      log('pause by mouseleave');
      renderer.pause();
      running$$.next(false);
      subscribeForResume();
    });
  }

  function subscribeForResume(): void {
    log('subscribeForResume');
    merge(
      resumeByMouseMove$.pipe(tap(() => log('resume by mousemove'))),
      resumeByKeydown$.pipe(tap(() => log('resume by keydown'))),
    )
      .pipe(take(1))
      .subscribe(() => {
        renderer.resume();
        running$$.next(true);
        subscribeForMouseleavePause();
      });
  }

  function subscribeForIdlePause(): void {
    log('subscribeForIdlePause');
    pauseByIdle$.pipe(take(1)).subscribe(() => {
      log('pause by idle');
      renderer.pause();
      running$$.next(false);
      subscribeForResume();
    });
  }

  if (targetElement.matches(':hover')) {
    subscribeForMouseleavePause();
  } else {
    log(`idle, wait ${idlePauseTime}ms to pause`);
    subscribeForIdlePause();
  }

  return running$$.pipe(takeUntil(destroy$));
}
