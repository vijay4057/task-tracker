import React, { useState } from 'react';
import { taskService, jiraService } from '../services/api';
import './TimeTracker.css';

const TimeTracker = ({ task, onClose, onTimeEntry }) => {
  const [minutes, setMinutes] = useState(0);
  const [hours, setHours] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncingJira, setSyncingJira] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes <= 0) {
        alert('Please enter a valid time');
        setLoading(false);
        return;
      }

      // Add time entry to local task
      await taskService.addTimeEntry(task.id, {
        minutes: totalMinutes,
        notes: notes.trim(),
        date: new Date().toISOString(),
      });

      // Sync with JIRA if task has JIRA issue key
      if (task.jiraIssueKey) {
        setSyncingJira(true);
        try {
          await jiraService.logWork({
            issueKey: task.jiraIssueKey,
            timeSpentMinutes: totalMinutes,
            comment: notes.trim() || `Time logged: ${hours}h ${minutes}m`,
            started: new Date().toISOString()
          });
          console.log('Time synced to JIRA successfully');
        } catch (jiraError) {
          console.error('Failed to sync time to JIRA:', jiraError);
          alert('Time added locally but failed to sync with JIRA. Please check JIRA configuration.');
        } finally {
          setSyncingJira(false);
        }
      }

      onTimeEntry();
      onClose();
    } catch (error) {
      console.error('Error adding time entry:', error);
      alert('Failed to add time entry');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (mins) => {
    const currentTotal = hours * 60 + minutes;
    const newTotal = currentTotal + mins;
    setHours(Math.floor(newTotal / 60));
    setMinutes(newTotal % 60);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="time-tracker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Track Time - {task.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="time-tracker-content">
          <div className="current-time">
            <h3>Current Time Spent</h3>
            <div className="time-display">
              {Math.floor((task.timeSpent || 0) / 60)}h {(task.timeSpent || 0) % 60}m
            </div>
          </div>

          <form onSubmit={handleSubmit} className="time-form">
            <div className="time-input-group">
              <label>Add Time</label>
              <div className="time-inputs">
                <div className="time-input">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <span>hours</span>
                </div>
                <div className="time-input">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <span>minutes</span>
                </div>
              </div>
            </div>

            <div className="quick-add-buttons">
              <button type="button" onClick={() => handleQuickAdd(15)}>
                +15 min
              </button>
              <button type="button" onClick={() => handleQuickAdd(30)}>
                +30 min
              </button>
              <button type="button" onClick={() => handleQuickAdd(60)}>
                +1 hour
              </button>
              <button type="button" onClick={() => handleQuickAdd(120)}>
                +2 hours
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="Add notes about what you worked on..."
              />
            </div>

            {task.jiraIssueKey && (
              <div className="jira-sync-info">
                ⚡ Time will be synced to JIRA: {task.jiraIssueKey}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading || syncingJira}>
                {syncingJira ? 'Syncing to JIRA...' : loading ? 'Adding...' : 'Add Time'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
