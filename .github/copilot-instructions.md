# Copilot instructions for my-first-app

## Commands

This is a dependency-free static site; there is no package manifest, build, test runner, or lint configuration. Open `index.html` in a browser to play. Check JavaScript syntax with:

```sh
node --check game.js
```

## Architecture

- `index.html` defines the Japanese-language game page, canvas, status text, restart control, and touch controls. It loads `style.css` and defers `game.js`.
- `style.css` owns the page layout and responsive/touch-control presentation. The canvas drawing surface is 960×540 logical pixels and scales to a 16:9 display.
- `game.js` contains the game state, input handling, physics/collision, camera, and Canvas 2D rendering in one IIFE. The animation loop updates state and redraws each frame.
- World geometry and collectibles are defined as arrays near the top of `game.js`; world coordinates are translated by `cameraX` when drawing. The DOM status element communicates objectives, collected coins, and completion.

## Conventions

- Keep the page in Japanese and preserve the separation between HTML structure, CSS presentation, and game behavior.
- 説明・操作案内・ステータスなど、Canvas内を含むユーザー向けの表示は日本語にする。
- Keep game runtime state and helpers inside the `game.js` IIFE; use the existing canvas loop rather than adding a framework or separate rendering lifecycle.
- Use the existing world-coordinate arrays for platforms, hazards, and coins; rendering scrolls the world with the camera, while the background uses parallax.
- Keyboard and touch controls feed the same `input` state and jump queue. If adding controls, retain both input paths and update the visible instructions in `index.html`.
- The DOM contract between `index.html` and `game.js` uses `#game`, `#status`, `#restart`, and the `data-control` values `left`, `right`, and `jump`; keep selectors and markup synchronized when changing these controls.
- Keep the canvas's 960×540 logical coordinate system in sync with game dimensions and its 16:9 CSS aspect ratio.
