CommGame — Level Authoring & Fix Notes
=====================================

Overview
--------
This repository is a prototype two-player construction/communication game using Matter.js. The Instructor builds (and describes) a structure, and the Builder places blocks on a grid. Levels are implemented as small modules in `levels/`.

Quick start (dev)
------------------
Serve the folder and open the page in a browser:

```bash
python -m http.server 8000
# then open http://localhost:8000
```
Use the Level dropdown in the toolbar to switch levels, or append `?level=2` to the URL.

Level module format
-------------------
Each level is a module that exports a default function: `buildLevel(width, height, gridSize)` and returns a plain object describing the scene.

Required return fields:
- `name` (string) — short level name
- `instruction` (string, optional) — shown in the toolbar badge
- `ballStart` ({x,y}) — spawn coordinates for the ball (in pixels)
- `goal` ({x,y}) — goal coordinates (in pixels) — often a `Bodies.polygon` star in `main.js`
- `lavaPits` (array) — optional array of sensors: {x,y,w,h}
- `obstacles` (array) — obstacle definitions (see below)

Obstacle definitions
--------------------
Supported obstacle shapes (in `main.js`):
- `rect` — rectangle: { shape: "rect", x, y, w, h, angle?, color? }
- `triangle` — upright triangle: { shape: "triangle", x, y, size, angle?, color? }
- `round` — rounded rectangle (implemented using chamfer): { shape: "round", x, y, w, h, radius?, angle?, color? }
- `l` — L-shaped composed obstacle: { shape: "l", x, y, w, h, color? }

Example level (skeleton)
-------------------------
Create `levels/levelX.js`:

```javascript
export default function buildLevel(width, height, gridSize) {
	return {
		name: 'Level X - Name',
		instruction: 'Short instruction for players',
		ballStart: { x: gridSize * 2, y: gridSize * 1 },
		goal: { x: width - gridSize * 2, y: height - gridSize * 2 },
		lavaPits: [ { x: 200, y: 300, w: 120, h: 40 } ],
		obstacles: [
			{ shape: 'rect', x: 400, y: 500, w: 240, h: 20, angle: 0 },
			{ shape: 'triangle', x: 600, y: 420, size: 50 }
		]
	};
}
```

How to add a new level to the UI
--------------------------------
1. Add the level module file to `levels/` (e.g., `level4.js`).
2. Import it in `main.js` and register in `levelBuilders` map:
	 - `import buildLevel4 from './levels/level4.js';`
	 - Add `"4": buildLevel4` to `levelBuilders`.
3. Add an `<option value="4">4 - Your Level Name</option>` to the `<select id="level-select">` in `index.html`.
4. Reload the page and choose the level from dropdown (the code will reset the scene automatically).

Notes on shapes & triangles
---------------------------
- Placed triangle blocks are created using a specialized upright triangle function in `main.js` so their apex points up.
- Level obstacle triangles should be defined with `shape: 'triangle'` and `size` (radius) — `main.js` creates obstacles via `createObstacle(...)`. If you need level triangles forced upright regardless of `angle`, update `createObstacle` to use the upright triangle helper.

Common fixes / troubleshooting
-----------------------------
- Ball stops instead of rolling:
	- Check ball properties in `main.js` (see `loadLevel()`): tune `friction`, `frictionAir`, and `restitution`.
	- Also set obstacle friction (in `createObstacle`) and block friction so the ball does not lose too much energy.

- Blocks placed overlapping obstacles:
	- Placement guarding uses `overlapsWithObstacle` and `Query.collides` in `main.js`.
	- To change sensitivity, tweak `margin` in `overlapsWithObstacle` or use `Query.collides` only.

- Triangle placement upside-down:
	- The repo uses `createUprightTriangle(x,y,w,h,fill)` in `main.js` for placed triangles. If a level obstacle triangle appears inverted, modify `createObstacle` to call this helper for obstacle triangles.

- Want a real see-saw / hinged plank:
	- A dynamic see-saw requires a non-static plank and a pivot constraint.
	- Example approach (in a level loader or `main.js`):
		- `const plank = Bodies.rectangle(x, y, w, h, { density: 0.002 });`
		- `const pivot = Bodies.circle(x, y, 6, { isStatic: true });`
		- `Composite.add(engine.world, [plank, pivot]);`
		- Use `Constraint.create({ bodyA: plank, pointB: { x, y }, stiffness: 1, length: 0 })` to constrain the plank to the pivot.
	- After adding the dynamic plank, update collision logic as needed (plank should not be `isStatic`).

Debugging tips
--------------
- Open the browser dev tools console (Cmd/Ctrl+Shift+I) — errors from `main.js` often indicate missing imports or bad level object fields.
- Validate level modules with Node (quick import test):

```sh
node --input-type=module -e "import('file://$PWD/levels/level2.js').then(m=>console.log(m.default(800,600,40).name))"
```

- To test small code changes: run `node --check main.js` (syntax-only check).

Where to change UI text
----------------------
- The level instruction badge is updated in `main.js` via `updateInstruction(level)`. The string comes from `level.instruction`.