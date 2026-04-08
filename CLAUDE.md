# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (installs deps, generates Prisma client, runs migrations)
npm run setup

# Development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Lint
npm lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset the database
npm run db:reset
```

## Environment

Create a `.env` file with:
```
ANTHROPIC_API_KEY=your-api-key-here
```

Without a key the app runs in mock mode (`MockLanguageModel` in `src/lib/provider.ts`), returning static component code instead of calling Claude.

## Architecture

### AI generation pipeline

User messages go to `POST /api/chat` (`src/app/api/chat/route.ts`). The handler reconstructs the `VirtualFileSystem` from serialized client state, then calls `streamText` (Vercel AI SDK) with two tools:

- **`str_replace_editor`** — creates files and performs text replacements (`src/lib/tools/str-replace.ts`)
- **`file_manager`** — renames and deletes files (`src/lib/tools/file-manager.ts`)

The AI's tool calls are streamed to the client, where `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) applies them to the in-memory `VirtualFileSystem`. The file system is **never written to disk** — it lives entirely in React state and is serialized as JSON when sent to the API or persisted to the database.

### Live preview

`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders the virtual file system in a sandboxed `<iframe>`. On every `refreshTrigger` change it:

1. Calls `createImportMap` (`src/lib/transform/jsx-transformer.ts`) which transpiles each `.jsx/.tsx` file via `@babel/standalone` and creates blob URLs for each
2. Resolves third-party imports via `https://esm.sh/`
3. Creates placeholder modules for any missing local imports to avoid blank screens
4. Writes the generated HTML (with an inline import map) to `iframe.srcdoc`

Tailwind CSS is injected via CDN (`cdn.tailwindcss.com`) inside the iframe.

### Authentication & persistence

Auth uses JWT stored in an `httpOnly` cookie (`src/lib/auth.ts`). Sessions expire after 7 days. `JWT_SECRET` defaults to a development constant if the env var is unset.

Projects are stored in SQLite via Prisma (`prisma/schema.prisma`). Chat history is stored as a JSON string in `Project.messages`; file system state is stored in `Project.data`. Only authenticated users can save projects — anonymous users get local state only.

The Prisma client is generated into `src/generated/prisma/`.

### Context providers

Two React contexts wrap the app:

- **`FileSystemContext`** — owns the `VirtualFileSystem` instance, exposes CRUD operations, handles incoming AI tool calls via `handleToolCall`
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`) — owns chat message state and the `useChat` hook from the AI SDK

### Routing

- `/` — main page (new anonymous project)
- `/[projectId]` — loads an existing saved project

Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem` routes, returning 401 for unauthenticated requests.

### Model selection

`getLanguageModel()` in `src/lib/provider.ts` returns `MockLanguageModel` when `ANTHROPIC_API_KEY` is absent, otherwise returns `anthropic("claude-haiku-4-5")`. To switch models, change the `MODEL` constant in that file.
