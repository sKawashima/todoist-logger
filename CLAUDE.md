# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Development build with watch mode (auto-rebuilds on changes)
npm run dev

# Production build for release
npm run build

# Test the Todoist API integration standalone
npm test
# Or with a specific date: node test-todoist.js 2025-07-24
```

## Architecture Overview

This is an Obsidian plugin that fetches completed tasks from Todoist and inserts them as markdown lists into notes.

### Core Components

**Main Plugin (`src/main.ts`)**
- `TodoistLogger` - Main plugin class extending Obsidian's Plugin
- `DatePickerModal` - Modal for date selection with Today/Yesterday shortcuts
- `TodoistLoggerSettingTab` - Settings UI for API token and output preferences

**Key Data Flow:**
1. User triggers command → DatePickerModal opens
2. Date selected → `insertCompletedTasks()` called
3. `fetchCompletedTasks()` calls Todoist Sync API v9 `/completed/get_all` endpoint
4. `formatTasksAsMarkdown()` converts API response to markdown with user preferences
5. Markdown inserted at cursor position in active editor

**API Integration:**
- Uses Todoist Sync API v9 (not REST API v2 - completed tasks unavailable there)
- Endpoint: `https://api.todoist.com/sync/v9/completed/get_all`
- Date filtering via `since`/`until` parameters (ISO 8601 format)

### Build System

- **TypeScript source** in `src/` compiled to `main.js` at root
- **esbuild** for bundling with Obsidian-specific externals
- **Development**: `npm run dev` runs esbuild in watch mode
- **Production**: `npm run build` creates optimized bundle

### Testing

- `test-todoist.js` - Standalone Node.js script for API testing
- Requires `.env` file with `TODOIST_API_TOKEN`
- Tests same API endpoints and markdown formatting as plugin

### Settings Schema

```typescript
interface TodoistLoggerSettings {
  apiToken: string;           // Todoist API token
  includeProject: boolean;    // Show project names
  includeTime: boolean;       // Show completion times
  headingLevel: number;       // H1-H6 for date heading
  lastSelectedDate: string;   // ISO string for date persistence
}
```

### Release Process

- GitHub Actions (`release.yml`) builds and releases on git tags
- Required files for Obsidian: `main.js`, `manifest.json`, `styles.css`, `versions.json`
- Plugin metadata in `manifest.json` with minimum Obsidian version 0.15.0