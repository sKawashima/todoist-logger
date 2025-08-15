import { App, Plugin, PluginSettingTab, Setting, Modal, Notice, MarkdownView } from 'obsidian';

interface TodoistLoggerSettings {
	apiToken: string;
	includeProject: boolean;
	includeTime: boolean;
	headingLevel: number;
	lastSelectedDate: string;
	weekStart: number; // 0 = Sunday, 1 = Monday, etc.
}

const DEFAULT_SETTINGS: TodoistLoggerSettings = {
	apiToken: '',
	includeProject: true,
	includeTime: false,
	headingLevel: 2,
	lastSelectedDate: '',
	weekStart: 0 // Default to Sunday
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

		// Add command to insert completed tasks for a week
		this.addCommand({
			id: 'insert-completed-tasks-weekly',
			name: 'Insert completed tasks (weekly)',
			callback: () => {
				new WeekPickerModal(this.app, this, async (startDate: Date) => {
					await this.insertCompletedTasksWeekly(startDate);
				}).open();
			}
		});

		// Add command to insert completed tasks for a month
		this.addCommand({
			id: 'insert-completed-tasks-monthly',
			name: 'Insert completed tasks (monthly)',
			callback: () => {
				new MonthPickerModal(this.app, this, async (date: Date) => {
					await this.insertCompletedTasksMonthly(date);
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

	async insertCompletedTasksWeekly(date: Date) {
		if (!this.settings.apiToken) {
			new Notice('Please set your Todoist API token in the plugin settings');
			return;
		}

		try {
			new Notice('Fetching completed tasks for the week...');
			
			const weekRange = this.getWeekRange(date);
			const { since, until } = weekRange;
			
			const url = `https://api.todoist.com/sync/v9/completed/get_all?since=${since}&until=${until}`;
			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${this.settings.apiToken}`
				}
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status} - ${response.statusText}`);
			}

			const completedData = await response.json();
			const markdown = this.formatWeeklyTasksAsMarkdown(completedData, weekRange);
			
			// Insert at cursor position
			const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			if (editor) {
				editor.replaceSelection(markdown);
				new Notice(`Inserted ${completedData.items?.length || 0} completed tasks for the week`);
			} else {
				new Notice('No active editor found');
			}
			
			// Save last selected date
			this.settings.lastSelectedDate = date.toISOString();
			await this.saveSettings();
			
		} catch (error) {
			console.error('Error fetching weekly tasks:', error);
			new Notice(`Error: ${error.message}`);
		}
	}

	async insertCompletedTasksMonthly(date: Date) {
		if (!this.settings.apiToken) {
			new Notice('Please set your Todoist API token in the plugin settings');
			return;
		}

		try {
			new Notice('Fetching completed tasks for the month...');
			
			const monthRange = this.getMonthRange(date);
			const { since, until } = monthRange;
			
			const url = `https://api.todoist.com/sync/v9/completed/get_all?since=${since}&until=${until}`;
			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${this.settings.apiToken}`
				}
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status} - ${response.statusText}`);
			}

			const completedData = await response.json();
			const markdown = this.formatMonthlyTasksAsMarkdown(completedData, monthRange);
			
			// Insert at cursor position
			const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
			if (editor) {
				editor.replaceSelection(markdown);
				new Notice(`Inserted ${completedData.items?.length || 0} completed tasks for the month`);
			} else {
				new Notice('No active editor found');
			}
			
			// Save last selected date
			this.settings.lastSelectedDate = date.toISOString();
			await this.saveSettings();
			
		} catch (error) {
			console.error('Error fetching monthly tasks:', error);
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

	getWeekRange(date: Date) {
		const startOfWeek = new Date(date);
		const dayOfWeek = startOfWeek.getDay();
		const diff = dayOfWeek >= this.settings.weekStart 
			? dayOfWeek - this.settings.weekStart 
			: 7 - this.settings.weekStart + dayOfWeek;
		
		startOfWeek.setDate(startOfWeek.getDate() - diff);
		startOfWeek.setHours(0, 0, 0, 0);
		
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(endOfWeek.getDate() + 6);
		endOfWeek.setHours(23, 59, 59, 999);
		
		return {
			since: startOfWeek.toISOString(),
			until: endOfWeek.toISOString(),
			startDate: new Date(startOfWeek),
			endDate: new Date(endOfWeek)
		};
	}

	getMonthRange(date: Date) {
		const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
		startOfMonth.setHours(0, 0, 0, 0);
		
		const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		endOfMonth.setHours(23, 59, 59, 999);
		
		return {
			since: startOfMonth.toISOString(),
			until: endOfMonth.toISOString(),
			startDate: new Date(startOfMonth),
			endDate: new Date(endOfMonth)
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

	formatWeeklyTasksAsMarkdown(data: any, weekRange: any): string {
		const { items = [], projects = {} } = data;
		const { startDate, endDate } = weekRange;

		const lines: string[] = [];
		const weekStartStr = startDate.toLocaleDateString('ja-JP');
		const weekEndStr = endDate.toLocaleDateString('ja-JP');
		lines.push(`${'#'.repeat(this.settings.headingLevel)} ${weekStartStr} - ${weekEndStr} 週間完了タスク\n`);

		if (items.length === 0) {
			lines.push('この週に完了したタスクはありません。\n');
			return lines.join('\n');
		}

		// Group tasks by date
		const tasksByDate: { [date: string]: any[] } = {};
		items.forEach((item: any) => {
			const completedDate = new Date(item.completed_at);
			const dateKey = completedDate.toLocaleDateString('ja-JP');
			if (!tasksByDate[dateKey]) {
				tasksByDate[dateKey] = [];
			}
			tasksByDate[dateKey].push(item);
		});

		// Sort dates
		const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
			return new Date(a).getTime() - new Date(b).getTime();
		});

		// Format tasks by date
		sortedDates.forEach(dateStr => {
			lines.push(`\n${'#'.repeat(this.settings.headingLevel + 1)} ${dateStr}`);
			
			tasksByDate[dateStr].forEach((item: any) => {
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
		});

		return lines.join('\n') + '\n';
	}

	formatMonthlyTasksAsMarkdown(data: any, monthRange: any): string {
		const { items = [], projects = {} } = data;
		const { startDate, endDate } = monthRange;

		const lines: string[] = [];
		const year = startDate.getFullYear();
		const month = startDate.getMonth() + 1;
		lines.push(`${'#'.repeat(this.settings.headingLevel)} ${year}年${month}月 完了タスク\n`);

		if (items.length === 0) {
			lines.push('この月に完了したタスクはありません。\n');
			return lines.join('\n');
		}

		// Group tasks by week
		const tasksByWeek: { [weekKey: string]: { weekStart: Date; weekEnd: Date; tasks: any[] } } = {};
		
		items.forEach((item: any) => {
			const completedDate = new Date(item.completed_at);
			const weekRange = this.getWeekRange(completedDate);
			const weekKey = `${weekRange.startDate.toISOString().split('T')[0]}_${weekRange.endDate.toISOString().split('T')[0]}`;
			
			if (!tasksByWeek[weekKey]) {
				tasksByWeek[weekKey] = {
					weekStart: weekRange.startDate,
					weekEnd: weekRange.endDate,
					tasks: []
				};
			}
			tasksByWeek[weekKey].tasks.push(item);
		});

		// Sort weeks
		const sortedWeeks = Object.keys(tasksByWeek).sort((a, b) => {
			return tasksByWeek[a].weekStart.getTime() - tasksByWeek[b].weekStart.getTime();
		});

		// Format tasks by week
		sortedWeeks.forEach((weekKey, index) => {
			const week = tasksByWeek[weekKey];
			const weekNum = index + 1;
			lines.push(`\n${'#'.repeat(this.settings.headingLevel + 1)} 第${weekNum}週 (${week.weekStart.toLocaleDateString('ja-JP')} - ${week.weekEnd.toLocaleDateString('ja-JP')})`);
			
			// Group tasks by date within the week
			const tasksByDate: { [date: string]: any[] } = {};
			week.tasks.forEach((task: any) => {
				const completedDate = new Date(task.completed_at);
				const dateKey = completedDate.toLocaleDateString('ja-JP');
				if (!tasksByDate[dateKey]) {
					tasksByDate[dateKey] = [];
				}
				tasksByDate[dateKey].push(task);
			});

			// Sort dates within week
			const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
				return new Date(a).getTime() - new Date(b).getTime();
			});

			// Format tasks by date
			sortedDates.forEach(dateStr => {
				lines.push(`\n${'#'.repeat(this.settings.headingLevel + 2)} ${dateStr}`);
				
				tasksByDate[dateStr].forEach((item: any) => {
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
			});
		});

		lines.push(`\n\n**合計タスク数**: ${items.length}`);
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

class WeekPickerModal extends Modal {
	plugin: TodoistLogger;
	onSubmit: (date: Date) => void;
	selectedDate: Date;

	constructor(app: App, plugin: TodoistLogger, onSubmit: (date: Date) => void) {
		super(app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
		
		// Set default date to current week
		if (this.plugin.settings.lastSelectedDate) {
			this.selectedDate = new Date(this.plugin.settings.lastSelectedDate);
		} else {
			this.selectedDate = new Date();
		}
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.createEl("h2", { text: "Select Week" });

		// Show current week range
		const weekRange = this.plugin.getWeekRange(this.selectedDate);
		const weekInfo = contentEl.createEl("p", { 
			text: `週: ${weekRange.startDate.toLocaleDateString('ja-JP')} - ${weekRange.endDate.toLocaleDateString('ja-JP')}` 
		});

		new Setting(contentEl)
			.setName("Week")
			.setDesc("Select any date within the desired week")
			.addText(text => {
				// Format date as YYYY-MM-DD for input
				const dateStr = this.selectedDate.toISOString().split('T')[0];
				text.setValue(dateStr);
				text.inputEl.type = 'date';
				text.onChange(value => {
					this.selectedDate = new Date(value + 'T00:00:00');
					// Update week range display
					const newWeekRange = this.plugin.getWeekRange(this.selectedDate);
					weekInfo.setText(`週: ${newWeekRange.startDate.toLocaleDateString('ja-JP')} - ${newWeekRange.endDate.toLocaleDateString('ja-JP')}`);
				});
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('This Week')
				.onClick(() => {
					this.selectedDate = new Date();
					this.close();
					this.onSubmit(this.selectedDate);
				}))
			.addButton(btn => btn
				.setButtonText('Last Week')
				.onClick(() => {
					const lastWeek = new Date();
					lastWeek.setDate(lastWeek.getDate() - 7);
					this.selectedDate = lastWeek;
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

class MonthPickerModal extends Modal {
	plugin: TodoistLogger;
	onSubmit: (date: Date) => void;
	selectedDate: Date;

	constructor(app: App, plugin: TodoistLogger, onSubmit: (date: Date) => void) {
		super(app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
		
		// Set default date to current month
		if (this.plugin.settings.lastSelectedDate) {
			this.selectedDate = new Date(this.plugin.settings.lastSelectedDate);
		} else {
			this.selectedDate = new Date();
		}
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.createEl("h2", { text: "Select Month" });

		// Show current month
		const monthRange = this.plugin.getMonthRange(this.selectedDate);
		const monthInfo = contentEl.createEl("p", { 
			text: `${this.selectedDate.getFullYear()}年${this.selectedDate.getMonth() + 1}月` 
		});

		new Setting(contentEl)
			.setName("Month")
			.setDesc("Select any date within the desired month")
			.addText(text => {
				// Format date as YYYY-MM for month input
				const year = this.selectedDate.getFullYear();
				const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
				const monthStr = `${year}-${month}`;
				text.setValue(monthStr);
				text.inputEl.type = 'month';
				text.onChange(value => {
					if (value) {
						const [year, month] = value.split('-');
						this.selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
						// Update month display
						monthInfo.setText(`${this.selectedDate.getFullYear()}年${this.selectedDate.getMonth() + 1}月`);
					}
				});
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('This Month')
				.onClick(() => {
					this.selectedDate = new Date();
					this.close();
					this.onSubmit(this.selectedDate);
				}))
			.addButton(btn => btn
				.setButtonText('Last Month')
				.onClick(() => {
					const lastMonth = new Date();
					lastMonth.setMonth(lastMonth.getMonth() - 1);
					this.selectedDate = lastMonth;
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

		new Setting(containerEl)
			.setName('Week start day')
			.setDesc('First day of the week for weekly view')
			.addDropdown(dropdown => dropdown
				.addOption('0', 'Sunday')
				.addOption('1', 'Monday')
				.setValue(this.plugin.settings.weekStart.toString())
				.onChange(async (value) => {
					this.plugin.settings.weekStart = parseInt(value);
					await this.plugin.saveSettings();
				}));
	}
}