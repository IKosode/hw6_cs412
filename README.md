# HW6 — Texture Mapping (WebGL2)

Interactive WebGL2 scene with **three textured geometric primitives**, an **animated video texture**, plus **bump mapping** and **normal mapping**.

## Scene

| Object | Texture | Mapping |
|--------|---------|---------|
| Sphere | `textures/plasma.mp4` | Animated video (flat lit) |
| Cone   | `textures/brick.png`  | Bump mapping from luminance |
| Torus  | `textures/normal.jpg` | Tangent-space normal mapping |

Built on the course boilerplate (live vertex/fragment shader editors, mouse orbit, camera keys, spin controls).

## Run locally

Browsers block WebGL texture loads from `file://`. Serve the folder over HTTP:

```bash
npm start
```

Then open [http://127.0.0.1:43127](http://127.0.0.1:43127) (or `/hw6.html`).

Any static server works, for example:

```bash
python3 -m http.server 43127 --bind 127.0.0.1
```

## Controls

- **Drag** the canvas to rotate
- **Arrow keys** / **W** **S** move the camera
- **Slider** + axis dropdown + **Start/Stop Rotation**
- Edit shaders in the left panels; the program recompiles as you type
- If the plasma sphere does not animate, click the canvas once (browser autoplay policy)

## GitHub Pages

1. Push this repository to GitHub
2. Enable **Pages** from the `main` branch (root)
3. Open `https://<user>.github.io/<repo>/` — textures use relative paths (`textures/...`)

## Files

- `index.html` / `hw6.html` — UI
- `main.js` — shaders, textures, render loop
- `models.js` — cube, cylinder, **sphere**, **cone**, **torus**
- `transforms.js` — matrix helpers
- `textures/` — brick, normal map, plasma video
