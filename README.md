# Todoist Logger for Obsidian

This plugin allows you to import completed tasks from Todoist as markdown lists in your Obsidian notes.

## Features

- 📅 Import completed tasks from any date
- 🏷️ Optional project name display
- ⏰ Optional completion time display
- 📝 Customizable heading level
- 💾 Remembers your last selected date

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

1. Open Command Palette (Cmd/Ctrl + P)
2. Search for "Todoist: Insert completed tasks"
3. Select a date using the date picker or quick buttons (Today/Yesterday)
4. Completed tasks will be inserted at your cursor position

### Example Output

```markdown
## 2025-07-25 完了タスク

- Write documentation [Work]
- Review pull request [Work] (14:30)
- Buy groceries [Personal]
```

## Configuration

- **API Token**: Your Todoist API token (required)
- **Include project name**: Show project name with each task
- **Include completion time**: Show the time when the task was completed
- **Heading level**: Heading level for the date title (1-6)

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