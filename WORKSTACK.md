# Workstack

## Open

- Agent and owner review of the `feat/serigraph-gallery` pull request against `main`.
- Owner review of `proposals/starfire-hearth-refresh/` remains open from PR #9.

## Verification

- `node --check js/site.js` exited 0.
- Headless Chromium (Playwright) verification against a local HTTP server passed for the 8 active `docs/` pages and both pilot guides (`yozora`, `mh-ticker`): HTTP 200, expected `h1`, `css/plain.css` loaded, `css/site.css` and `docs/docs.css` absent, zero console errors, zero page errors, zero local HTTP >= 400 responses, every in-page anchor resolves, every internal link returns 200, no horizontal overflow at 1280 px and 375 px, and the hub prints no "Older layout" marker.
- Full-page headless screenshots of the 7 converted pages were taken before and after the change, plus an after screenshot of the hub; they are attached to the pull request.

## Scope

- `docs/formal-look-all-guides` moves the 7 remaining guides (`docs/omoi/`, `docs/sitekit/`, `docs/csv-viewer/`, `docs/parquet-viewer/`, `docs/ad_astra/`, `docs/starfire_hearth_v2/` and `docs/capture-plan.html`) from the main-site look to the document look (`css/plain.css`, `theme-docs`), with the text rewritten to the `docs/WRITING.md` language rules and the facts blocks completed from the source repositories (licence checked on each).
- The branch removes `docs/docs.css` (no page references it now), removes the "Older layout" markers from `docs/index.html`, updates the page-status table in `docs/WRITING.md`, and updates this `WORKSTACK.md`.
