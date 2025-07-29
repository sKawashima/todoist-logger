import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN;
const SYNC_API_BASE_URL = 'https://api.todoist.com/sync/v9';

// Date utilities
function getDateRange(targetDate = new Date()) {
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return {
    since: startOfDay.toISOString(),
    until: endOfDay.toISOString()
  };
}

// Get completed tasks from Todoist
async function getCompletedTasks(date = new Date()) {
  if (!TODOIST_API_TOKEN) {
    throw new Error('TODOIST_API_TOKEN is not set. Please check your .env file.');
  }

  const { since, until } = getDateRange(date);
  
  try {
    const response = await axios.get(`${SYNC_API_BASE_URL}/completed/get_all`, {
      headers: {
        'Authorization': `Bearer ${TODOIST_API_TOKEN}`
      },
      params: {
        since,
        until
      }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Todoist API error: ${error.response.status} - ${error.response.data}`);
    }
    throw error;
  }
}

// Convert completed tasks to Markdown format
function tasksToMarkdown(data, options = {}) {
  const { includeProject = true, includeTime = false } = options;
  const { items = [], projects = {} } = data;

  if (items.length === 0) {
    return '指定された日付に完了したタスクはありません。';
  }

  const lines = [];
  const date = new Date(items[0].completed_at);
  lines.push(`## ${date.toLocaleDateString('ja-JP')} 完了タスク\n`);

  items.forEach(item => {
    let line = `- ${item.content}`;
    
    if (includeProject && item.project_id && projects[item.project_id]) {
      line += ` [${projects[item.project_id].name}]`;
    }
    
    if (includeTime) {
      const completedTime = new Date(item.completed_at);
      line += ` (${completedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })})`;
    }
    
    lines.push(line);
  });

  return lines.join('\n');
}

// Main function
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let targetDate = new Date();
    
    if (args[0]) {
      targetDate = new Date(args[0]);
      if (isNaN(targetDate.getTime())) {
        console.error('Invalid date format. Please use YYYY-MM-DD format.');
        process.exit(1);
      }
    }

    console.log(`Fetching completed tasks for: ${targetDate.toLocaleDateString('ja-JP')}...`);
    
    const completedData = await getCompletedTasks(targetDate);
    
    // Convert to Markdown with different options
    const markdown = tasksToMarkdown(completedData, {
      includeProject: true,
      includeTime: true
    });
    
    console.log('\n' + markdown);
    
    // Also show stats
    console.log(`\n統計: ${completedData.items?.length || 0} タスク完了`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();