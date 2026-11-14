# Next Frontier

Run locally with `python -m http.server 8000`, then open http://localhost:8000.
The game now requires HTTP to load JSON data; opening index.html directly is no longer supported.

Edit mission settings in `data/mission.json`, stocks and indicators in `data/resources.json`, daily resource budgets in `data/flows.json`, and cards in `data/cards.json`.
JavaScript lives in `src/`; styles live in `assets/`. Images remain in `images/`.

Progress is automatically stored in localStorage on this browser. Continue mission restores the saved rules and card order. New missions replace the saved slot after confirmation. Clearing site data removes progress.

For GitHub Pages, select **Settings → Pages → Source → GitHub Actions**. Push to main or run the Publish game workflow. No deployment has been performed automatically from this workspace.

## Data contract

`mission.json` defines `version`, `totalSols`, `crew`, `solHours`, event chances (sum = 1) and `avoidConsecutive`. `resources.json` defines quantities and ordered indicators, including icon identifiers and colors. Icon drawings are supplied by the interface; supported identifiers are oxygen, water, shield, energy and food.

`flows.json` uses `amount` and `basis`: `perSol` or `perCrewEarthDay`. The latter multiplies the amount by crew size and solHours / 24. Preserve scientific notes and reference/simulated classification when editing.

`cards.json` contains unique IDs, two answers, effects in resource units, ongoing rates per sol, and later effects. Durations are whole sols. Omitting an ongoing duration means it continues indefinitely. `interface.json` holds English copy, briefing image and credit. Templates accept `{crew}`, `{totalSols}` and message-specific values such as `{sol}` and `{events}`. JSON values are data, not executable expressions.

Run `npm test` (no dependency installation needed). `src/engine.js` exposes start, answer, next and end actions over complete snapshots; the UI renders those snapshots. Saves include the data snapshot so existing missions retain their rules after an update. An incompatible save is preserved until the player confirms replacement. A new mission loads the newest data. Storage failures do not stop an ongoing game; another tab's save suspends the older view until reloaded.
