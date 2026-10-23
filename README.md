# mariyaholic.github.io

Maria's personal site: software, an astronomy project, and games. Live at https://mariyaholic.github.io.

Plain static HTML, CSS and JS. No build step, no framework, no external requests.

## Layout
- One `.html` file per page at the root. `404.html` is GitHub Pages' not-found page and uses root paths (`/css/...`) so it works at any URL.
- `css/site.css` is the one stylesheet (rev 8, "mariyaholic-98": a PC-98 style desktop in a 16-colour palette). Each top-level `<section>` in `<main>` is a window: give it `class="win"` and `data-win="FOLDER\NAME.TXT"` and CSS draws the title bar. `js/site.js` draws the desktop (a palette-cycling dither with drifting stars), plays the boot screen on a first visit, drags the home-page windows, and runs the app sketches and step sequences. With `?motion=off` or reduced motion, the desktop is still and there is no boot. Add `?boot` to a URL to replay the boot. The SOUND button in the status bar (off by default, remembered) turns on synthesized FM sound effects for windows, links, hovers on the main controls, the boot and the 404. The MUSIC button beside it (also off by default) plays DESKTOP.MID, a chip-style loop written as text in `js/site.js` and played by a small four-voice player there; it picks up on the next page at the same beat. There are no audio files. Browsers start audio only after a click or key on the page, so a page can stay silent until then.
- `fonts/` holds the subset web fonts with their OFL licence texts (see `fonts/SOURCES.md` and the Credits section on `colophon.html`).
- `img/98/` holds the pictures the pages use, each Bayer-dithered to the site palette. The originals stay in `img/`.
- `.nojekyll` tells Pages to serve the files untouched.

## Editing
1. Edit the HTML/CSS/JS directly. Preview with `python3 -m http.server 8080` and open http://127.0.0.1:8080/.
2. Commit and push. Pages redeploys from `main` (root) in a minute or two.

Pages still marked `TODO` have slots waiting for content (portrait, TickAtlas screenshot, game links, Yozora line, efficiency figures).
