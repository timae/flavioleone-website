# Flavio Leone — Photographer

A static portfolio for Flavio Leone (photographer & visual artist, Switzerland),
built in the same house style as **flavioleone.com**: system-font Swiss
minimalism, a JSON-driven image gallery, a random per-session background theme,
dark-mode support, and a keyboard/swipe lightbox. Served by nginx and packaged
for [deplo.io](https://guides.deplo.io/docker/quick-start.html).

Best of both existing sites: the **flavioleone.com** design system + the
**flavioleone.ch** idea of organising work into named projects (`recent`,
`jepp`). The images are Flavio's **real photographs**, scraped from the live
flavioleone.ch (a Cargo site) and served from his Cargo CDN — see
[Images](#images) below.

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
        ├── styles.css             # Design system (light/dark + 6 bg themes)
        ├── app.js                 # Project cards + galleries + lightbox + bg theme
        ├── work.json              # Content manifest (the only thing you edit)
        └── img/original/          # (empty) drop self-hosted photos here to localise
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

The galleries use Flavio's real photos, hotlinked from his Cargo CDN
(`freight.cargo.site`, sized at `w/1200`). The data was extracted from the live
flavioleone.ch:

- **recent** (19) — the home slideshow reel
- **jepp** (7) — the commissioned EP series
- **all** (40) — the full `index` portfolio shown on `work.html`

> **Trade-off:** hotlinking keeps the repo tiny but depends on his Cargo
> subscription staying live. To make the site fully self-contained, download the
> images into `site/assets/img/original/` and rewrite the `src` values to
> `/assets/img/original/<file>` (a script can fetch every `src` in `work.json`).
> napulé was intentionally omitted — it's a single-image stub on the live site
> with no resolvable source file.

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

## Self-hosting the photos (optional)

To stop depending on his Cargo CDN, download every image referenced in
`work.json` into `site/assets/img/original/` and rewrite the `src` values, e.g.:

```powershell
$ua = "Mozilla/5.0"
$j = Get-Content site/assets/work.json -Raw | ConvertFrom-Json
$all = @($j.projects.images; $j.all) | Sort-Object src -Unique
foreach ($img in $all) {
  $file = ($img.src -split '/')[-1]
  Invoke-WebRequest -Uri $img.src -UserAgent $ua -OutFile "site/assets/img/original/$file"
}
# then replace  https://freight.cargo.site/w/1200/i/<hash>/  ->  /assets/img/original/
```

Bio text and contact details (`hello@flavioleone.ch`, `@flavio.leone`) mirror the
current flavioleone.com — adjust to taste.
