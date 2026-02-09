export default function buildLevel(width, height, gridSize) {
  const gapWidth = gridSize * 1.2;
  const blockWidth = gridSize * 2.6;
  const blockHeight = gridSize * 0.6;
  const leftX = width * 0.45;
  const rightX = leftX + blockWidth + gapWidth;
  const floorY = height - gridSize * 0.9;
  const gapCenterX = leftX + blockWidth + gapWidth * 0.5;
  const shelfX = (gapCenterX + gridSize * 10) * 0.5;
  const shelfY = gridSize * 6.5;
  const shelfWidth = gridSize * 6.5;
  const shelfHeight = gridSize * 0.6;

  return {
    name: "Level 2 - Gap Slot",
    instruction: "A shelf catches the ball. Nudge it off and guide it into the narrow slot below.",
    ballStart: { x: gridSize * 10, y: gridSize * 2 },
    goal: { x: gapCenterX, y: floorY + gridSize * 0.5 },
    lavaPits: [],
    obstacles: [
      {
        shape: "rect",
        x: leftX + blockWidth * 0.5,
        y: floorY,
        w: blockWidth,
        h: blockHeight,
        angle: 0,
        color: "#475569"
      },
      {
        shape: "rect",
        x: rightX + blockWidth * 0.5,
        y: floorY,
        w: blockWidth,
        h: blockHeight,
        angle: 0,
        color: "#475569"
      },
      {
        shape: "rect",
        x: shelfX,
        y: shelfY,
        w: shelfWidth,
        h: shelfHeight,
        angle: 0,
        color: "#4b5563"
      }
    ]
  };
}
