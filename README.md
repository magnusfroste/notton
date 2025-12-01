# Notton AI ✨

**Pure magic for your productivity.**

A cloud-based, AI-powered note-taking app inspired by Apple Notes. Organize, search, and chat with your content—being productive has never been easier.

🌐 **Live App**: [notton.app](https://notton.app)

---

## Features

### 📝 Rich Text Editing
- Full Markdown support with headers, bold, italic, lists, and checklists
- Clean, distraction-free writing experience
- Real-time autosave

### 📁 Smart Organization
- Create custom folders to organize your notes
- Drag-and-drop notes between folders
- "All Notes" and "Recently Deleted" system folders
- Restore deleted notes with ease

### 🤖 AI Sidepanel Assistant
The AI assistant lives in a slide-out panel and helps with:
- **Improve Writing** — Enhance grammar, clarity, and flow
- **Summarize** — Get concise bullet-point summaries
- **Extract Tasks** — Pull action items into a checklist
- **Generate Ideas** — Brainstorm related concepts
- **Consolidate Notes** — Merge multiple notes into one master document
- **Compare Notes** — Identify similarities and differences
- **Find Patterns** — Discover trends across your notes
- **Web Search** — Search the web and create notes from results

### 🔍 AI-Powered Search
Find anything instantly with semantic search across all your notes.

### 📱 Cross-Platform
- Progressive Web App (PWA) — install on any device
- Responsive design for desktop, tablet, and mobile
- Offline support with automatic sync when back online

### 🎨 Themes
- Dark and light mode
- Clean, modern UI with smooth animations

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase (Auth, Database, Edge Functions) |
| AI | OpenAI / xAI (configurable) |
| State | React Query, Context API |
| DnD | @dnd-kit |

---

## Getting Started

### Prerequisites
- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- A Supabase project

### Local Development

```sh
# Clone the repository
git clone https://github.com/magnusfroste/notton.git
cd notton

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

---

## Project Structure

```
src/
├── components/       # React components
│   ├── notes/        # Note editor, list, folder sidebar
│   ├── admin/        # Admin panel components
│   └── ui/           # shadcn/ui components
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── integrations/     # Supabase client & types
├── pages/            # Route pages
└── lib/              # Utilities

supabase/
├── functions/        # Edge Functions (AI chat, admin)
└── config.toml       # Supabase configuration
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | Create new note |
| `↑ / ↓` | Navigate notes list |

---

## Deployment

The app is deployed via [Lovable](https://lovable.dev) with a custom domain at [notton.app](https://notton.app).

To deploy your own instance:
1. Push to the connected GitHub repository
2. Lovable auto-deploys on push
3. Or use `npm run build` and deploy the `dist/` folder to any static host

---

## License

MIT

---

<p align="center">
  <strong>Notton AI</strong> — The new kid on the block 🚀
</p>
