# Product Requirements Document (PRD) - Notton

## 1. Overview

**Product Name:** Notton  
**Tagline:** Notes that think with you  
**Description:** Notton is an AI-powered note-taking application inspired by Apple Notes, enhanced with an intelligent AI sidekick. It enables users to create, organize, edit, and interact with notes using rich text or Markdown editors. The AI assistant provides contextual help such as summarizing content, extracting tasks, improving writing, consolidating multiple notes, and more—all while supporting offline usage, responsive design, and seamless synchronization.

**Target Users:**
- Individuals managing personal knowledge (students, writers, researchers)
- Professionals handling project notes, meetings, and tasks
- Teams needing quick note consolidation and AI insights (early admin features for scaling)

**Key Value Propositions:**
- Familiar Notes-like interface with AI superpowers
- Dual editors: Rich text (Tiptap) and Markdown (CodeMirror)
- Offline-first with automatic sync
- Drag-and-drop organization, multi-select actions
- Streaming AI responses for single notes, folders, or selections

**Current Version:** MVP (v0.0.0) - Core notes + AI features implemented

## 2. Current Features

### 2.1 Authentication & User Management
- **Email/Password Auth:** Sign-up with display name, sign-in, automatic redirect to dashboard on success.
- **Session Management:** Supabase Auth with real-time state changes.
- **Protected Routes:** Unauthenticated users redirected to `/auth`; logged-in to `/dashboard`.
- **Profile Page (`/profile`):**
  - Edit display name and avatar (upload to Supabase Storage).
  - View account creation date.
  - Preferences card: Editor mode (rich/markdown), line numbers, sort options (updated/created/title, asc/desc), font size, display density (comfortable/cozy/compact), list width (narrow/default/wide).
  - Sign-out functionality.

### 2.2 Notes Management (Dashboard `/dashboard`)
- **Three-Pane Layout (Desktop):** Folders sidebar (left), Notes list (center), Editor (right).
- **Mobile Stacked Views:** Sidebar → List → Editor with back navigation.
- **Folders:**
  - System: "All Notes", "Recently Deleted" (soft delete with restore).
  - User-created: CRUD (create/rename/delete), icons, note counts.
  - Drag notes to folders.
- **Notes List:**
  - Search by title/content.
  - Sorting: By updated/created/title (asc/desc).
  - Display density/list width preferences.
  - Multi-select mode: Bulk delete, move, AI actions.
  - Context menu: Duplicate, move, delete.
  - Import Markdown files (.md).
  - Keyboard: Cmd/Ctrl+N new note, arrow keys navigate.
- **Editor (`NoteEditor`):**
  - Title editing (debounced save).
  - Rich text: Tiptap (bold/italic/underline/H1/H2/lists/tasklists/blockquote/codeblock/link/hrule).
  - Markdown mode: CodeMirror (syntax highlighting, line numbers toggle).
  - Toggle modes (Cmd/Ctrl+/).
  - Toolbar: Formatting (rich only), AI button, export (MD/PDF), move folder, delete, more (info/duplicate/print/copy).
  - Trash view: Read-only, restore/delete forever.
  - Word/char count, timestamps.
  - Auto-save (debounced 500ms).

### 2.3 AI Chat Panel (`AIChatPanel`)
- **Slide-out Panel:** Trigger from editor (single note), folder menu (folder notes), list multi-select.
- **Context-Aware:** Single note, multiple notes/folder, shows context badge.
- **Quick Actions:**
  | Single Note | Multi-Note |
  |-------------|------------|
  | Improve writing | Consolidate |
  | Summarize | Compare |
  | Extract tasks | Find patterns |
  | Generate ideas | Summary |
- **Free Chat:** Custom prompts on note(s) context.
- **Streaming Responses:** Server-Sent Events from Supabase Edge Function (`ai-chat`).
- **Actions:** Copy response, Apply to note (single), Create new note.
- **Code Blocks:** Syntax highlighting + copy button.

### 2.4 Admin Panel (`/admin`)
- **Admin-Only Access:** Edge function check (`check-admin`).
- **AI Config Card:** Manage AI secrets (update via `update-ai-secret` function).
- **App Settings Card:** Global app configurations.
- **Future:** Plans/pricing, user management (placeholders).

### 2.5 Offline Support (`useOfflineCache`)
- **IndexedDB:** Cache notes/folders, pending sync queue.
- **Optimistic Updates:** Local-first mutations with rollback.
- **Auto-Sync:** On reconnect, sync pending changes.
- **OfflineIndicator:** Shows status, manual sync button.

### 2.6 UI/UX & Accessibility
- **Responsive:** Mobile/desktop layouts.
- **Themes:** Dark/light/system (Next Themes).
- **Components:** shadcn/ui (full suite: buttons, cards, dialogs, dropdowns, etc.).
- **PWA:** Manifest, icons, offline capable.
- **Keyboard Shortcuts:** Editor mode toggle, new note, navigation.
- **Loading States:** Spinners, skeletons.
- **Toasts:** Sonner for feedback.

### 2.7 Landing Page (`/`)
- Hero with CTA to auth, features preview, theme toggle.

## 3. User Flows

### 3.1 Onboarding
1. Visit `/` → "Start free" → `/auth` → Sign up → Auto-redirect `/dashboard`.
2. Existing user → Sign in → `/dashboard`.

### 3.2 Core Notes Workflow
1. Dashboard loads folders/notes.
2. Select folder → Filtered list.
3. Click note → Editor opens.
4. Edit title/content → Auto-save.
5. AI button → Chat panel with note context.
6. Quick action (e.g., "Summarize") → Streaming response → Copy/Apply.
7. Export/print as needed.
8. Drag to folder or multi-select → Bulk actions.

### 3.3 Offline Flow
1. Go offline → Use cached data.
2. Edit/create → Optimistic + queue pending.
3. Reconnect → Auto-sync → Toast confirmation.

### 3.4 Admin Flow
1. Admin user → Sidebar "Admin Panel" → `/admin`.
2. Update AI secrets/app settings.

## 4. Backlog

Prioritized by impact/effort (High/Med/Low).

### 4.1 High Priority (Next Sprint)
- [ ] Full-text search (Supabase pgvector or notes content indexing).
- [ ] Note sharing/links (public read-only views).
- [ ] Export to PDF with better formatting (preserve styles).
- [ ] Keyboard shortcuts global menu.
- [ ] Mobile swipe gestures (delete/archive).

### 4.2 Medium Priority
- [ ] User management in admin (list/ban/search users).
- [ ] Pricing plans (Supabase Stripe integration).
- [ ] Import from Evernote/Notion/Apple Notes.
- [ ] Note templates (meeting, task list).
- [ ] Analytics dashboard (usage metrics).
- [ ] Voice-to-text input.

### 4.3 Low Priority / Future
- [ ] Real-time collaboration (Supabase Realtime).
- [ ] Note history/versions.
- [ ] Custom AI models (user API keys).
- [ ] Browser extensions.
- [ ] Desktop app (Tauri/Electron).
- [ ] Integrations (Slack, Gmail).

**Non-Technical:**
- [ ] Usage analytics for product iteration.
- [ ] Beta user feedback loop.
- [ ] Marketing site (notton.app).

## 5. Tech Stack

### 5.1 Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **Router:** React Router 6
- **State:** TanStack Query (data fetching/caching), React Context (auth)
- **UI:** shadcn/ui + Tailwind CSS + Tailwind Merge + Class Variance Authority
- **Editor:** Tiptap (rich), @uiw/react-codemirror (markdown)
- **AI:** Custom hook with Supabase Edge Functions (SSE streaming)
- **Themes:** next-themes
- **Other:** @dnd-kit (drag-drop), lucide-react (icons), sonner (toasts), date-fns, react-to-pdf

### 5.2 Backend / Data
- **Database/Auth/Storage:** Supabase (Postgres, Realtime, Edge Functions)
- **Migrations:** 6x SQL (notes, folders, profiles, preferences)
- **Functions:** ai-chat (OpenAI), check-admin, check-secrets, update-ai-secret

### 5.3 Offline / PWA
- **Cache:** IndexedDB (custom hooks)
- **PWA:** vite-plugin-pwa

### 5.4 Dev Tools
- **Linting:** ESLint 9
- **Types:** TypeScript 5.8

**Deployment:** Vercel/Netlify (frontend), Supabase (backend).

---

**Version History:**  
v1.0 - 2025-12-01 (Initial PRD based on MVP codebase)