import React, { useState, useEffect } from 'react';
import { taskService } from '../services/api';
import { format, parseISO } from 'date-fns';
import TaskModal from './TaskModal';
import TimeTracker from './TimeTracker';
import JiraSubtaskModal from './JiraSubtaskModal';
import './TaskList.css';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [jiraTask, setJiraTask] = useState(null);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = [...tasks];

    // Apply filter
    if (filter === 'pending') {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed');
    } else if (filter === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(t => {
        if (!t.targetDate || t.status === 'completed') return false;
        return new Date(t.targetDate) < now;
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return new Date(a.targetDate) - new Date(b.targetDate);
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    setFilteredTasks(filtered);
  }, [tasks, filter, sortBy]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAllTasks();
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await taskService.updateTask(taskId, { ...task, status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskSave = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    fetchTasks();
  };

  const handleTimeEntry = () => {
    fetchTasks();
  };

  const handleLinkJiraTask = async (taskId, jiraKey) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        // Update task with JIRA issue key without modifying description
        await taskService.updateTask(taskId, {
          ...task,
          jiraIssueKey: jiraKey
        });
        fetchTasks();
        alert(`Task linked to JIRA: ${jiraKey}`);
      }
    } catch (error) {
      console.error('Error linking JIRA task:', error);
      alert('Failed to link JIRA issue to task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#999';
    }
  };

  const isOverdue = (task) => {
    if (!task.targetDate || task.status === 'completed') return false;
    return new Date(task.targetDate) < new Date();
  };

  if (loading) {
    return <div className="task-list-loading">Loading...</div>;
  }

  return (
    <div className="task-list-view">
      <div className="task-list-header">
        <h2>All Tasks</h2>
        <button className="btn-add-task" onClick={handleAddTask}>
          + Add Task
        </button>
      </div>

      <div className="task-list-controls">
        <div className="filter-group">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="sort-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      <div className="tasks-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            No tasks found. Create your first task!
          </div>
        ) : (
          <div className="task-grid">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className={`task-card ${isOverdue(task) ? 'overdue' : ''} ${task.status === 'completed' ? 'completed' : ''}`}
              >
                <div className="task-card-header">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={(e) => handleTaskStatusChange(
                      task.id,
                      e.target.checked ? 'completed' : 'pending'
                    )}
                  />
                  <h3 className={task.status === 'completed' ? 'completed' : ''}>
                    {task.title}
                  </h3>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                  <div className="task-dates">
                    {task.targetDate && (
                      <span className="task-date">
                        📅 {format(parseISO(task.targetDate), 'MMM d, yyyy')}
                        {task.targetTime && ` at ${task.targetTime}`}
                      </span>
                    )}
                    {isOverdue(task) && (
                      <span className="overdue-badge">Overdue</span>
                    )}
                  </div>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                </div>

                {task.timeSpent > 0 && (
                  <div className="time-spent">
                    ⏱️ Time Spent: {Math.floor(task.timeSpent / 60)}h {task.timeSpent % 60}m
                  </div>
                )}

                {task.jiraIssueKey && (
                  <div className="jira-link-info">
                    <span className="jira-linked-badge" title={`Linked to JIRA: ${task.jiraIssueKey}`}>
                      🔗 {task.jiraIssueKey}
                    </span>
                  </div>
                )}

                <div className="task-actions">
                  <button
                    className="btn-jira"
                    onClick={() => {
                      setJiraTask(task);
                      setShowJiraModal(true);
                    }}
                    title={task.jiraIssueKey ? "Update JIRA link" : "Create JIRA Subtask"}
                  >
                    🔗
                  </button>
                  <button
                    className="btn-track-time"
                    onClick={() => setSelectedTask(task)}
                  >
                    Track Time
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => handleEditTask(task)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={handleTaskSave}
        />
      )}

      {selectedTask && (
        <TimeTracker
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTimeEntry={handleTimeEntry}
        />
      )}

      {showJiraModal && (
        <JiraSubtaskModal
          task={jiraTask}
          onClose={() => {
            setShowJiraModal(false);
            setJiraTask(null);
          }}
          onSuccess={(jiraKey) => {
            if (jiraKey && jiraTask) {
              // Update the task with JIRA issue key
              handleLinkJiraTask(jiraTask.id, jiraKey);
            }
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};

export default TaskList;