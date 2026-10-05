# Hydration Buddy: design and animation notes

## Files
- `buddy.svg`: front view (faces you), used while he waits at the center for your answer.
- `buddy-side.svg`: side view (profile facing right), used for walking in and the happy jog.
- `buddy-crawl.svg`: on hands and knees, crying, used when the answer is "No". All three share the 120 × 200 viewBox and class names.
- `hydration-buddy.html`: self-contained demo with the same SVG inline, the CSS animations, and a small `HydrationBuddy` JS controller. Open it in any browser.

## Character
- Based on Vijay's reference picture: a chibi boy with an oversized round head, thick dark outlines (`#1E1A1A`, 2.6 px) and flat colours.
- Messy spiky chestnut hair `#A4552C` with pointed bangs, big ears, small shiny black eyes with short brows, a round button nose, a cheerful open mouth and large rosy cheeks.
- Blue T-shirt `#2B95E6` with short sleeves, brown shorts `#C68A5A`, bare legs and feet. Peach skin `#F8CBAE`.
- Walking uses the side view: he carries the glass in his front hand and swings both arms and legs. When he reaches the center he turns (a quick `scaleX` flip) to the front view and holds the glass with both hands (`.hb-hold`).
- Moods are toggled by CSS: neutral (open smile) / happy (eyes close into arcs, wider grin, jogging) / sad (drops to his knees, wailing mouth, worried brows, two tears, sobbing head). Walking left mirrors him with `scaleX(-1)`.
- Named groups for animation: `.hb-body`, `.hb-head`, `.hb-eyes`, `.hb-eyes-happy`, `.hb-leg-front`, `.hb-leg-back`, `.hb-arm-front`, `.hb-arm-back` (side view), `.hb-hold` (front view), `.hb-tear`; wrappers `.hb-pose-side`, `.hb-pose-front` and `.hb-pose-crawl` pick the view.

## States and timing
| State | Movement | Travel | Step cycle | Notes |
|---|---|---|---|---|
| `enter` | waddles in sideways from the left, hops round to face you | 1.68 s, steady (linear) | 0.42 s × 4 | cute waddle: body rocks ±4° with squash and stretch, head nods ±3°, 6 px hop; 0.3 s turn-and-hop into `idle` |
| `idle` | stands at center | loops | 2.6 s breath | blink every 4 s, speech bubble "Had a glass of water yet?" |
| idle, no answer | jumps three times on the spot | 1.2 s jump, every 4 s | none | after 3 s without an answer: shouting mouth, "!!" marks, glass waggles, bubble wiggles and swaps to a funny line ("Hellooo? Earth to you!", "I'm drying up like a raisin!", "Water you waiting for?", ...). Stops the moment you answer. Set with `data-attn="on"`. |
| `happy` | turns sideways, jogs off to the right | 2.24 s, ease-in | 0.32 s × 7 | 36° stride, 44° arm pump, 11 px bounce, happy closed eye, then `hidden` |
| `sad` | drops to his knees, crawls back to the left crying | 3.4 s, slow | 0.68 s × 5 | 16° crawl swing, head sobs every 0.34 s, two tears, then `hidden` |
| `hidden` | parked off-screen left | none | none | ready for the next `enter` |

- Every travel is a whole number of step cycles, so the legs finish on the same pose they start from and the states chain without a jump.
- Limb swings, bob, blink, breath and tear are `infinite` loops; only the travel is one-shot. Since `happy` and `sad` both end off-screen and `enter` starts off-screen left, enter → answer → enter loops seamlessly.
- All timings are CSS variables on `.hb-walker` (`--hb-enter`, `--hb-happy`, `--hb-sad`, `--step`, `--leg-amp`, `--arm-amp`, `--bob`) so they can be tuned without touching keyframes.
- `prefers-reduced-motion`: animations collapse to 1 ms, so he simply appears and disappears.

## Triggering
Markup: a `.hb-walker` (with `data-state`) inside a `position: relative; overflow: hidden` stage, wrapping `.hb-bubble` and `.hb-facing > svg`.

```js
const buddy = new HydrationBuddy(document.getElementById('buddy'));
await buddy.enter();  // walk in, then idle with the question bubble
await buddy.yes();    // happy walk right, then hidden
await buddy.no();     // sad walk left, then hidden
el.addEventListener('buddy:state', e => console.log(e.detail.state));
el.addEventListener('buddy:nudge', e => console.log('nudge', e.detail.count)); // fires on each attention jump
// new HydrationBuddy(el, { attentionDelay: 3000, nudgeEvery: 4000 }) to tune the timing
```

Without JS, set `el.dataset.state = 'enter' | 'idle' | 'happy' | 'sad' | 'hidden'`. To replay the same state, set it to anything else first and force a reflow (`void el.offsetWidth`); `play()` does this for you. Each promise resolves with the finished state, or `null` if another state interrupted it.

## Desktop app
`desktop-app/` is an Electron tray app that walks the buddy across the bottom of the real screen every 2 hours (transparent, click-through overlay). See `desktop-app/README.md`. Prebuilt Windows zip and source zip are in `downloads/`.
