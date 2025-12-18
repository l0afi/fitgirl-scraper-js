# fitgirl-scraper-js

Automatically pull every game offered on FitGirl and save them to a JSON file.

## Features
- Scrapes all current game entries from FitGirl.
- Outputs clean, structured JSON (e.g., title, links, size, release info if available).
- Designed to run on-demand or via cron/CI.

## Prerequisites
- Node.js 18+ (recommended) and npm (or pnpm/yarn).
- Network access to FitGirl.

## Setup
```bash
git clone https://github.com/l0afi/fitgirl-scraper-js.git
cd fitgirl-scraper-js
npm install
```

## Usage
Run the scraper:
```bash
npm run start
# or
node index.js
```

### Configuration (if applicable)
- Environment variables (example):
  - `OUTPUT_PATH`: where to write the JSON file (default: `./fitgirl-games.json`)
  - `CONCURRENCY`: number of parallel fetches (default: 4–8 is typical)
  - `TIMEOUT_MS`: per-request timeout
- CLI flags (example):
  - `--output ./data/fitgirl-games.json`
  - `--concurrency 6`
  - `--pretty` (if you support pretty-print)

(Adjust to the actual options your script supports.)

## Output
- A JSON file (default: `fitgirl-games.json`) containing an array of game entries, e.g.:
```json
[
  {
    "title": "Example Game",
    "pageUrl": "https://fitgirl-repacks.site/example-game/",
    "size": "12.3 GB",
    "posted": "2024-12-01",
    "links": ["..."]
  }
]
```

## Development
- Lint (if configured): `npm run lint`
- Tests (if any): `npm test`

## Scheduling
- You can run this via cron or CI to keep the JSON fresh, e.g.:
  - `0 */6 * * * node index.js --output /var/data/fitgirl-games.json`

## Notes
- Be mindful of request rate to avoid hammering the site; tune `CONCURRENCY` and add small delays if needed.
- If the site layout changes, selectors may need updating.

## License
MIT (update if different).

## Author
[@l0afi](https://github.com/l0afi)
