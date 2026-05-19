# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

No build step exists. Start the local server with:

```bash
node server.js
# Access at http://localhost:8080
```

`server.js` is a zero-dependency Node.js HTTP server included in the repo. Do not use `python -m http.server` (Python is not available in this environment). Do not use `npx serve` (npm registry SSL certificate errors in this environment).

## Architecture

This is a **fully static site** — no framework, no bundler, no npm dependencies at runtime.

```
index.html          ← single HTML file; shell for both tabs
style.css           ← all styles; edit CSS custom properties in :root to retheme
js/app.js           ← entry point (type="module"); wires tab switching, fetches JSON, calls init functions
js/chart_history.js ← exports initHistoryChart(data); builds the Chart.js dual-dataset line chart
js/table_matches.js ← exports initMatchesTable(data); renders competition sections + match rows
data/brasileirao_history.json  ← Ceará's final position per year (1999–2026), Série A and B
data/matches_2026.json         ← all 2026 matches with scorers; update this file after each game
assets/ceara-logo.svg          ← club crest
nginx.conf          ← ready-to-use server block for VPS deployment
```

### Data flow

`app.js` fetches both JSON files in parallel on `DOMContentLoaded`, then passes each payload to its dedicated module. Neither module knows about the other.

### Chart design

`chart_history.js` splits seasons into two Chart.js datasets — Série A (solid black line) and Série B (dashed gray line) — on a single inverted Y axis (position 1 = top). `spanGaps: false` creates visible gaps for years with `null` positions, preserving data honesty.

### Match table design

`table_matches.js` groups matches by competition key (`CEARENSE`, `COPA_NE`, `COPA_BR`, `SERIE_B`) in a fixed display order. Result styling (win/draw/loss) is computed from `ceara_side` + score, not stored in the JSON.

## Updating data

**After each 2026 match:** edit `data/matches_2026.json` — fill in `home_score`, `away_score`, and the `scorers` array. The `ceara_side` field (`"home"` or `"away"`) is required for correct win/draw/loss calculation.

**After each season:** edit `data/brasileirao_history.json` — update `position` for the completed year and add the next year with `"position": null`.

## Deployment

```bash
rsync -av --exclude='.git' --exclude='server.js' ./ user@VPS_IP:/var/www/ceara/
```

Copy `nginx.conf` to `/etc/nginx/sites-available/ceara`, update the `server_name`, then run `certbot --nginx`. No app server, no restart needed after data updates.
