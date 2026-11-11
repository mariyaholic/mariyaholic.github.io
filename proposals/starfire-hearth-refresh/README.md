# Starfire Hearth website refresh proposal

**Status:** local proposal for owner review. The public portfolio page remains unchanged.

## Updated direction

Lead with the current live web build's 3D colony scene. The former proposal used M1 title and colony screenshots from earlier milestone documentation and described the hosted game as still loading. Both are stale: on 26 October 2026, the live build was navigated into its immersive colony view, where terrain, water, trees, the ark, settlement buildings, hex borders and in-game controls were visible.

Keep the mariyaholic-98 window frame and restrained palette. Replace the concept-art hero with a real 3D scene, give it a direct link to the live build, and use concise status copy that identifies the game as in development. Avoid unsupported completion, mobile-device or owner-playtest claims.

## Evidence

- Live game: <https://mariyaholic.github.io/starfire_hearth_v2/>
- Source repository: <https://github.com/mariyaholic/starfire_hearth_v2>
- Latest inspected CI run: [run 40157308704](https://github.com/mariyaholic/starfire_hearth_v2/actions/runs/40157308704), commit `c280f71c069bd6a159c6ae1908e3e448b9819d92`.
- Its `screens` artifact is 54.2 MB with SHA-256 `451d6076e790e0e9ba407b391e0c69697ba67d0290a66eb88d437392343c245b`.
- The running site was visually checked in its immersive 3D colony view. The scene was directly visible in the browser; a frozen screenshot file is not included in this proposal yet.

## Screenshot status

The supplied `screens.zip` matches the `screens` artifact for run `40157308704` by SHA-256. It contains PC and phone UI audit captures, but it does not contain `m12_owner_revalidation/01_compact_city_default.png` or `05_spaced_system.png`, and it has no frozen 3D colony capture. The `pc_100/30_game_colony.png` and `pc_100/32_game_system.png` captures show a blank planner viewport, so they are not presented as 3D proof.

Three real desktop captures are now included in the proposal gallery:

- `snapshots/pc_100-38_game_galaxy.png` — Galaxy map and strategic controls.
- `snapshots/pc_100-34_game_research.png` — Physics, Society, and Engineering research cards.
- `snapshots/pc_100-39_game_event.png` — Labor Strike event, narrative art, and response choices.

The current hosted build remains embedded at its normal entry point. I navigated it through **Campaign → First Light → Play → Begin**, dismissed the **First orders** overlay with **Esc**, and confirmed the colony scene rendered in 3D. The embedded preview does not open directly into that scene.

## Scope

This is a proposal only. It does not edit `hearth.html`, the portfolio catalogue, the game repository or the published site.
