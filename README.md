# tensorlink.io — chat app (JSX / Vite)

A local-first AI chat client for the Tensorlink peer-to-peer network. This is a
from-scratch JSX rewrite of the previous TypeScript app: same core ideas
(chats + settings live entirely in `localStorage`, and you can optionally
connect your own Tensorlink node for extra privacy), restyled to match the
tensorlink.io dashboard/landing page design system, and consolidated into far
fewer files.

## Structure

```
src/
  main.jsx      Entry point — mounts <App/> inside the StoreProvider, defaults to dark mode
  App.jsx       Shell: sidebar + chat list + header connection pill + view routing
  store.jsx     All app state (chats, messages, settings, node URL), persisted to localStorage
  api.js        Every network call: chat streaming, network history, model demand, node health
  Chat.jsx      Chat interface: model picker, message list (markdown), input box
  Home.jsx      Dashboard: intro, active-models list, network stat charts
  Settings.jsx  Personal node connection, model preferences, request-a-model, API config
  ui.jsx        Tiny shared UI primitives (card/tile classes, buttons, status dot)
  index.css     Tailwind + a handful of hand-written markdown styles for chat messages
```

That's 8 source files total, down from 11+ `.tsx` files plus a separate
`hooks/` and `services/` directory in the old app. `store.jsx` replaces
`useChats`, `useChatSettings`, `useMessages`, and `useChatList`; `api.js`
replaces `services/ApiService` and the ad hoc health-check functions that used
to live in `ActionButtons.tsx`.

## Privacy model

- Chats, messages, and preferences are stored **only** in `localStorage` —
  nothing is sent to any server except the chat request itself.
- If you connect a personal Tensorlink node (Settings → Personal Node),
  `api.js` routes chat requests to your node instead of the public API, so
  your prompts never have to leave hardware you control.
- The header's connection pill polls both the public API and your node (if
  set) every 60s and shows the current status; clicking it opens Settings.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Notes / things to double check against your live API

`api.js` was written by inferring the shape of your existing endpoints from
how the old app's `ApiService` and hooks were used (`/v1/models/available`,
`/v1/models/demand`, `/v1/models/request`, `/network-history`, `/stats`, and
an OpenAI-style streaming `/v1/chat/completions`). Since the actual service
layer wasn't migrated, **verify these endpoint paths and payload shapes
against your real backend** before relying on this in production — the
request/response parsing may need small adjustments.
