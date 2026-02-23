import buildLevel1 from "./levels/level1.js";
import buildLevel2 from "./levels/level2.js";
import buildLevel3 from "./levels/level3.js";
import buildLevel4 from "./levels/level4.js";

const Matter = window.Matter;
const { Engine, Render, Runner, Bodies, Composite, Body, Events, Query, Constraint } = Matter;

const worldEl = document.getElementById("world");
const runBtn = document.getElementById("run");
const resetBtn = document.getElementById("reset");
const hintEl = document.getElementById("hint");
const modalEl = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalClose = document.getElementById("modal-close");
const levelSelect = document.getElementById("level-select");
const levelInstruction = document.getElementById("level-instruction");

const levelBuilders = {
  "1": buildLevel1,
  "2": buildLevel2,
  "3": buildLevel3,
  "4": buildLevel4
};

function getLevelFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("level");
}

function resolveLevelBuilder() {
  const fromUrl = getLevelFromUrl();
  if (fromUrl && levelBuilders[fromUrl]) {
    if (levelSelect) levelSelect.value = fromUrl;
    return levelBuilders[fromUrl];
  }
  if (levelSelect && levelBuilders[levelSelect.value]) {
    return levelBuilders[levelSelect.value];
  }
  return buildLevel1;
}

let currentLevelBuilder = resolveLevelBuilder();

const gridSize = 40;
const width = worldEl.clientWidth;
const height = worldEl.clientHeight;

const engine = Engine.create();
engine.world.gravity.y = 0;

const render = Render.create({
  element: worldEl,
  engine,
  options: {
    width,
    height,
    wireframes: false,
    background: "#0b1220"
  }
});

const runner = Runner.create();
Render.run(render);

const walls = [
  Bodies.rectangle(width / 2, height + 25, width, 50, { isStatic: true, render: { fillStyle: "#111827" } }),
  Bodies.rectangle(width / 2, -25, width, 50, { isStatic: true, render: { fillStyle: "#111827" } }),
  Bodies.rectangle(-25, height / 2, 50, height, { isStatic: true, render: { fillStyle: "#111827" } }),
  Bodies.rectangle(width + 25, height / 2, 50, height, { isStatic: true, render: { fillStyle: "#111827" } })
];

Composite.add(engine.world, walls);

const gridLines = [];
for (let x = 0; x <= width; x += gridSize) {
  gridLines.push(
    Bodies.rectangle(x, height / 2, 1, height, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "rgba(255,255,255,0.05)" }
    })
  );
}
for (let y = 0; y <= height; y += gridSize) {
  gridLines.push(
    Bodies.rectangle(width / 2, y, width, 1, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "rgba(255,255,255,0.05)" }
    })
  );
}
Composite.add(engine.world, gridLines);

let ball = null;
let ball2 = null;
let goal = null;
let goal2 = null;
let lavaBodies = [];
let obstacleBodies = [];
let levelBodies = [];
let placedBlocks = [];
let seesawBodies = [];
let seesawConstraints = [];
let seesawPlank = null;
let seesawMaxAngle = 0;
let seesawLaunchConfig = null;
let seesawLaunched = false;
let isRunning = false;
let isResetting = false;
let modalAction = null;
let isModalOpen = false;

let activeShape = "rect";
let activeSize = { w: 2, h: 1 };
const buttons = Array.from(document.querySelectorAll(".block-btn"));
buttons[1].classList.add("active");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeShape = btn.dataset.shape || "rect";
    activeSize = { w: Number(btn.dataset.w), h: Number(btn.dataset.h) };
  });
});

function snap(value) {
  return Math.round(value / gridSize) * gridSize;
}

function createLBlock(x, y, w, h, fill) {
  const partA = Bodies.rectangle(x - w * 0.25, y, w * 0.5, h, {
    friction: 0.02,
    render: { fillStyle: fill }
  });
  const partB = Bodies.rectangle(x + w * 0.25, y + h * 0.25, w * 0.5, h * 0.5, {
    friction: 0.02,
    render: { fillStyle: fill }
  });
  return Body.create({ parts: [partA, partB], isStatic: true });
}

function createObstacle(def) {
  const fill = def.color || "#334155";
  if (def.shape === "round") {
    return Bodies.rectangle(def.x, def.y, def.w, def.h, {
      isStatic: true,
      chamfer: { radius: def.radius || Math.min(def.w, def.h) * 0.35 },
      angle: def.angle || 0,
      friction: 0.02,
      render: { fillStyle: fill }
    });
  }
  if (def.shape === "triangle") {
    return Bodies.polygon(def.x, def.y, 3, def.size, {
      isStatic: true,
      angle: def.angle || 0,
      friction: 0.02,
      render: { fillStyle: fill }
    });
  }
  if (def.shape === "l") {
    return createLBlock(def.x, def.y, def.w, def.h, fill);
  }
  return Bodies.rectangle(def.x, def.y, def.w, def.h, {
    isStatic: true,
    angle: def.angle || 0,
    friction: 0.02,
    render: { fillStyle: fill }
  });
}

function clearBodies(bodies) {
  bodies.forEach((body) => Composite.remove(engine.world, body));
}

function updateInstruction(level) {
  if (!levelInstruction) return;
  const text = level.instruction || "Build a path to the goal.";
  levelInstruction.lastChild.textContent = ` ${text}`;
  const dot = levelInstruction.querySelector(".dot");
  if (dot) {
    const hasLava = (level.lavaPits || []).length > 0;
    dot.style.background = hasLava ? "#ef4444" : "#38bdf8";
    dot.style.boxShadow = hasLava ? "0 0 6px rgba(239,68,68,0.6)" : "0 0 6px rgba(56,189,248,0.6)";
  }
  levelInstruction.style.background = (level.lavaPits || []).length > 0
    ? "rgba(239,68,68,0.06)"
    : "rgba(56,189,248,0.08)";
  levelInstruction.style.borderColor = (level.lavaPits || []).length > 0
    ? "rgba(239,68,68,0.18)"
    : "rgba(56,189,248,0.3)";
}

function loadLevel() {
  const level = currentLevelBuilder(width, height, gridSize);

  ball = Bodies.circle(level.ballStart.x, level.ballStart.y, level.ball1Radius || 20, {
    restitution: level.ballRestitution || 0.25,
    friction: level.ballFriction || 0.002,
    frictionStatic: level.ballFrictionStatic || 0.02,
    frictionAir: 0.001,
    render: { fillStyle: "#f97316" }
  });

  ball2 = null;
  goal2 = null;

  if (level.ball2Start) {
    ball2 = Bodies.circle(level.ball2Start.x, level.ball2Start.y, level.ball2Radius || 25, {
      restitution: level.ballRestitution || 0.25,
      friction: level.ballFriction || 0.002,
      frictionStatic: level.ballFrictionStatic || 0.02,
      frictionAir: 0.001,
      render: { fillStyle: "#c084fc" }
    });
  }

  goal = Bodies.polygon(level.goal.x, level.goal.y, 5, 22, {
    isStatic: true,
    render: { fillStyle: "#facc15" }
  });

  if (level.goal2) {
    goal2 = Bodies.rectangle(
      level.goal2.x, level.goal2.y,
      level.goal2.w || 100, level.goal2.h || 40,
      { isStatic: true, isSensor: true, render: { fillStyle: "#ef4444" } }
    );
  }

  lavaBodies = (level.lavaPits || []).map((pit) =>
    Bodies.rectangle(pit.x, pit.y, pit.w, pit.h, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: "#ef4444" }
    })
  );

  obstacleBodies = level.obstacles.map(createObstacle);
  levelBodies = [
    ball,
    ...(ball2 ? [ball2] : []),
    goal,
    ...(goal2 ? [goal2] : []),
    ...obstacleBodies,
    ...lavaBodies
  ];
  Composite.add(engine.world, levelBodies);

  seesawBodies = [];
  seesawConstraints = [];
  seesawPlank = null;
  seesawMaxAngle = 0;
  if (level.seesaw) {
    const sw = level.seesaw;

    const fulcrum = Bodies.polygon(sw.fulcrum.x, sw.fulcrum.y, 3, sw.fulcrum.size, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: sw.fulcrum.color || "#475569" }
    });

    const plank = Bodies.rectangle(sw.plank.x, sw.plank.y, sw.plank.w, sw.plank.h, {
      density: sw.plank.density || 0.001,
      friction: sw.plank.friction || 0.8,
      frictionStatic: 0.5,
      frictionAir: sw.plank.frictionAir || 0.01,
      render: { fillStyle: sw.plank.color || "#64748b" }
    });

    if (sw.plank.inertiaMultiplier) {
      Body.setInertia(plank, plank.inertia * sw.plank.inertiaMultiplier);
    }

    const pivot = Constraint.create({
      bodyA: plank,
      pointA: { x: sw.pivot.offsetX || 0, y: 0 },
      pointB: { x: sw.pivot.x, y: sw.pivot.y },
      length: 0,
      stiffness: 1,
      render: { strokeStyle: "#475569", lineWidth: 2 }
    });

    seesawPlank = plank;
    seesawMaxAngle = sw.maxAngle || Math.PI / 4;
    seesawLaunchConfig = sw.launch || null;
    seesawLaunched = false;
    seesawBodies = [fulcrum, plank];
    seesawConstraints = [pivot];

    if (sw.weight) {
      const weight = Bodies.rectangle(sw.weight.x, sw.weight.y, sw.weight.size, sw.weight.size, {
        density: sw.weight.density || 0.015,
        restitution: sw.weight.restitution || 0.05,
        friction: sw.weight.friction || 0.8,
        render: { fillStyle: sw.weight.color || "#ef4444" }
      });
      seesawBodies.push(weight);
    }

    Composite.add(engine.world, [...seesawBodies, ...seesawConstraints]);
    levelBodies.push(...seesawBodies);
  }

  updateInstruction(level);
  if (level.ball2Start) {
    hintEl.textContent = "Orange = small · Purple = large — click to place blocks";
  }
}

loadLevel();

if (levelSelect) {
  const fromUrl = getLevelFromUrl();
  if (fromUrl && levelBuilders[fromUrl]) {
    levelSelect.value = fromUrl;
    currentLevelBuilder = levelBuilders[fromUrl];
  }
  levelSelect.addEventListener("change", () => {
    currentLevelBuilder = levelBuilders[levelSelect.value] || buildLevel1;
    resetLevel();
  });
}

worldEl.addEventListener("click", (event) => {
  const rect = worldEl.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const snappedX = snap(x);
  const snappedY = snap(y);

  const fill = "#38bdf8";
  const w = activeSize.w * gridSize;
  const h = activeSize.h * gridSize;

  let block;
  if (activeShape === "round") {
    block = Bodies.rectangle(snappedX, snappedY, w, h, {
      isStatic: true,
      chamfer: { radius: Math.min(w, h) * 0.35 },
      friction: 0.02,
      render: { fillStyle: fill }
    });
  } else if (activeShape === "triangle") {
    block = Bodies.polygon(snappedX, snappedY, 3, Math.max(w, h) * 0.45, {
      isStatic: true,
      angle: -0.48,
      friction: 0.02,
      render: { fillStyle: fill }
    });
  } else if (activeShape === "l") {
    block = createLBlock(snappedX, snappedY, w, h, fill);
  } else {
    block = Bodies.rectangle(snappedX, snappedY, w, h, {
      isStatic: true,
      friction: 0.02,
      render: { fillStyle: fill }
    });
  }

  if (Query.collides(block, [...obstacleBodies, ...seesawBodies]).length > 0) {
    hintEl.textContent = "Cannot place on obstacles";
    return;
  }

  placedBlocks.push(block);
  Composite.add(engine.world, block);
});

runBtn.addEventListener("click", () => {
  if (isRunning) return;
  isRunning = true;
  engine.world.gravity.y = 1;
  Runner.run(runner, engine);
  hintEl.textContent = "Simulation running";
});

function resetLevel() {
  if (isResetting) return;
  isResetting = true;
  if (isRunning) {
    Runner.stop(runner);
  }
  isRunning = false;
  engine.world.gravity.y = 0;
  hintEl.textContent = "Click grid to place block";

  clearBodies(placedBlocks);
  placedBlocks = [];

  seesawConstraints.forEach((c) => Composite.remove(engine.world, c));
  seesawConstraints = [];
  seesawBodies = [];
  seesawPlank = null;
  seesawMaxAngle = 0;
  seesawLaunchConfig = null;
  seesawLaunched = false;

  clearBodies(levelBodies);
  levelBodies = [];
  lavaBodies = [];
  obstacleBodies = [];
  loadLevel();
  isResetting = false;
}

resetBtn.addEventListener("click", resetLevel);

function showModal(title, message, onClose) {
  if (isModalOpen) return;
  isModalOpen = true;
  modalTitle.textContent = title;
  modalText.textContent = message;
  modalAction = onClose || null;
  modalEl.classList.add("active");
}

function closeModal() {
  if (!isModalOpen) return;
  modalEl.classList.remove("active");
  isModalOpen = false;
  if (modalAction) {
    const action = modalAction;
    modalAction = null;
    action();
  }
}

modalClose.addEventListener("click", closeModal);

Events.on(engine, "collisionStart", (evt) => {
  for (const pair of evt.pairs) {
    const { bodyA, bodyB } = pair;

    // Small ball reaches Goal A → success
    if ((bodyA === ball && bodyB === goal) || (bodyA === goal && bodyB === ball)) {
      hintEl.textContent = "Goal reached!";
      showModal("Success", "Goal reached!", null);
    }

    // Large ball reaches Goal A → failure (wrong ball got through the filter)
    if (ball2 && ((bodyA === ball2 && bodyB === goal) || (bodyA === goal && bodyB === ball2))) {
      hintEl.textContent = "Large ball got through!";
      showModal("Try again", "The large ball slipped through the filter!", resetLevel);
    }

    // Any ball hits Goal B sensor → failure
    if (goal2) {
      const hitsGoal2 =
        (bodyA === goal2 && (bodyB === ball || bodyB === ball2)) ||
        (bodyB === goal2 && (bodyA === ball || bodyA === ball2));
      if (hitsGoal2) {
        hintEl.textContent = "Ball in the failure zone!";
        showModal("Try again", "A ball landed in the wrong zone!", resetLevel);
      }
    }

    // Lava pit collisions for all balls
    for (const pit of lavaBodies) {
      const ballHit =
        (bodyA === ball && bodyB === pit) || (bodyA === pit && bodyB === ball) ||
        (ball2 && ((bodyA === ball2 && bodyB === pit) || (bodyA === pit && bodyB === ball2)));
      if (ballHit) {
        hintEl.textContent = "Ball fell into lava.";
        showModal("Try again", "Ball fell into lava.", resetLevel);
        break;
      }
    }
  }
});

Events.on(engine, "beforeUpdate", () => {
  if (!seesawPlank || seesawMaxAngle <= 0) return;

  const hitLimit = seesawPlank.angle > seesawMaxAngle || seesawPlank.angle < -seesawMaxAngle;
  const angVel = seesawPlank.angularVelocity;

  if (seesawPlank.angle > seesawMaxAngle) {
    Body.setAngle(seesawPlank, seesawMaxAngle);
    if (angVel > 0) Body.setAngularVelocity(seesawPlank, 0);
  } else if (seesawPlank.angle < -seesawMaxAngle) {
    Body.setAngle(seesawPlank, -seesawMaxAngle);
    if (angVel < 0) Body.setAngularVelocity(seesawPlank, 0);
  }

  if (hitLimit && !seesawLaunched && ball && seesawLaunchConfig) {
    seesawLaunched = true;
    const rad = (seesawLaunchConfig.angle || 55) * Math.PI / 180;
    const spd = seesawLaunchConfig.speed || 12;
    Body.setVelocity(ball, {
      x: spd * Math.cos(rad),
      y: -spd * Math.sin(rad)
    });
  }
});
