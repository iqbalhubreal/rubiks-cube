# Cube Solver

A browser-based twisty-puzzle app split into separate HTML, CSS and JavaScript files.

## Project structure

```text
cube-solver/
├── index.html          # App markup and script loading order
├── css/
│   └── style.css       # Layout, theme and component styling
├── js/
│   ├── core.js         # Puzzle models, move logic and solver adapters
│   ├── view.js         # 3D scene, painting, camera and touch controls
│   ├── playback.js     # Step playback, sound and video-frame composition
│   ├── studio.js       # Studio environment and recording workflow
│   └── app.js          # UI events, sidebar and app initialization
└── README.md
```

## Run the app

1. Extract the ZIP archive.
2. Open the `cube-solver` folder.
3. Open `index.html` in a modern browser.

For the most reliable local testing, start a small local web server from this folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Dependencies

The app loads these libraries from public CDNs, so an internet connection is required:

- [Three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) for 3D rendering.
- [cubejs 1.3.2](https://www.jsdelivr.com/package/npm/cubejs) for the 3×3 cube solver.

There is no build step or package installation required.

## Editing notes

- Keep the JavaScript files loaded in the order shown at the bottom of `index.html`. They are classic scripts and share top-level state.
- `core.js` is loaded first because the renderer and UI use its puzzle models and move helpers.
- `app.js` is loaded last because it binds controls and starts the initial puzzle after the other functions are defined.
- Keep the relative folder names (`css` and `js`) unchanged unless you also update the paths in `index.html`.

## Browser features

The 3D view uses WebGL. Video recording uses `MediaRecorder` and canvas capture, and sound uses the Web Audio API. Support depends on the browser and device. The app itself does not upload puzzle data to a server.
