# Photo originals

Drop Flavio's full-size images here (e.g. `sample-001.jpg`) and point
`assets/work.json` at them:

```json
{ "id": "img-001", "src": "assets/img/original/sample-001.jpg", "alt": "Portrait" }
```

Then remove the `picsum.photos` placeholder entries and the
`<link rel="preconnect" href="https://picsum.photos">` tags in
`index.html` / `work.html`.

Order in `work.json` is the display order. The first three images appear
on the home page; the full list appears on `work.html`.
