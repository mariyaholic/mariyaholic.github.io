# mariyaholic.github.io

Hello! This is my personal site: software, an astronomy project, and games. It is live at https://mariyaholic.github.io. I hope you enjoy looking around as much as I enjoy keeping it.

It is plain static HTML, CSS and JS. There is no build step and no framework. The only external requests are the YouTube player in the home page's FLUORITE.EYE window and, once it is set up, the paper click counter (`tools/click-counter/`, paper pages only). I like keeping it this simple.

## Layout
- One `.html` file per page at the root. `404.html` is GitHub Pages' not-found page and uses root paths (`/css/...`) so it works at any URL.
- `css/site.css` is the one stylesheet (rev 8, "mariyaholic-98": a PC-98 style desktop in a 16-colour palette). Each top-level `<section>` in `<main>` is a window: give it `class="win"` and `data-win="FOLDER\NAME.TXT"` and CSS draws the title bar. `js/site.js` draws the desktop, a palette-cycling dither with drifting stars. It plays the boot screen on a first visit, drags the home-page windows, and runs the app sketches and step sequences. The status-bar buttons there are links, so `index.html#w-vivy` opens with that window in front. With `?motion=off` or reduced motion, the desktop is still and there is no boot. Add `?boot` to a URL to replay the boot. The SOUND button in the status bar turns on synthesized FM sound effects for windows, links, hovers on the main controls, the boot and the 404. It is off by default, and the site remembers your choice. The MUSIC button beside it plays DESKTOP.MID, a chip-style loop written as text in `js/site.js` and played by a small four-voice player there. It is also off by default, and it picks up on the next page at the same beat. There are no audio files. Browsers start audio only after a click or key on the page, so a page can stay silent until then.
- `fonts/` holds the subset web fonts with their OFL licence texts (see `fonts/SOURCES.md` and the Credits section on `colophon.html`).
- `img/98/` holds the pictures the pages use, each Bayer-dithered to the site palette. The originals stay in `img/`.
- `.nojekyll` tells Pages to serve the files untouched.

## Editing
Every change after the initial commit goes through a branch and a pull request that I merge myself. Nothing is pushed straight to `main`. I like it that way.
1. Branch off `main` (e.g. `site/fix-arcade-links`).
2. Edit the HTML/CSS/JS directly. Preview with `python3 -m http.server 8080` and open http://127.0.0.1:8080/.
3. Commit, push the branch, open a PR against `main`.
4. Once I merge it, Pages redeploys from `main` (root) in a minute or two.

Pages still marked `TODO` have slots waiting for content (portrait, TickAtlas screenshot, game links, Yozora line, efficiency figures). I am fond of this little site, and I hope it shows.

Thank you for stopping by. ♡
