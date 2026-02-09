export default function buildLevel(width, height, gridSize) {
  const plankY = height - gridSize * 3.2;
  const plankWidth = gridSize * 6;
  const plankX = width * 0.35;
  const platformWidth = gridSize * 4.2;
  const platformHeight = gridSize * 0.6;
  const platformX = width - gridSize * 3.2;
  const platformY = height - gridSize * 7.5;

  return {
    name: "Level 3 - See-Saw Launch",
    instruction: "Build a launcher so the falling ball reaches the high platform.",
    ballStart: { x: plankX - gridSize * 1.2, y: gridSize * 2 },
    goal: { x: platformX, y: platformY - gridSize * 0.8 },
    lavaPits: [],
    obstacles: [
      {
        shape: "rect",
        x: plankX,
        y: plankY,
        w: plankWidth,
        h: gridSize * 0.5,
        angle: 0,
        color: "#475569"
      },
      {
        shape: "rect",
        x: platformX,
        y: platformY,
        w: platformWidth,
        h: platformHeight,
        angle: 0,
        color: "#475569"
      }
    ]
  };
}
