# Flavio Leone — Photographer

A static portfolio for Flavio Leone (photographer & visual artist, Switzerland),
built in the same house style as **flavioleone.com**: system-font Swiss
minimalism, a JSON-driven image gallery, a random per-session background theme,
dark-mode support, and a keyboard/swipe lightbox. Served by nginx and packaged
for [deplo.io](https://guides.deplo.io/docker/quick-start.html).

Best of both existing sites: the **flavioleone.com** design system + the
**flavioleone.ch** idea of organising work into named projects (`napulé`,
`jepp`, `recent`).

## Structure

```
.
├── Dockerfile                     # nginx serving the static site on $PORT
├── nginx/default.conf.template    # rendered at startup (clean URLs, gzip, caching)
└── site/                          # served at the web root
    ├── index.html                 # Hero + project cards ("Selected Work")
    ├── work.html                  # Full flat gallery (every image, lightbox)
    ├── projects/                  # One page per project (lightbox scoped to the project)
    │   ├── napule.html · jepp.html · recent.html
    ├── about.html  contact.html  404.html
    ├── robots.txt  sitemap.xml
    └── assets/
        ├── styles.css             # Design system (light/dark + 6 bg themes)
        ├── app.js                 # Project cards + galleries + lightbox + bg theme
        ├── work.json              # Content manifest (the only thing you edit)
        └── img/original/          # Drop full-size photos here
```

The site is **data-driven** from `assets/work.json`, which is grouped by project:

```json
{
  "projects": [
    { "slug": "napule", "title": "napulé", "meta": "Documentary · Naples · 2024",
      "description": "…",
      "images": [ { "src": "/assets/img/original/nap-01.jpg", "alt": "…" } ] }
  ]
}
```

`app.js` reads it and renders: project cards on the home page (cover = each
project's first image), the full flat gallery on `work.html`, and each
`projects/<slug>.html` page (matched by its `data-project="<slug>"` grid).
To add a project, add an object to the array and a matching
`projects/<slug>.html` page (copy an existing one and change the title/meta/slug).

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

## Adding Flavio's real photos

1. Put image files in `site/assets/img/original/` (e.g. `nap-01.jpg`).
2. Edit `site/assets/work.json` — replace the `picsum.photos` placeholder URLs
   with `/assets/img/original/<file>` and set a meaningful `alt`. Order within a
   project = display order; the first image is the project's cover.
3. Remove the `<link rel="preconnect" href="https://picsum.photos">` tags from
   the HTML once no external images remain.

Bio text and contact details (`hello@flavioleone.ch`, `@flavio.leone`) mirror the
current flavioleone.com — adjust to taste.
