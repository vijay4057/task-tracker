import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, parseISO } from 'date-fns';
import { taskService } from '../services/api';
import TaskModal from './TaskModal';
import './CalendarView.css';
import 'react-calendar/dist/Calendar.css';

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dateTasks = tasks.filter(task => {
        if (!task.targetDate) return false;
        return task.targetDate.startsWith(dateStr);
      });
      setSelectedDateTasks(dateTasks);
    }
  }, [selectedDate, tasks]);

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

  const handleDateChange = (date) => {
    setSelectedDate(date);
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

  const handleTaskSave = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    fetchTasks();
  };

  const getTasksForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(task => {
      if (!task.targetDate) return false;
      return task.targetDate.startsWith(dateStr);
    });
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateTasks = getTasksForDate(date);
      if (dateTasks.length > 0) {
        return (
          <div className="calendar-tile-content">
            <span className="task-count">{dateTasks.length}</span>
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateTasks = getTasksForDate(date);
      if (dateTasks.length > 0) {
        const hasOverdue = dateTasks.some(
          task => new Date(task.targetDate) < new Date() && task.status !== 'completed'
        );
        if (hasOverdue) return 'has-overdue-tasks';
        return 'has-tasks';
      }
    }
    return null;
  };

  if (loading) {
    return <div className="calendar-loading">Loading...</div>;
  }

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>Calendar View</h2>
          <button className="btn-add-task" onClick={handleAddTask}>
            + Add Task
          </button>
        </div>
        <div className="calendar-wrapper">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            className="custom-calendar"
          />
        </div>
      </div>

      <div className="selected-date-tasks">
        <h3>
          Tasks for {format(selectedDate, 'MMMM d, yyyy')}
          <span className="task-count-badge">{selectedDateTasks.length}</span>
        </h3>
        {selectedDateTasks.length === 0 ? (
          <div className="empty-state">
            No tasks scheduled for this date
            <button className="btn-add-inline" onClick={handleAddTask}>
              Add Task
            </button>
          </div>
        ) : (
          <div className="task-list">
            {selectedDateTasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-item-header">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={async (e) => {
                      try {
                        await taskService.updateTask(task.id, {
                          ...task,
                          status: e.target.checked ? 'completed' : 'pending'
                        });
                        fetchTasks();
                      } catch (error) {
                        console.error('Error updating task:', error);
                      }
                    }}
                  />
                  <h4 className={task.status === 'completed' ? 'completed' : ''}>
                    {task.title}
                  </h4>
                  <span
                    className={`priority-badge priority-${task.priority}`}
                  >
                    {task.priority}
                  </span>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                <div className="task-item-footer">
                  {task.targetTime && (
                    <span className="task-time">⏰ {task.targetTime}</span>
                  )}
                  {task.timeSpent > 0 && (
                    <span className="task-time-spent">
                      ⏱️ {Math.floor(task.timeSpent / 60)}h {task.timeSpent % 60}m
                    </span>
                  )}
                  <div className="task-actions">
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
              </div>
            ))}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          defaultDate={format(selectedDate, 'yyyy-MM-dd')}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={handleTaskSave}
        />
      )}
    </div>
  );
};

export default CalendarView;