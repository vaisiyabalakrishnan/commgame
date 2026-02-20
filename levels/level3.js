export default function buildLevel(width, height, gridSize) {
  const plankW = gridSize * 10;
  const plankH = gridSize * 0.5;
  const plankCenterX = width * 0.38;
  const plankY = height - gridSize * 4;

  // Pivot LEFT of center: right arm is heavier, falls down.
  // Left arm swings UP and to the RIGHT — launching the ball toward the goal.
  const pivotOffset = plankW * 0.28;
  const pivotX = plankCenterX - pivotOffset;
  const leftArmLen = plankW / 2 - pivotOffset;

  const fulcrumSize = gridSize * 0.7;
  const fulcrumY = plankY + fulcrumSize * 0.5 + plankH * 0.5;

  // Ball resting on the LEFT end of the plank (just above the surface)
  const ballX = pivotX - leftArmLen * 0.75;
  const ballY = plankY - plankH / 2 - 20 - 1;

  // Goal platform to the UPPER RIGHT — reachable with a few blocks
  const platformW = gridSize * 5;
  const platformH = gridSize * 0.6;
  const platformX = width * 0.65;
  const platformY = height - gridSize * 5.5;

  return {
    name: "Level 3 - See-Saw Launch",
    instruction: "The heavy side tips and launches the ball — build blocks to catch it at the star!",
    ballFriction: 0.8,
    ballFrictionStatic: 1.0,
    ballRestitution: 0.4,
    ballStart: { x: ballX, y: ballY },
    goal: { x: platformX, y: platformY - gridSize * 0.8 },
    lavaPits: [],
    obstacles: [
      {
        shape: "rect",
        x: platformX,
        y: platformY,
        w: platformW,
        h: platformH,
        angle: 0,
        color: "#475569"
      }
    ],
    seesaw: {
      plank: {
        x: plankCenterX,
        y: plankY,
        w: plankW,
        h: plankH,
        density: 0.006,
        friction: 0.9,
        frictionAir: 0.005,
        color: "#64748b"
      },
      fulcrum: {
        x: pivotX,
        y: fulcrumY,
        size: fulcrumSize,
        color: "#475569"
      },
      pivot: {
        x: pivotX,
        y: plankY,
        offsetX: -pivotOffset
      },
      maxAngle: 0.3,
      launch: {
        speed: 15,
        angle: 55
      }
    }
  };
}
