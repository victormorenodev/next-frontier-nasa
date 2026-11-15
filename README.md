# Next Frontier

Run locally with `python -m http.server 8000`, then open http://localhost:8000.
The game now requires HTTP to load JSON data; opening index.html directly is no longer supported.

Edit mission settings in `data/mission.json`, stocks and indicators in `data/resources.json`, daily resource budgets in `data/flows.json`, cards in `data/cards.json`, and category chances in `data/categories.json`.
JavaScript lives in `src/`; styles live in `assets/`. Images remain in `images/`.

Progress is automatically stored in localStorage on this browser. Continue mission restores the saved rules and card order. New missions replace the saved slot after confirmation. Clearing site data removes progress.

For GitHub Pages, select **Settings → Pages → Source → GitHub Actions**. Push to main or run the Publish game workflow. No deployment has been performed automatically from this workspace.

## Data contract

`mission.json` defines `version`, `totalSols`, `crew`, `solHours`, event chances (sum = 1). `resources.json` defines quantities and ordered indicators, including icon identifiers and colors. Icon drawings are supplied by the interface; supported identifiers are oxygen, water, shield, energy and food.

`flows.json` uses `amount` and `basis`: `perSol` or `perCrewEarthDay`. The latter multiplies the amount by crew size and solHours / 24. Preserve scientific notes and reference/simulated classification when editing.

`cards.json` contains unique IDs, two answers, effects in resource units, ongoing rates per sol, and later effects. Durations are whole sols. Omitting an ongoing duration means it continues indefinitely. `interface.json` holds English copy, briefing image and credit. Templates accept `{crew}`, `{totalSols}` and message-specific values such as `{sol}` and `{events}`. JSON values are data, not executable expressions.

Run `npm test` (no dependency installation needed). `src/engine.js` exposes start, answer, next and end actions over complete snapshots; the UI renders those snapshots. Saves include the data snapshot so existing missions retain their rules after an update. An incompatible save is preserved until the player confirms replacement. A new mission loads the newest data. Storage failures do not stop an ongoing game; another tab's save suspends the older view until reloaded.


## Category-based card draws

Each event independently draws a category, then a card within that category. `data/categories.json` defines IDs, English names and `probability` values: Routine 0.35, Maintenance 0.25, Exploration 0.20, Science 0.15, Emergency 0.05. Each card has a `category` matching one category ID and its own `probability` within the category. Values are fractions from 0 to 1; categories sum to 1, and card probabilities in each category independently sum to 1 (tolerance 1e-9). Zero disables a selection, but every category must contain cards with total probability 1. A category containing one card gives that card probability 1.

Draws are with replacement: the same card may appear consecutively, even twice in the same sol. There are no balanced shuffled rounds. The existing 10 mock cards were assigned to categories with equal probability inside each category; scientific correctness/balance of these test events is unchanged. Cards are still preselected for the full mission and saved in order. Old saves without categories remain playable with their original sequence; starting a new mission uses the latest JSONs.


Each card answer (`left` and `right`) may include `description`: a short English explanation shown on the back above resource effects, only after choosing that answer. All current answers start with `"description": ""`. Missing, empty or whitespace-only descriptions display nothing and reserve no space. The two choices have independent descriptions; keep them brief for small screens. Existing saved cards without this field remain supported.

Cards also support `imageCaption`, a brief English description of what the picture actually shows. It appears immediately below the image. Current mock cards share the same image, so they share an accurate caption. The report-tablet button is temporarily hidden.


## Mission difficulty

After the briefing, choose **Easy — For scientists ages 7–10** or **Hard — For astronauts ages 11+**. Easy displays every resource value as an integer from 0 to 100 (`round(amount / max * 100)`), without a percent sign or physical unit. Forecasts and floating changes use the difference between rounded before/after values, so the displayed numbers stay consistent. Fractions remain in the simulation and accumulate without loss. The simulation, stock limits and scientific coefficients remain in physical units internally. Hard preserves physical units and allows all cards.

`mission.json` configures the allowed card difficulty tags for each mode. Easy permits only easy/medium cards. The category/card distribution is filtered before drawing, and eligible probabilities are renormalized within each category. Categories with no eligible cards are removed and the remaining category chances are renormalized. A mode with no eligible positive-probability cards is invalid. `mission.difficulty` persists with the save; existing saves without a mode resume in Hard. Starting a new mission opens the selector again.
