# Todoist Logger for Obsidian

This plugin allows you to import completed tasks from Todoist as markdown lists in your Obsidian notes.

## Features

- 📅 Import completed tasks from any date
- 📆 Import completed tasks for an entire week
- 🗓️ **NEW**: Import completed tasks for an entire month
- 🏷️ Optional project name display
- ⏰ Optional completion time display
- 📝 Customizable heading level
- 💾 Remembers your last selected date
- 🔄 Configurable week start day (Sunday/Monday)

## Installation

### From Obsidian Community Plugins (Coming Soon)

1. Open Settings → Community plugins
2. Search for "Todoist Logger"
3. Click Install, then Enable

### Manual Installation

1. Download the latest release from [Releases](https://github.com/yourusername/obsidian-todoist-logger/releases)
2. Extract the files into your vault's `.obsidian/plugins/todoist-logger/` folder
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

## Setup

1. Get your Todoist API token from [Todoist Settings](https://todoist.com/app/settings/integrations/developer)
2. In Obsidian, go to Settings → Todoist Logger
3. Enter your API token
4. Configure your preferences

## Usage

### Daily Tasks

1. Open Command Palette (Cmd/Ctrl + P)
2. Search for "Todoist: Insert completed tasks"
3. Select a date using the date picker or quick buttons (Today/Yesterday)
4. Completed tasks will be inserted at your cursor position

### Weekly Tasks

1. Open Command Palette (Cmd/Ctrl + P)
2. Search for "Todoist: Insert completed tasks (weekly)"
3. Select any date within the desired week or use quick buttons (This Week/Last Week)
4. All completed tasks for that week will be inserted, grouped by day

### Monthly Tasks (NEW)

1. Open Command Palette (Cmd/Ctrl + P)
2. Search for "Todoist: Insert completed tasks (monthly)"
3. Select a month using the month picker or use quick buttons (This Month/Last Month)
4. All completed tasks for that month will be inserted, grouped by week and then by day

### Example Output

**Daily:**
```markdown
## 2025-07-25 完了タスク

- Write documentation [Work]
- Review pull request [Work] (14:30)
- Buy groceries [Personal]
```

**Weekly:**
```markdown
## 2025-07-21 - 2025-07-27 週間完了タスク

### 2025-07-21
- Plan weekly goals [Work]
- Team meeting [Work] (10:00)

### 2025-07-22
- Code review [Work]
- Fix bug #123 [Work] (15:45)

### 2025-07-23
- Write tests [Work]
- Update documentation [Work]
```

**Monthly:**
```markdown
## 2025年7月 完了タスク

### 第1週 (2025-07-01 - 2025-07-07)

#### 2025-07-01
- Monthly planning [Work]
- Setup development environment [Work]

#### 2025-07-02
- Write API endpoints [Work]
- Code review [Work] (14:30)

### 第2週 (2025-07-08 - 2025-07-14)

#### 2025-07-08
- Sprint planning [Work]
- Fix critical bug [Work] (16:00)

**合計タスク数**: 45
```

## Configuration

- **API Token**: Your Todoist API token (required)
- **Include project name**: Show project name with each task
- **Include completion time**: Show the time when the task was completed
- **Heading level**: Heading level for the date title (1-6)
- **Week start day**: Choose whether weeks start on Sunday or Monday

## Development

```bash
# Install dependencies
npm install

# Development build with auto-reload
npm run dev

# Production build
npm run build
```

## Support

If you encounter any issues or have feature requests, please file them on the [GitHub Issues](https://github.com/yourusername/obsidian-todoist-logger/issues) page.

## License

MIT License - see [LICENSE](LICENSE) for details.