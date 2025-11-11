import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { taskService } from '../services/api';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const [reminders, setReminders] = useState({ overdue: [], upcoming: [] });
  const [showReminders, setShowReminders] = useState(false);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const response = await taskService.getReminders();
        setReminders(response.data);
      } catch (error) {
        console.error('Error fetching reminders:', error);
      }
    };

    fetchReminders();
    const interval = setInterval(fetchReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getReminderCount = () => {
    return reminders.overdue.length + reminders.upcoming.length;
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>Task Tracker</h1>
        </div>
        <nav className="nav-menu">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link 
            to="/tasks" 
            className={location.pathname === '/tasks' ? 'active' : ''}
          >
            Tasks
          </Link>
          <Link 
            to="/calendar" 
            className={location.pathname === '/calendar' ? 'active' : ''}
          >
            Calendar
          </Link>
        </nav>
        <div className="header-right">
          <div 
            className="reminder-icon" 
            onClick={() => setShowReminders(!showReminders)}
          >
            🔔
            {getReminderCount() > 0 && (
              <span className="reminder-badge">{getReminderCount()}</span>
            )}
          </div>
          <div className="profile-icon">
            👤
          </div>
        </div>
      </div>
      {showReminders && (
        <div className="reminders-dropdown">
          {reminders.overdue.length > 0 && (
            <div className="reminder-section">
              <h3 className="reminder-title overdue">Overdue Tasks</h3>
              {reminders.overdue.map(task => (
                <div key={task.id} className="reminder-item overdue">
                  <strong>{task.title}</strong>
                  <span>Due: {new Date(task.targetDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
          {reminders.upcoming.length > 0 && (
            <div className="reminder-section">
              <h3 className="reminder-title upcoming">Upcoming Tasks</h3>
              {reminders.upcoming.map(task => (
                <div key={task.id} className="reminder-item upcoming">
                  <strong>{task.title}</strong>
                  <span>Due: {new Date(task.targetDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
          {getReminderCount() === 0 && (
            <div className="reminder-item">No reminders</div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
