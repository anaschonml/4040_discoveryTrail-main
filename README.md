# 4040_discoveryTrail

Discovery Trail Web App for the Media Lab's 40th Anniversary.

## How it works

1. Open the app on your phone and join one of three teams (Red, Orange, Yellow).
2. Walk through the space and scan QR codes on object pages.
3. Your team earns **one point per object page** the first time any teammate visits it.
4. Team name, player count, and points are shown in the header on every page.

## Local development

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm start
```

Open **http://localhost:3000** in your browser. Do not open HTML files directly (`file://`) — API calls require the dev server.

To reset scores during testing, stop the server and edit or delete `data/state.json`.

## Adding object pages

1. Create a new HTML page in `public/` (e.g. `public/object_example_3.html`) with `data-page-id="object_example_3"` on the `<body>` tag.
2. Include the shared scripts: `js/session.js`, `js/client.js`, `js/object.js`.
3. Add the page ID to the allowlist in `lib/state.js` (`PAGE_IDS` array).

## Admin

Open **http://localhost:3000/admin.html** for a live table of team names, player counts, points, and visited page IDs. Refreshes every 5 seconds.

## API

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/teams` | GET | — | All teams with pop and points |
| `/api/admin/teams` | GET | — | Full team stats including visited page IDs |
| `/api/join` | POST | `{ playerId, teamName }` | Join a team (idempotent per player) |
| `/api/visit` | POST | `{ playerId, pageId }` | Record a page visit; award point if new for team |

Player IDs are UUIDs stored in the browser's `localStorage`. Team selection is also stored locally and validated on the server.

## Deployment

Run `node server.js` on a host that can serve static files and persist `data/state.json`. Set the `PORT` environment variable if needed.

For production at scale, replace the JSON file store in `lib/state.js` with a database or KV store (e.g. Vercel KV, Supabase).
