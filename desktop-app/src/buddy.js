/* The HydrationBuddy controller comes from the web demo (buddy-controller.js). */

// If an animationend is ever missed, don't leave him stuck on screen: fake it after the walk.
function playSafely(buddy, state, durationMs) {
  const p = buddy.play(state);
  const name = HydrationBuddy.TRAVEL[state];
  if (name && durationMs) {
    const t = setTimeout(() => {
      if (buddy.state === state) buddy.el.dispatchEvent(new AnimationEvent('animationend', { animationName: name }));
    }, durationMs + 2000);
    p.then(() => clearTimeout(t));
  }
  return p;
}

/* ---- desktop wiring ---- */
(() => {
  const el = document.getElementById('buddy');
  const bubble = el.querySelector('.hb-bubble');
  const facing = el.querySelector('.hb-facing');
  const buddy = new HydrationBuddy(el);
  const WIDTH = 120;
  // Walking speeds in px/s, matched to the pace in the web demo. The step cycle for each
  // state is read from the CSS (--step), so gait changes in the demo carry over.
  const GAIT = { enter: { speed: 280, v: '--hb-enter' },
                 happy: { speed: 260, v: '--hb-happy' },
                 sad:   { speed: 140, v: '--hb-sad' } };
  function stepFor(state) {
    const prev = el.dataset.state;
    el.dataset.state = state;
    const step = parseFloat(getComputedStyle(el).getPropertyValue('--step')) || 0.5;
    el.dataset.state = prev;
    return step;
  }
  let platform = 'win32';
  let answered = false;

  function layout() {
    const w = window.innerWidth;
    el.style.setProperty('--x-start', `${-WIDTH - 40}px`);
    el.style.setProperty('--x-center', `${Math.round(w / 2 - WIDTH / 2)}px`);
    el.style.setProperty('--x-end', `${w + 40}px`);
    const half = w / 2 + 40;
    const out = {};
    for (const [state, g] of Object.entries(GAIT)) {
      const step = stepFor(state);
      const steps = Math.max(3, Math.round(half / g.speed / step)); // whole steps only
      out[state] = Math.round(steps * step * 1000);
      el.style.setProperty(g.v, `${out[state]}ms`);
    }
    return out;
  }
  let durations = layout();

  // Only catch the mouse while it's over the buddy or his bubble; everywhere else, clicks go
  // straight through to whatever app is underneath.
  function hoverable(on) {
    if (platform === 'linux') return;
    window.desktop.setInteractive(on && buddy.state === 'idle');
  }
  for (const part of [bubble, facing]) {
    part.addEventListener('mouseenter', () => hoverable(true));
    part.addEventListener('mouseleave', () => hoverable(false));
  }

  function shapeForLinux(on) {
    if (platform !== 'linux') return;
    if (!on) { window.desktop.setShape(null); return; }
    const a = el.getBoundingClientRect(), b = bubble.getBoundingClientRect();
    const x = Math.floor(Math.min(a.left, b.left)) - 6, y = Math.floor(Math.min(a.top, b.top)) - 6;
    const r = Math.ceil(Math.max(a.right, b.right)) + 6, btm = Math.ceil(Math.max(a.bottom, b.bottom)) + 6;
    window.desktop.setShape({ x: Math.max(0, x), y: Math.max(0, y), width: r - Math.max(0, x), height: btm - Math.max(0, y) });
  }

  el.addEventListener('buddy:state', (e) => {
    const s = e.detail.state;
    if (s === 'idle') {
      // wait a frame so the bubble is laid out before measuring it
      requestAnimationFrame(() => requestAnimationFrame(() => {
        shapeForLinux(true);
        if (bubble.matches(':hover') || facing.matches(':hover')) hoverable(true); // pointer already on him
      }));
    } else {
      window.desktop.setInteractive(false);
      shapeForLinux(false);
    }
  });

  // When he shouts a new line the bubble changes size; refresh the clickable area.
  el.addEventListener('buddy:nudge', () => requestAnimationFrame(() => {
    shapeForLinux(true);
    if (bubble.matches(':hover') || facing.matches(':hover')) hoverable(true);
  }));

  async function respond(yes) {
    if (answered || buddy.state !== 'idle') return;
    answered = true;
    window.desktop.answer(yes ? 'yes' : 'no');
    await playSafely(buddy, yes ? 'happy' : 'sad', yes ? durations.happy : durations.sad);
    window.desktop.done();
  }
  document.getElementById('btn-yes').addEventListener('click', () => respond(true));
  document.getElementById('btn-no').addEventListener('click', () => respond(false));

  window.desktop.onStart((info) => {
    platform = info.platform;
    durations = layout();
    answered = false;
    playSafely(buddy, 'enter', durations.enter);
  });
})();
