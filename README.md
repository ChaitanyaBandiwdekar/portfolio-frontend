# portfolio

Personal portfolio. Dark, terminal-native, deliberately over-engineered in the fun places:
a cursor-tracking three.js robot, a seeded curl-noise particle field, and a terminal that
streams from a RAG backend over SSE.

## develop

    npm install
    npm run dev

## configure

| env var             | effect                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `VITE_CHAT_API_URL` | chat backend base URL. Unset → built-in mock client (fully demoable) |

Chat backend contract: see `plans/00-overview.md` → "Chat backend API contract".

## content

All personal content lives in `src/data/*.ts` — search for `TODO(owner)`.

## deploy

Netlify. `netlify.toml` is configured; connect the repo, done. Set `VITE_CHAT_API_URL`
in Netlify env settings when the backend exists.
