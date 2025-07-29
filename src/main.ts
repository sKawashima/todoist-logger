import { App, Plugin, PluginSettingTab, Setting, Modal, Notice, MarkdownView } from 'obsidian';

interface TodoistLoggerSettings {
	apiToken: string;
	includeProject: boolean;
	includeTime: boolean;
	headingLevel: number;
	lastSelectedDate: string;
}

const DEFAULT_SETTINGS: TodoistLoggerSettings = {
	apiToken: '',
	includeProject: true,
	includeTime: false,
	headingLevel: 2,
	lastSelectedDate: ''
}

export default class TodoistLogger extends Plugin {
	settings: TodoistLoggerSettings;

	async onload() {
		await this.loadSettings();

		// Add command to insert completed tasks
		this.addCommand({
			id: 'insert-completed-tasks',
			name: 'Insert completed tasks',
			callback: () => {
				new DatePickerModal(this.app, this, async (date: Date) => {
					await this.insertCompletedTasks(date);
				}).open();
			}
		});

		// Add settings tab
		this.addSettingTab(new TodoistLoggerSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup if needed
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async insertCompletedTasks(date: Date) {
		if (!this.settings.apiToken) {
			new Notice('Please set your Todoist API token in the plugin settings');
			return;
		}

		try {
			new Notice('Fetching completed tasks...');
			
			const completedData = await this.fetchCompletedTasks(date);
			const markdown = this.formatTasksAsMarkdown(completedData, date);
			
			// Insert at cursor position
			const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			if (editor) {
				editor.replaceSelection(markdown);
				new Notice(`Inserted ${completedData.items?.length || 0} completed tasks`);
			} else {
				new Notice('No active editor found');
			}
			
			// Save last selected date
			this.settings.lastSelectedDate = date.toISOString();
			await this.saveSettings();
			
		} catch (error) {
			console.error('Error fetching tasks:', error);
			new Notice(`Error: ${error.message}`);
		}
	}

	async fetchCompletedTasks(date: Date) {
		const { since, until } = this.getDateRange(date);
		const url = `https://api.todoist.com/sync/v9/completed/get_all?since=${since}&until=${until}`;
		
		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${this.settings.apiToken}`
			}
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.status} - ${response.statusText}`);
		}

		return await response.json();
	}

	getDateRange(date: Date) {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);
		
		return {
			since: startOfDay.toISOString(),
			until: endOfDay.toISOString()
		};
	}

	formatTasksAsMarkdown(data: any, date: Date): string {
		const { items = [], projects = {} } = data;

		if (items.length === 0) {
			return `${'#'.repeat(this.settings.headingLevel)} ${date.toLocaleDateString('ja-JP')} 完了タスク\n\n指定された日付に完了したタスクはありません。\n`;
		}

		const lines: string[] = [];
		lines.push(`${'#'.repeat(this.settings.headingLevel)} ${date.toLocaleDateString('ja-JP')} 完了タスク\n`);

		items.forEach((item: any) => {
			let line = `- ${item.content}`;
			
			if (this.settings.includeProject && item.project_id && projects[item.project_id]) {
				line += ` [${projects[item.project_id].name}]`;
			}
			
			if (this.settings.includeTime) {
				const completedTime = new Date(item.completed_at);
				line += ` (${completedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })})`;
			}
			
			lines.push(line);
		});

		return lines.join('\n') + '\n';
	}
}

class DatePickerModal extends Modal {
	plugin: TodoistLogger;
	onSubmit: (date: Date) => void;
	selectedDate: Date;

	constructor(app: App, plugin: TodoistLogger, onSubmit: (date: Date) => void) {
		super(app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
		
		// Set default date
		if (this.plugin.settings.lastSelectedDate) {
			this.selectedDate = new Date(this.plugin.settings.lastSelectedDate);
		} else {
			this.selectedDate = new Date();
		}
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.createEl("h2", { text: "Select Date" });

		new Setting(contentEl)
			.setName("Date")
			.setDesc("Select the date for completed tasks")
			.addText(text => {
				// Format date as YYYY-MM-DD for input
				const dateStr = this.selectedDate.toISOString().split('T')[0];
				text.setValue(dateStr);
				text.inputEl.type = 'date';
				text.onChange(value => {
					this.selectedDate = new Date(value + 'T00:00:00');
				});
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Today')
				.onClick(() => {
					this.selectedDate = new Date();
					this.close();
					this.onSubmit(this.selectedDate);
				}))
			.addButton(btn => btn
				.setButtonText('Yesterday')
				.onClick(() => {
					const yesterday = new Date();
					yesterday.setDate(yesterday.getDate() - 1);
					this.selectedDate = yesterday;
					this.close();
					this.onSubmit(this.selectedDate);
				}))
			.addButton(btn => btn
				.setButtonText('Insert')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.selectedDate);
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class TodoistLoggerSettingTab extends PluginSettingTab {
	plugin: TodoistLogger;

	constructor(app: App, plugin: TodoistLogger) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Todoist Logger Settings' });

		new Setting(containerEl)
			.setName('API Token')
			.setDesc('Your Todoist API token (get it from todoist.com/app/settings/integrations/developer)')
			.addText(text => text
				.setPlaceholder('Enter your API token')
				.setValue(this.plugin.settings.apiToken)
				.onChange(async (value) => {
					this.plugin.settings.apiToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Include project name')
			.setDesc('Show project name with each task')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeProject)
				.onChange(async (value) => {
					this.plugin.settings.includeProject = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Include completion time')
			.setDesc('Show the time when the task was completed')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeTime)
				.onChange(async (value) => {
					this.plugin.settings.includeTime = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Heading level')
			.setDesc('Heading level for the date title (1-6)')
			.addSlider(slider => slider
				.setLimits(1, 6, 1)
				.setValue(this.plugin.settings.headingLevel)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.headingLevel = value;
					await this.plugin.saveSettings();
				}));
	}
}