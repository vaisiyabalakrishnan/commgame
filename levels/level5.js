export default function buildLevel(width, height, gridSize) {
  const gs      = gridSize;                        // 40 px
  const cx      = Math.round(width * 0.72);         // 576 — gate / corridor centre x
  const gw      = gs * 4;                           // 160 — gate & gap width
  const gh      = gs * 0.5;                         // 20  — gate / slab thickness
  const gapLeft  = cx - gw / 2;                     // 496 — left edge of hole
  const gapRight = cx + gw / 2;                     // 656 — right edge of hole

  return {
    name: "Level 5 – Dual Timed Gates",
    instruction:
      "Gate A (red, ~6 s) and Gate B (orange, ~4 s) both guard the path. " +
      "Build a ramp to delay the ball through Gate A, rest on the buffer ledge, then time Gate B.",

    ballFriction:       0.005,
    ballFrictionStatic: 0.02,
    ballRestitution:    0.25,

    ballStart: { x: gs * 2, y: gs * 1 },           // (80, 40) — top-left
    goal:      { x: cx,     y: height - gs * 0.75 }, // (576, 570) — below Gate B

    lavaPits: [],

    obstacles: [
      // ── Floor A (y = 7×gs = 280) — split by Gate A gap ──
      { shape: "rect",
        x: gapLeft / 2,            y: gs * 7,
        w: gapLeft,                h: gh, color: "#1e293b" },
      { shape: "rect",
        x: (gapRight + width) / 2, y: gs * 7,
        w: width - gapRight,       h: gh, color: "#1e293b" },

      // ── Buffer ledge (y = 10.5×gs = 420) — ball parks here between gates ──
      { shape: "rect",
        x: cx,  y: gs * 10.5,
        w: gw + gs, h: gh, color: "#475569" },

      // ── Floor B (y = 13×gs = 520) — split by Gate B gap ──
      { shape: "rect",
        x: gapLeft / 2,            y: gs * 13,
        w: gapLeft,                h: gh, color: "#1e293b" },
      { shape: "rect",
        x: (gapRight + width) / 2, y: gs * 13,
        w: width - gapRight,       h: gh, color: "#1e293b" },
    ],

    // Two vertically-oscillating (portcullis) gates.
    // axis:"y" → gate RISES (y decreases) to open the hole; returns to base to close.
    // The engine uses: offset = max(0, -sin(t·freq + phase)) × amplitude
    //                  newY   = base_y − offset
    timedGates: [
      {
        // Gate A — red, slower (~6.3 s period)
        x: cx,   y: gs * 7,
        w: gw,   h: gh,
        amplitude:   gs * 2,   // 80 px rise — leaves 60 px clearance for ball (d=40)
        frequency:   0.001,
        color:       "#ef4444",
        axis:        "y",
        phaseOffset: 0,
      },
      {
        // Gate B — orange, faster (~3.7 s period)
        x: cx,   y: gs * 13,
        w: gw,   h: gh,
        amplitude:   gs * 2,
        frequency:   0.0017,
        color:       "#f97316",
        axis:        "y",
        phaseOffset: Math.PI * 0.7, // out-of-phase so gates differ visually at start
      },
    ],
  };
}
