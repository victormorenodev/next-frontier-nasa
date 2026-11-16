# Mission: Perseverance

A card-based decision game set on a Martian base, with four astronauts and a mission lasting **25 sols on Easy or 30 on Hard**. The player takes the role of captain. The game uses simple English for players aged 7–12.

Documentation checked against the code and JSON files on **November 15, 2026**. Research and historical models are recorded in [docs/RESEARCH.md](docs/RESEARCH.md); they do not define the current rules.

## Run

From the repository root:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000/**. The game uses native JavaScript modules and fetches JSON files: HTTP is required, and `file://` does not work. No framework, npm dependencies, or build step is required to play.

## Play

The menu contains **Start New Mission**, **Continue mission**, **Glossary**, and a sound control (Credits is hidden), with no exit button. Continue is disabled when the browser has no valid mission in progress.

Start New Mission opens the briefing with a credited NASA image. A button, swipe, or arrow keys lead to the **Welcome, Captain!** selection screen. Swipe left for Operation Steins or right for Operation Gate. Buttons and arrow keys also work. The faster-consumption selector has been removed; new missions use normal consumption.

| Mission | Internal mode | Interface label | Starting resources | Eligible cards |
| --- | --- | --- | ---: | ---: |
| Operation Steins | Easy | Ages 7–10 | 75% of capacity | 27 (easy/medium) |
| Operation Gate | Hard | Ages 11+ | 50% of capacity | 31 (easy/medium/hard) |

Each sol has one card (80%) or two (20%). Answer using buttons, swipes, or arrow keys; the back shows the choice, an optional explanation, immediate effects, and **Source:** when a reference is available. Daily effects are applied once, after the last card of the sol. Cards can reappear, but the same ID never appears twice in a row, including across sols. Complete 25 sols on Easy or 30 on Hard to win; any internal resource reaching zero causes **Mission Failed**, taking priority over victory.

## Resources and consumption

Internal physical values are not rounded. Shield is an abstract measure of astronaut protection, from 0 to 100 points, with no equivalence to radiation dose or a guaranteed percentage of radiation blocked.

| Resource | Maximum | Easy start | Hard start | Normal loss per sol (entire base) |
| --- | ---: | ---: | ---: | ---: |
| Oxygen Level | 200 kg | 150 kg | 100 kg | 3.5 kg |
| Water Stock | 1900 L | 1425 L | 950 L | 10 L |
| Radiation Shield | 100 points | 75 | 50 | none |
| Energy Supply | 1480 kWh | 1110 kWh | 740 kWh | 5 kWh |
| Food Stock | 235 kg dry food | 176.25 kg | 117.5 kg | 2.6 kg |

There is no automatic production to offset these losses. Cards apply additional changes in resource units and Shield points. These values are authored game-balance parameters, not scientific specifications for a real base.

Easy displays resource stocks as integers from 0 to 100 without units. Water and oxygen appear together as **Life Support**, with a health-cross icon: `round(100 × min(oxygen / oxygen.max, water / water.max))`. Their stocks remain separate internally. Hard shows all five indicators with physical units; **Shield displays % in both modes**, with an astronaut inside a shield icon. A displayed zero caused only by rounding does not end the mission.

Hovering over or focusing an indicator opens its details; on touch screens, hold or slide to show them and release to close. Life Support shows only the combined value and its forecast, without separate water/oxygen numbers. On the card back, “Changes water”/“Changes oxygen” identifies each component without adding those changes as if they were a combined delta.

Changes animate for 1.4 seconds; the transition to a new sol includes a background light effect lasting 600 ms, respecting reduced-motion settings. There is no effects panel below the cards. The report tablet remains implemented with its button hidden.

## Cards, images, and probabilities

The catalog combines **14 cards from Página1 and 17 from Página2**. Repeated IDs 5/9/11 represent distinct events: the Página1 versions use `page1-5`, `page1-9`, and `page1-11`. `imageId` preserves the number used for the image. There are **28 distinct images for the 31 events**, all available in the current catalog.

| Category | Cards | Base probability |
| --- | ---: | ---: |
| Routine | 9 | 9/31 ≈ 29.03% |
| Maintenance | 9 | 9/31 ≈ 29.03% |
| Exploration | 1 | 1/31 ≈ 3.23% |
| Science | 5 | 5/31 ≈ 16.13% |
| Emergency | 7 | 7/31 ≈ 22.58% |

A category is drawn first, then a card, with equal chances within each category. On Easy, Hard cards are excluded and the remaining weights are normalized; base category weights come from the full catalog. Saved missions retain their original weights.

Images are resolved by `imageId` (or ID), trying `.webp`, `.jpg`, `.png`, and `.jpeg`, prioritizing WebP and stable URLs for caching. Missing or invalid images display a placeholder; the loader retries every 15 seconds while the card front remains open. Captions end with **Image source:** and a source link, or an empty value. References on the back are independent; without a reference, the Source line is omitted.

To reimport the spreadsheets and recalculate weights:

```bash
python scripts/import_event_cards.py
python scripts/import_event_cards.py --check
```

The importer updates `data/cards.json` and `data/categories.json`. Current effects use **explicit units, not percentages of capacity**. The browser reads JSON files without running Python. [Mapping and audit](docs/CARDS.md).

## Tutorial, glossary, and audio

New missions include a tutorial about the indicators and cards: five steps on Easy and six on Hard. Radiation Shield explains radiation and astronaut protection. Next, swipes, or arrow keys advance the tutorial; Skip tutorial is available from the start. The final step continuously demonstrates card tilting and button highlighting until **Let’s play!**, without applying choices or playing the swipe sound. Continuing a mission does not repeat the tutorial.

The glossary contains **41 terms**, alphabetically ordered, available in the menu and annotated in card text with color and dotted underlines. Hover, touch, or keyboard focus shows short explanations; **answer buttons do not receive glossary annotations**. [Audit and sources](docs/GLOSSARY.md). Resource/indicator names (Life Support, Oxygen, and Radiation Shield, including their aliases) are not annotated on cards; their explanations are available in indicator details. These entries remain in the menu glossary.

Music and ambient sound loop after an interaction permitted by the browser. The sound buttons in the menu and game control all sounds and remember the preference. Effects play for indicators/buttons, advancing to a new sol, and card movement (when tilting starts and whenever dragging reverses or resumes, even without confirming). Sounds use the Web Audio API for immediate playback and gapless music loops. Interruptions are recovered on subsequent interactions or when returning to the tab, respecting the sound-off preference.

## Saved progress

The `next-frontier-save` slot stores **only the latest mission in progress**, including its phase, mode, stocks, deck, and original configuration. Continue restores it without reapplying choices. Victory, failure, or quitting removes the save; the ending screen remains only for the current session. Older saves of completed missions are discarded at startup.

Opening the briefing does not replace a mission; selecting a new mode replaces the slot without confirmation. End mission still requires confirmation. Older saves retain their duration, capacities, cards, sequence, and consumption settings. Migration of legacy Shield values in g/cm² converts them proportionally to 0–100 without reapplying choices.

Progress belongs to the browser and site origin; there is no login, synchronization, or dedicated offline support. Another tab modifying the save suspends the old interface. Storage failures display a warning; invalid saves can be replaced by starting a new mission. The `next-frontier-sound` preference is independent of the mission.

## Edit and validate

| File | Contents |
| --- | --- |
| `data/mission.json` | Duration, crew, events per sol, and starting fraction per mode |
| `data/resources.json` | Maximums, units, descriptions, indicators, and legacy starting-value fallback |
| `data/cards.json`, `data/categories.json` | Content and probabilities generated by the importer |
| `data/flows.json` | Base losses/production; currently only `perSol`, `simulated` losses |
| `data/interface.json` | Interface text and briefing/ending image paths |
| `data/glossary.json` | Terms, aliases, and definitions |
| `scripts/import_event_cards.py` | Spreadsheet parsing, shortened text, and editorial captions |

Layout, gestures, calculations, icons, and audio are implemented in code. Do not insert executable formulas into JSON files. The engine still supports ongoing/scheduled effects for compatibility, but the current catalog uses only immediate effects.

```bash
npm test
python scripts/import_event_cards.py --check
git diff --check
git status --short
```

There are **ten Node test suites**, without npm dependencies, covering the engine, data, presentation, persistence, and audio. Node is a development tool, not a player requirement. Visual changes require browser checks at 320×568, 375×667, 1032×1376, and 844×390, including touch, keyboard, and reduced motion. The historical target of 15–20 minutes has not been validated with children.

## Publishing and documentation

The **Publish game** workflow (`.github/workflows/pages.yml`) tests and deploys to GitHub Pages on pushes to `main` or manual runs. The package contains `index.html`, `src/`, `data/`, `assets/`, `images/`, and `sfx/`; it can also be served by another static HTTP host. A local commit does not publish the game by itself. Do not assume deployment succeeded or include screenshots, logs, or internal documentation in the game package.

- [AGENTS.md](AGENTS.md): current agent instructions.
- [ARCHITECTURE.md](ARCHITECTURE.md): implementation and compatibility.
- [docs/CARDS.md](docs/CARDS.md): card import, images, and sources.
- [docs/GLOSSARY.md](docs/GLOSSARY.md): reviewed terms and references.
- [docs/RESEARCH.md](docs/RESEARCH.md): research and scientific limitations.
- [CLAUDE.md](CLAUDE.md): entry point without duplicated rules.
- [docs/history/](docs/history/): historical versions, not current instructions.
