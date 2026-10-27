export const SURPRISE_DURATION = 420;

// Independent timers make cancellation on activity, hidden tabs, and unmount reliable.
export function createSurpriseScheduler({ show, hide, canShow, random = Math.random, schedule = setTimeout, cancel = clearTimeout }) {
  let waiting, flashing, stopped = false;
  const clear = () => {
    cancel(waiting);
    cancel(flashing);
    hide();
  };
  const arm = (minimum, spread) => {
    if (stopped) return;
    clear();
    waiting = schedule(() => {
      if (stopped || !canShow()) return;
      show();
      flashing = schedule(() => {
        hide();
        arm(12000, 10000);
      }, SURPRISE_DURATION);
    }, minimum + random() * spread);
  };
  return {
    activity: () => arm(10000, 8000),
    leave: () => arm(2000, 4000),
    suspend: clear,
    dispose: () => { stopped = true; clear(); },
  };
}
