const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const jiraService = require('./jiraService');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory exists
fs.ensureDirSync(path.dirname(DATA_FILE));

// Initialize tasks file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeJsonSync(DATA_FILE, []);
}

// Helper function to read tasks
const readTasks = () => {
  try {
    return fs.readJsonSync(DATA_FILE);
  } catch (error) {
    return [];
  }
};

// Helper function to write tasks
const writeTasks = (tasks) => {
  fs.writeJsonSync(DATA_FILE, tasks, { spaces: 2 });
};

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// Get overdue and upcoming tasks (MUST be before /api/tasks/:id and /api/tasks/date/:date)
app.get('/api/tasks/reminders', (req, res) => {
  const tasks = readTasks();
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const overdue = [];
  const upcoming = [];
  
  tasks.forEach(task => {
    if (!task.targetDate) return;
    
    const targetDateTime = new Date(task.targetDate);
    if (task.targetTime) {
      const [hours, minutes] = task.targetTime.split(':');
      targetDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    if (targetDateTime < now && task.status !== 'completed') {
      overdue.push(task);
    } else if (targetDateTime >= now && targetDateTime <= oneDayFromNow && task.status !== 'completed') {
      upcoming.push(task);
    }
  });
  
  res.json({ overdue, upcoming });
});

// Get tasks for a specific date (MUST be before /api/tasks/:id)
app.get('/api/tasks/date/:date', (req, res) => {
  const tasks = readTasks();
  const date = req.params.date;
  const filteredTasks = tasks.filter(task => {
    if (!task.targetDate) return false;
    return task.targetDate.startsWith(date);
  });
  res.json(filteredTasks);
});

// Get task by ID (MUST be after all specific routes like /reminders and /date/:date)
app.get('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Create a new task
app.post('/api/tasks', (req, res) => {
  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    title: req.body.title,
    description: req.body.description || '',
    targetDate: req.body.targetDate || null,
    targetTime: req.body.targetTime || null,
    status: req.body.status || 'pending',
    priority: req.body.priority || 'medium',
    timeSpent: req.body.timeSpent || 0, // in minutes
    timeEntries: req.body.timeEntries || [],
    jiraIssueKey: req.body.jiraIssueKey || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks[index] = {
    ...tasks[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  writeTasks(tasks);
  res.json(tasks[index]);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const filteredTasks = tasks.filter(t => t.id !== req.params.id);
  if (filteredTasks.length === tasks.length) {
    return res.status(404).json({ error: 'Task not found' });
  }
  writeTasks(filteredTasks);
  res.json({ message: 'Task deleted successfully' });
});

// Add time entry to a task
app.post('/api/tasks/:id/time', (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const timeEntry = {
    id: Date.now().toString(),
    minutes: req.body.minutes || 0,
    date: req.body.date || new Date().toISOString(),
    notes: req.body.notes || ''
  };
  
  if (!tasks[index].timeEntries) {
    tasks[index].timeEntries = [];
  }
  tasks[index].timeEntries.push(timeEntry);
  tasks[index].timeSpent = (tasks[index].timeSpent || 0) + timeEntry.minutes;
  tasks[index].updatedAt = new Date().toISOString();
  
  writeTasks(tasks);
  res.json(tasks[index]);
});


// JIRA Configuration endpoint
app.get('/api/jira/config', (req, res) => {
  res.json({
    configured: !!(process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN),
    baseURL: process.env.JIRA_BASE_URL || '',
    email: process.env.JIRA_EMAIL ? process.env.JIRA_EMAIL.substring(0, 3) + '***' : ''
  });
});

// Create JIRA subtask
app.post('/api/jira/subtask', async (req, res) => {
  try {
    const { parentIssueKey, title, description } = req.body;
    
    if (!parentIssueKey || !title) {
      return res.status(400).json({ error: 'Parent issue key and title are required' });
    }

    const result = await jiraService.createSubtask(parentIssueKey, title, description);
    res.json(result);
  } catch (error) {
    console.error('Error creating JIRA subtask:', error);
    res.status(500).json({ error: error.message || 'Failed to create JIRA subtask' });
  }
});

// Log work to JIRA
app.post('/api/jira/worklog', async (req, res) => {
  try {
    const { issueKey, timeSpentMinutes, comment, started } = req.body;
    
    if (!issueKey || !timeSpentMinutes) {
      return res.status(400).json({ error: 'Issue key and time spent are required' });
    }

    const timeSpentSeconds = timeSpentMinutes * 60;
    const result = await jiraService.logWork(issueKey, timeSpentSeconds, comment, started);
    res.json(result);
  } catch (error) {
    console.error('Error logging work to JIRA:', error);
    res.status(500).json({ error: error.message || 'Failed to log work to JIRA' });
  }
});

// Get JIRA issue info
app.get('/api/jira/issue/:issueKey', async (req, res) => {
  try {
    const { issueKey } = req.params;
    const issue = await jiraService.getIssue(issueKey);
    res.json({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      project: issue.fields.project.key
    });
  } catch (error) {
    console.error('Error getting JIRA issue:', error);
    res.status(500).json({ error: error.message || 'Failed to get JIRA issue' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (!process.env.JIRA_BASE_URL) {
    console.log('⚠️  JIRA integration not configured. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables to enable.');
  }
});
