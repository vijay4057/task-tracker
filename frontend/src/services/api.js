import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const taskService = {
  getAllTasks: () => api.get('/tasks'),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (task) => api.post('/tasks', task),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getTasksByDate: (date) => api.get(`/tasks/date/${date}`),
  getReminders: () => api.get('/tasks/reminders'),
  addTimeEntry: (id, timeEntry) => api.post(`/tasks/${id}/time`, timeEntry),
};

export const jiraService = {
  getConfig: () => api.get('/jira/config'),
  createSubtask: (data) => api.post('/jira/subtask', data),
  logWork: (data) => api.post('/jira/worklog', data),
  getIssue: (issueKey) => api.get(`/jira/issue/${issueKey}`),
};

export default api;
