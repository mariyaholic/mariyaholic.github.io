# mariyaholic.github.io

Maria's personal site: software, an astronomy project, and games. Live at https://mariyaholic.github.io.

Plain static HTML, CSS and JS. No build step, no framework, no external requests.

## Layout
- One `.html` file per page at the root. `404.html` is GitHub Pages' not-found page and uses root paths (`/css/...`) so it works at any URL.
- `css/site.css` is the one stylesheet for both views (light and night). `js/site.js` handles the view/motion toggles, menu and animations.
- `fonts/` holds the subset web fonts with their OFL licence texts (see `fonts/SOURCES.md` and the Credits section on `colophon.html`).
- `img/` holds the art, shipped as-is.
- `.nojekyll` tells Pages to serve the files untouched.

## Editing
All changes after the initial commit go through a branch and a pull request that Maria merges. Nothing is pushed straight to `main`.
1. Branch off `main` (e.g. `site/fix-arcade-links`).
2. Edit the HTML/CSS/JS directly. Preview with `python3 -m http.server 8080` and open http://127.0.0.1:8080/.
3. Commit, push the branch, open a PR against `main`.
4. Once Maria merges it, Pages redeploys from `main` (root) in a minute or two.

Pages still marked `TODO` have slots waiting for content (portrait, TickAtlas screenshot, game links, Yozora line, efficiency figures).
