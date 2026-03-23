# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Control is a project/task management desktop app built with React + Electron + Supabase. Korean UI throughout. App ID: `com.ninebridge.projectcontrol`.

## Commands

- `npm run dev` — Vite dev server at http://localhost:5173
- `npm run build` — Build React app to `dist/`
- `npm run electron:dev` — Build + run Electron app
- `npm run electron:build` — Build macOS DMG
- `npm run electron:build:win` — Build Windows NSIS installer

No test framework is configured.

## Tech Stack

- **React 18** (JavaScript/JSX, no TypeScript)
- **Vite 5** build tool
- **Electron 33** desktop shell (1200×800 window, tray icon on close)
- **Supabase** for auth, database, and user management
- **lucide-react** for icons
- **electron-store** for local data persistence
- **Pretendard** font (Korean-optimized, loaded via CDN)
- No routing library, no state management library, no UI component library

## Architecture

### State Management
All application state lives in `src/App.jsx` via `useState`/`useCallback`. Data and handlers are prop-drilled to child components. No real-time subscriptions — data is refetched from Supabase after each mutation.

### View Switching
`activeView` state in App.jsx controls which view renders (Dashboard, ProjectDetail, ArchiveView). No router.

### Component Structure
```
App.jsx              — Central state, all CRUD handlers, data fetching
├── Auth.jsx         — Login/signup with invite code support
├── Sidebar.jsx      — Navigation, project list with drag-and-drop reordering
├── Dashboard.jsx    — Stats, project progress circles, memo list, quick add
├── ProjectDetail.jsx — Project view with memos and info fields
├── ArchiveView.jsx  — Restore or permanently delete archived items
├── SettingsPanel.jsx — User settings, admin panel (user approval, invite codes)
└── Modals: ProjectModal, CategoryModal, MemoModal, MemoViewModal, InfoModal
```

### Supabase Data Model
- **projects** — name, description, color, category_id, archived, sort_order
- **project_categories** — name, sort_order
- **memos** — project_id, title, priority (0-3), archived, started_at
- **memo_details** — memo_id, content, completed, completed_at (checklist items)
- **project_infos** — project_id, type, label, value (custom metadata)
- **user_profiles** — email, role (user/admin), approved, invite_code
- **invite_codes** — code, created_by, active

All tables use `user_id` for row-level filtering.

### Auth Flow
Supabase email/password auth. New users either auto-approve with a valid invite code or wait for admin approval. Admin panel in SettingsPanel manages approvals and invite code generation.

### Electron
- `electron/main.js` — Main process, fixed 1200×800 window, tray icon, IPC handlers (`load-data`, `save-data`, `open-style-guide`)
- `electron/preload.js` — Context-isolated IPC bridge
- Production loads `dist/index.html`; dev loads localhost:5173

## Styling

Custom CSS only (no component library). All design tokens are CSS variables defined in `src/style.css`. See `STYLE_GUIDE.md` for the complete variable reference including colors, typography, and layout dimensions.

Key layout values: sidebar 310px, content area 890px (35px padding each side), header 85px.
