import React, { useState, useEffect } from 'react';
import { taskService } from '../services/api';
import { format, isToday, parseISO } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [reminders, setReminders] = useState({ overdue: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    overdue: true,
    upcoming: true,
    completed: false
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, remindersRes] = await Promise.all([
        taskService.getAllTasks(),
        taskService.getReminders()
      ]);

      // Handle response - axios wraps in .data, but check both
      const allTasks = Array.isArray(tasksRes.data) ? tasksRes.data : (Array.isArray(tasksRes) ? tasksRes : []);
      const remindersData = remindersRes.data || { overdue: [], upcoming: [] };
      
      console.log('Fetched tasks:', allTasks);
      console.log('Fetched reminders:', remindersData);
      
      setTasks(allTasks);
      setReminders(remindersData);

      // Filter today's tasks (include all statuses)
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('Today date:', today);
      
      const todayTasksList = allTasks.filter(task => {
        if (!task.targetDate) return false;
        const taskDate = task.targetDate.split('T')[0]; // Extract date part
        const matches = taskDate === today;
        if (matches) {
          console.log('Task matches today:', task.title, taskDate);
        }
        return matches;
      });
      
      console.log('Today tasks:', todayTasksList);
      setTodayTasks(todayTasksList);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response || error.message);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch tasks. Please check if the backend server is running.';
      setError(errorMessage);
      // Set empty arrays on error to prevent undefined errors
      setTasks([]);
      setReminders({ overdue: [], upcoming: [] });
      setTodayTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await taskService.updateTask(taskId, { ...task, status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating task:', error);
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderTaskTable = (taskList, showStatus = false) => {
    if (taskList.length === 0) {
      return <div className="empty-state">No tasks</div>;
    }

    return (
      <table className="task-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>✓</th>
            <th>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Time</th>
            <th>Time Spent</th>
            {showStatus && <th>Status</th>}
          </tr>
        </thead>
        <tbody>
          {taskList.map(task => (
            <tr 
              key={task.id} 
              className={`task-row ${task.status === 'completed' ? 'completed' : ''}`}
            >
              <td>
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={(e) => handleTaskStatusChange(
                    task.id,
                    e.target.checked ? 'completed' : 'pending'
                  )}
                />
              </td>
              <td>
                <span className={task.status === 'completed' ? 'completed-text' : ''}>
                  {task.title}
                </span>
              </td>
              <td>
                <span className="task-description-cell">
                  {task.description || '-'}
                </span>
              </td>
              <td>
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(task.priority) }}
                >
                  {task.priority}
                </span>
              </td>
              <td>
                {task.targetTime ? (
                  <span className="task-time">⏰ {task.targetTime}</span>
                ) : (
                  <span className="task-time">-</span>
                )}
              </td>
              <td>
                {task.timeSpent > 0 ? (
                  <span className="task-time-spent">
                    ⏱️ {Math.floor(task.timeSpent / 60)}h {task.timeSpent % 60}m
                  </span>
                ) : (
                  <span>-</span>
                )}
              </td>
              {showStatus && (
                <td>
                  {task.status === 'completed' ? (
                    <span className="completed-badge">✓ Completed</span>
                  ) : (
                    <span className="status-badge">{task.status}</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  // Calculate stats
  const completedCount = Array.isArray(tasks) ? tasks.filter(t => t.status === 'completed').length : 0;
  const todayTasksCount = Array.isArray(todayTasks) ? todayTasks.length : 0;
  const overdueCount = Array.isArray(reminders?.overdue) ? reminders.overdue.length : 0;
  const upcomingCount = Array.isArray(reminders?.upcoming) ? reminders.upcoming.length : 0;

  return (
    <div className="dashboard">
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}
      <div className="dashboard-header">
        <h2>Today's Focus</h2>
        <p className="dashboard-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{todayTasksCount}</div>
          <div className="stat-label">Tasks Today</div>
        </div>
        <div className="stat-card overdue">
          <div className="stat-value">{overdueCount}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card upcoming">
          <div className="stat-value">{upcomingCount}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedCount}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="dashboard-accordion">
        <div className="accordion-item">
          <div 
            className="accordion-header"
            onClick={() => toggleSection('today')}
          >
            <h3>
              Today's Tasks
              <span className="task-count">({todayTasksCount})</span>
            </h3>
            <span className="accordion-icon">
              {expandedSections.today ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.today && (
            <div className="accordion-content">
              {renderTaskTable(todayTasks)}
            </div>
          )}
        </div>

        <div className="accordion-item">
          <div 
            className="accordion-header overdue-header"
            onClick={() => toggleSection('overdue')}
          >
            <h3>
              Overdue Tasks
              <span className="task-count">({overdueCount})</span>
            </h3>
            <span className="accordion-icon">
              {expandedSections.overdue ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.overdue && (
            <div className="accordion-content">
              {reminders.overdue.length === 0 ? (
                <div className="empty-state">No overdue tasks</div>
              ) : (
                <table className="task-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>✓</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Time Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.overdue.map(task => (
                      <tr key={task.id} className="task-row overdue-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={(e) => handleTaskStatusChange(
                              task.id,
                              e.target.checked ? 'completed' : 'pending'
                            )}
                          />
                        </td>
                        <td>
                          <span>{task.title}</span>
                          <span className="overdue-badge">Overdue</span>
                        </td>
                        <td>
                          <span className="task-description-cell">
                            {task.description || '-'}
                          </span>
                        </td>
                        <td>
                          <span
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <span className="task-date">
                            {format(parseISO(task.targetDate), 'MMM d, yyyy')}
                          </span>
                        </td>
                        <td>
                          {task.timeSpent > 0 ? (
                            <span className="task-time-spent">
                              ⏱️ {Math.floor(task.timeSpent / 60)}h {task.timeSpent % 60}m
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="accordion-item">
          <div 
            className="accordion-header upcoming-header"
            onClick={() => toggleSection('upcoming')}
          >
            <h3>
              Upcoming Tasks (Next 24 Hours)
              <span className="task-count">({upcomingCount})</span>
            </h3>
            <span className="accordion-icon">
              {expandedSections.upcoming ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.upcoming && (
            <div className="accordion-content">
              {reminders.upcoming.length === 0 ? (
                <div className="empty-state">No upcoming tasks</div>
              ) : (
                <table className="task-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>✓</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Due Date & Time</th>
                      <th>Time Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.upcoming.map(task => (
                      <tr key={task.id} className="task-row upcoming-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={(e) => handleTaskStatusChange(
                              task.id,
                              e.target.checked ? 'completed' : 'pending'
                            )}
                          />
                        </td>
                        <td>
                          <span>{task.title}</span>
                          <span className="upcoming-badge">Upcoming</span>
                        </td>
                        <td>
                          <span className="task-description-cell">
                            {task.description || '-'}
                          </span>
                        </td>
                        <td>
                          <span
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <span className="task-date">
                            {format(parseISO(task.targetDate), 'MMM d, yyyy')}
                            {task.targetTime && ` at ${task.targetTime}`}
                          </span>
                        </td>
                        <td>
                          {task.timeSpent > 0 ? (
                            <span className="task-time-spent">
                              ⏱️ {Math.floor(task.timeSpent / 60)}h {task.timeSpent % 60}m
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="accordion-item">
          <div 
            className="accordion-header completed-header"
            onClick={() => toggleSection('completed')}
          >
            <h3>
              Completed Tasks Today
              <span className="task-count">
                ({(() => {
                  const today = format(new Date(), 'yyyy-MM-dd');
                  return tasks.filter(task => {
                    if (!task.targetDate || task.status !== 'completed') return false;
                    const taskDate = task.targetDate.split('T')[0];
                    return taskDate === today;
                  }).length;
                })()})
              </span>
            </h3>
            <span className="accordion-icon">
              {expandedSections.completed ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.completed && (
            <div className="accordion-content">
              {(() => {
                const today = format(new Date(), 'yyyy-MM-dd');
                const completedToday = tasks.filter(task => {
                  if (!task.targetDate || task.status !== 'completed') return false;
                  const taskDate = task.targetDate.split('T')[0];
                  return taskDate === today;
                });
                return renderTaskTable(completedToday, true);
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;