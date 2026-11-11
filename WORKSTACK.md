# Workstack

## Open

- None for the local proposal. Owner review of the proposal is the next step.

## Verification

- Extracted three captures from the user-supplied `screens.zip` after confirming its SHA-256 matches the run 40157308704 artifact: galaxy, research, and event screens. The archive has no frozen 3D colony image; colony/system screenshots contain a blank planner viewport and are excluded from the gallery.
- Static source review completed for the local proposal. Browser render verification of the proposal page was done over a localhost HTTP server (the browser blocks `file://`): the three captures load, the page has no horizontal overflow, and the live-game embed was fixed from 155px to 483px wide at a 1024px viewport by stacking the Before/After grid below 1180px. In a hidden browser tab, navigated the hosted game through Campaign → First Light → Play → Begin, dismissed “First orders” with Esc, and visually confirmed the 3D colony scene rendered.

## Scope

- Local proposal only. `hearth.html`, the public portfolio catalogue, the game repository, and the published site remain unchanged.
