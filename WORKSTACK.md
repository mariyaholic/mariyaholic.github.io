# Workstack

## Open

- Agent and owner review of the `feat/serigraph-gallery` pull request against `main`.
- Owner review of `proposals/starfire-hearth-refresh/` remains open from PR #9.

## Verification

- `node --check js/site.js` exited 0.
- Python link and navigation audit across all 36 non-gallery HTML files confirmed 30 active site pages (`404.html`, 16 root pages, 2 `docs/*.html`, 10 `docs/*/index.html`, and `proposals/starfire-hearth-refresh/index.html`) include `Gallery` in `<nav class="site-nav">` with resolved targets; the 6 legacy pages under `studies/` remain unchanged.
- `gallery/` contains static build outputs (`index.html`, `favicon.svg`, `favicon-32.png`, `assets/`, `fonts/JetBrainsMono-OFL.txt`, and 76 `.webp` files under `gallery/posters/`) with `<meta name="robots" content="noindex,nofollow">`.
- Headless Chromium verification against a local HTTP server passed with exit code 0: zero console errors, zero page errors, zero local HTTP >= 400 responses, zero non-YouTube external requests, zero broken images across `index.html`, `works.html`, `sitemap.html`, `colophon.html`, and `gallery/` (`38` initial visible plate images decoded), working `Darkroom` theme toggle (`data-theme="dark"`), `/` search focus, `Wave 1 (14)` filter tab (`14` cards), `Loupe 1.5x`, `Fit Frame`, `Compare V1 & V2` (`2` images), `Escape` close, and zero horizontal overflow at `1280x800` and `375x812`.
- Prior `imagegen/gallery` source suite (`npm run typecheck`, `npm run lint`, `vitest run` 19/19 across 3 files, `npm run build` reporting 37 active series with 72 active plates, 2 queued, and 4 archive studies) exited 0 before copying `dist/` into `gallery/`.

## Scope

- `feat/serigraph-gallery` adds `gallery/`, `img/gallery.png`, `img/98/gallery.png`, `.ico.art` in `css/site.css`, `Gallery` nav links across the 30 active pages, gallery entries on `index.html`, `works.html`, `sitemap.html`, and `colophon.html`, and this `WORKSTACK.md` update.
- `main` has not been pushed to directly; `studies/` remains unchanged.
