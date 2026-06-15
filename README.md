# Flavio Leone — Photographer

A static portfolio for Flavio Leone (photographer & visual artist, Switzerland).
Served by nginx and packaged for
[deplo.io](https://guides.deplo.io/docker/quick-start.html).

## Design — "Editorial Index"

A new design that fuses both existing sites rather than copying either:

- **From flavioleone.ch:** its *laufschrift* running-text **marquees**, the
  lowercase editorial voice, work organised into **named projects**, and a
  **serif/grotesque** type pairing — here the self-hosted **Fraunces** variable
  serif (in `assets/fonts/`, nothing loaded from Google) set against a system
  grotesque.
- **From flavioleone.com:** the restraint, dark-mode support, the JSON-driven
  galleries and the keyboard/swipe lightbox.
- **New:** a warm **paper-and-ink** palette with a subtle film-grain overlay, a
  cinematic auto-advancing **hero slideshow**, a **natural-ratio masonry** (no
  forced crops — built from each photo's real dimensions), and a **grid ⇄ index**
  toggle on the Work page with a cursor-following thumbnail preview.

Everything is self-contained — **no external services, fonts or CDNs at runtime**.
The photographs are Flavio's real images (extracted from the live flavioleone.ch)
downloaded into `site/assets/img/original/`.

## Structure

```
.
├── Dockerfile                     # nginx serving the static site on $PORT
├── nginx/default.conf.template    # rendered at startup (clean URLs, gzip, caching)
└── site/                          # served at the web root
    ├── index.html                 # Hero + project cards ("Selected Work")
    ├── work.html                  # Full portfolio (40 images, lightbox)
    ├── projects/                  # One page per project (lightbox scoped to the project)
    │   ├── jepp.html · recent.html
    ├── about.html  contact.html  404.html
    ├── robots.txt  sitemap.xml
    └── assets/
        ├── styles.css             # Design system (paper/ink, light/dark, marquee, masonry)
        ├── app.js                 # Hero slideshow + cards + masonry + index + lightbox
        ├── work.json              # Content manifest (the only thing you edit)
        ├── fonts/                 # Self-hosted Fraunces variable serif (woff2)
        └── img/original/          # Flavio's photographs (local, ~37 MB)
```

The site is **data-driven** from `assets/work.json`:

```json
{
  "projects": [
    { "slug": "jepp", "title": "jepp", "meta": "Commissioned · EP campaign · 2019",
      "description": "…",
      "images": [ { "src": "https://freight.cargo.site/w/1200/i/<hash>/<file>.jpg", "alt": "…" } ] }
  ],
  "all": [ { "src": "…", "alt": "…" } ]
}
```

`app.js` reads it and renders: project cards on the home page (cover = each
project's first image), the **`all`** list as the full gallery on `work.html`,
and each `projects/<slug>.html` page (matched by its `data-project="<slug>"`
grid). To add a project, add an object to `projects` and a matching
`projects/<slug>.html` page (copy an existing one and change the title/meta/slug).

## Images

Flavio's real photos, extracted from the live flavioleone.ch (a Cargo site,
sized at `w/1200`) and **downloaded into the repo** at
`site/assets/img/original/` — so the deployed site depends on nothing external:

- **recent** (19) — the home slideshow reel
- **jepp** (7) — the commissioned EP series
- **all** (40) — the full `index` portfolio shown on `work.html`

`work.json` stores each image's `src` (local path), `alt`, and original `w`/`h`
(used to lay out the masonry without reflow). napulé was intentionally omitted —
it's a single-image stub on the live site with no resolvable source file.

## Run with Docker

```bash
docker build -t flavioleone .
docker run --rm -p 8080:8080 flavioleone
# open http://localhost:8080
```

Override the port the way deplo.io does:

```bash
docker run --rm -e PORT=9000 -p 9000:9000 flavioleone
```

## Local preview (no Docker)

```powershell
cd site
python -m http.server 8080
# open http://localhost:8080
```

(`work.json` is fetched over HTTP, so it needs a real server — opening the
HTML files directly from disk won't load the galleries.)

## Deploy on deplo.io

The image satisfies deplo.io's contract: it listens on `0.0.0.0:$PORT`
(default `8080`), which the platform's TCP probe checks before routing traffic.

```bash
nctl create app flavioleone \
  --git-url=<your-git-remote> \
  --dockerfile
```

deplo.io injects `$PORT`; the Dockerfile defaults it to `8080`, so the same
image runs locally unchanged.

## Updating the photos

Images already live in `site/assets/img/original/`. To change the selection,
edit `site/assets/work.json`: each entry is `{ "src": "/assets/img/original/<file>",
"alt": "…", "w": <px>, "h": <px> }`. Order within a project = display order; the
first image is the project's cover. Set `w`/`h` to the real pixel dimensions so
the masonry reserves space without reflow.

Bio text and contact details (`hello@flavioleone.ch`, `@flavio.leone`) mirror the
live site — adjust to taste.
