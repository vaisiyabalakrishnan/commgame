export default function buildLevel(width, height, gridSize) {
  const gs = gridSize; // 40

  // Slot: vertical barriers at x=560 with a 40 px gap (y=280‥320)
  // Small ball  r=12, diameter=24 → fits through 40 px gap ✓
  // Large ball  r=28, diameter=56 → blocked by 40 px gap ✓
  const slotX   = gs * 14;  // 560
  const gapTop  = gs * 7;   // 280
  const gapBot  = gs * 8;   // 320
  const gapCenterY = (gapTop + gapBot) / 2; // 300

  return {
    name: "Level 4 - The Sieve",
    instruction:
      "Route ORANGE (small) through the slot to the star. Keep PURPLE (large) out!",

    // Physics overrides
    ballFriction: 0.005,
    ballFrictionStatic: 0.02,
    ballRestitution: 0.25,

    // Small ball (orange)
    ballStart:   { x: gs * 2,   y: gs * 1 }, // (80, 40)
    ball1Radius: 12,

    // Large ball (purple)
    ball2Start:  { x: gs * 4.75, y: gs * 1 }, // (190, 40)
    ball2Radius: 28,

    // Goal A – success (star, yellow): right of the slot, centered on the gap
    goal: { x: gs * 17.5, y: gapCenterY }, // (700, 300)

    // Goal B – failure sensor: wide strip across the bottom-left
    // Any ball resting on the floor left of the slot lands inside this zone → fail
    goal2: {
      x: gs * 7,            // centre x 280
      y: height - gs * 0.5, // centre y 580
      w: gs * 13,           // width  520  (spans x 20 … 540)
      h: gs * 1             // height  40
    },

    lavaPits: [],

    obstacles: [
      // ── Slot top barrier (y=0 → y=gapTop) ──────────────────────────────────
      {
        shape: "rect",
        x: slotX,
        y: gapTop / 2,            // centre y 140
        w: gs * 0.5,              // 20 px wide
        h: gapTop,                // 280 px tall
        color: "#64748b"
      },
      // ── Slot bottom barrier (y=gapBot → y=height) ────────────────────────
      {
        shape: "rect",
        x: slotX,
        y: gapBot + (height - gapBot) / 2, // centre y 460
        w: gs * 0.5,
        h: height - gapBot,                // 280 px tall
        color: "#64748b"
      },
      // ── Short landing shelf right of slot: catches the small ball ─────────
      {
        shape: "rect",
        x: slotX + gs * 2,   // 640
        y: gapCenterY + gs,  // 340
        w: gs * 4,           // 160
        h: gs * 0.5,         // 20
        color: "#334155"
      }
    ]
  };
}
