export default function buildLevel(width, height, gridSize) {
  return {
    name: "Level 1",
    instruction: "Red lava pits are obstacles. Build a structure to guide the ball to the goal.",
    ballStart: { x: gridSize * 2, y: gridSize * 1 },
    goal: { x: width - gridSize * 3, y: height - gridSize * 1.5 },
    lavaPits: [
      { x: gridSize * 2.0, y: gridSize * 5.0, w: gridSize * 3.0, h: gridSize * 1.4 },
      { x: gridSize * 6.0, y: gridSize * 11.0, w: gridSize * 3.2, h: gridSize * 1.4 },
      { x: gridSize * 12.0, y: gridSize * 14.5, w: gridSize * 3.4, h: gridSize * 1.4 }
    ],
    obstacles: [
      {
        shape: "rect",
        x: width * 0.5,
        y: height - gridSize * 0.5,
        w: width * 0.9,
        h: 18,
        angle: 0,
        color: "#475569"
      }
    ]
  };
}
