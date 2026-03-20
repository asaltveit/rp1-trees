# Fractal Forest

**The go-to plant provider for the Metaverse.** Grow any plant or biome from a text description — Claude interprets your words into L-system grammar rules, generates fractal 3D trees, exports them as `.glb` files, and places them directly into your RP1 Metaverse scene via Manifold Fabric.

Website: https://rp1-trees.vercel.app/

Won 2nd place in the Remote Track at the Open Metaverse Hackathon @ The Immersive Commons (GDC Weekend).

---

## Vision

The Metaverse needs vegetation. Every virtual world, game environment, and spatial computing scene eventually needs trees, shrubs, ground cover, and biome-scale ecosystems — but creating plant geometry by hand is slow, expensive, and hard to scale.

Fractal Forest solves this: **describe any plant or world in plain language and get production-ready 3D assets placed in your scene in seconds.** The goal is to become the default plant layer for RP1 and the broader Metaverse — a single tool that can populate any environment, from a photorealistic temperate forest to an alien bioluminescent world, on demand.

---

## What it does

Fractal Forest is a full-stack procedural vegetation generator built for RP1 Metaverse scene creators. It bridges two things that are usually painful to do together: **authoring realistic plant geometry** and **placing it in a live scene**.

1. **Describe** — write any plant in plain English ("a weeping willow with sparse leaves beside a river") or pick a biome preset (Temperate Forest, Tropical Rainforest, Arctic Tundra, Alien Bioluminescent World, and more).
2. **Interpret** — Claude API reads your description and outputs structured L-system grammar rules, growth parameters (branch angles, length ratios, trunk thickness), and per-plant metadata.
3. **Generate** — a Python serverless function expands the L-system grammar with a fractal turtle, builds a 3D branching mesh with procedural bark and leaf textures, and exports a binary `.glb` file — all server-side with no heavy dependencies.
4. **Place** — the `.glb` is uploaded to your RP1 / Manifold Fabric server via SFTP, then the TypeScript orchestrator opens your scene and places the object at the coordinates you specified (with per-plant offsets in biome mode).

The result: a placement map, a list of placed objects with their scene IDs, and download links — all in one request.

---

## How Claude is used

Claude (`claude-sonnet-4-6`) is the creative and semantic core of the pipeline. For each plant or biome, it receives a free-form natural language description or biome theme alongside a JSON schema describing the expected L-system format.

Claude returns a structured object per plant containing:

- `lsystem_rule` — the production rule string (e.g. `F → FF+[+F-F-F]-[-F+F+F]`)
- `axiom`, `iterations`, `angle`, `trunk_thickness`, `branch_length_ratio`
- `plant_name`, `species_id`, `x_offset`, `z_offset` (biome mode)
- Texture hints (bark colour, leaf colour)

This lets a non-expert user create botanically plausible, visually varied plants just by describing what they want — or generate a coherent mixed-species biome in a single API call.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TailwindCSS 4 |
| Orchestration API | TypeScript serverless (Vercel, Node 22) |
| Plant generation | Python 3.12 serverless (Vercel), numpy + pygltflib + Pillow |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| 3D export | Binary GLB (GLTF 2.0) with embedded textures |
| Metaverse platform | RP1 via Manifold Fabric WebSocket API + SFTP upload |
| Hosting | Vercel (frontend + both serverless runtimes) |

### Python generation stack — no heavy deps

Vercel's 250 MB function limit ruled out scipy and trimesh. The generator is built from scratch:

- **L-system expansion** — iterative string rewriting with a branch cap of 1500 segments for timeout safety
- **Catmull-Rom splines** — custom implementation replaces `scipy.interpolate.splprep` for smooth branch curves
- **Textures** — procedural bark (512×512) and leaf (256×256) PNGs generated with Pillow, encoded as embedded GLB bufferViews
- **Geometry** — cylindrical branch meshes with tapered radii, exported as indexed triangle meshes

Total Python dependency footprint: ~75 MB (`numpy`, `pygltflib`, `Pillow`, `anthropic`).

---

## Features

- **Single plant mode** — one description → one `.glb` → placed in scene
- **Biome mode** — one theme → Claude generates 3–7 varied species → all placed with spatial offsets
- **Seed parameter** — reproducible generation; same seed + description = same plant every time
- **Placement map** — SVG minimap showing all placed plants at their scene coordinates with hover/keyboard tooltips
- **RP1 / Manifold connection** — WebSocket Fabric API + SFTP file transfer, configurable in-browser (persisted to `localStorage`)
- **Accessible UI** — WCAG 2.1: `aria-live` status regions, `aria-pressed` toggle buttons, `fieldset`/`legend` grouping, keyboard-navigable placement map, screen-reader-safe SVGs

---

## Running locally

**Requirements:** Node 22+, Python 3.12+

```bash
# Install dependencies
npm install
pip install -r api/requirements.txt

# Set environment variables
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local

# Run (Next.js + Python functions together)
vercel dev
```

Python functions are served at `localhost:3000/api/py/generate` and `localhost:3000/api/py/biome`.

Test the full pipeline:

```bash
curl -X POST localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "single",
    "description": "a tall pine tree with dense upward branches",
    "seed": 42,
    "baseX": 0,
    "baseZ": 0,
    "manifoldConfig": {
      "fabricUrl": "wss://your-fabric.example.com",
      "adminKey": "your-admin-key",
      "sceneName": "My Scene"
    }
  }'
```

---

## Environment variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Required. Claude API key for L-system generation. |

RP1 / Manifold connection details (Fabric URL, admin key, SFTP credentials) are entered in the browser UI and stored in `localStorage` — they are never sent to any server other than your own RP1 / Manifold Fabric instance.

---

## Project structure

```
app/
  page.tsx                    # Homepage with animated alien biome demo
  generate/page.tsx           # Generator UI
  api/generate/route.ts       # TypeScript orchestration (GLB upload + scene placement)
api/py/
  generate.py                 # Single plant Python serverless function
  biome.py                    # Biome set Python serverless function
  plant/
    lsystem.py                # L-system grammar expansion
    geometry_synthesizer.py   # Catmull-Rom branch mesh builder
    glb_exporter.py           # Binary GLB export with embedded textures
    texture_gen.py            # Procedural bark + leaf texture generation
    types.py                  # Shared dataclasses
components/
  AlienBiomeDemo.tsx          # Animated homepage demo (3-step auto-cycle)
  PlantForm.tsx               # Description / biome form
  ModeToggle.tsx              # Single / Biome mode toggle
  ManifoldConnectionForm.tsx  # RP1 / Fabric WebSocket + SFTP config
  PlacementMap.tsx            # SVG placement minimap
  PlantCard.tsx               # Result card per generated plant
lib/
  manifold-client.ts          # Manifold WebSocket + SFTP client
  types.ts                    # Shared TypeScript types
```

---

## Biome presets

| Preset | Character |
|---|---|
| Temperate Forest | Oak, birch, maple — mid-density, varied heights |
| Tropical Rainforest | Tall emergents, broad canopy, climbing vines |
| Desert & Scrubland | Sparse succulents, twisted shrubs, low ground cover |
| Arctic Tundra | Dwarf willows, ground-hugging moss-like forms |
| Mediterranean Shrubland | Olive-like trees, aromatic low shrubs |
| Alien Bioluminescent World | Crystalline spikes, glowing tendrils, xenophytes |
| Enchanted Fantasy Forest | Spiraling trunks, oversized canopies, ethereal forms |
| Custom | Describe any world in free text |

---

## Acknowledgements

Built for the [Birds hackathon](https://birds.so). Uses the [Anthropic Claude API](https://anthropic.com) for L-system grammar generation and [RP1](https://rp1.com) / [Manifold Fabric](https://manifold.inc) for Metaverse scene placement.
