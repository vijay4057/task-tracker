import React, { useState, useEffect } from 'react';
import { jiraService, taskService } from '../services/api';
import './JiraSubtaskModal.css';

const JiraSubtaskModal = ({ task, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    parentIssueKey: '',
    title: task?.title || '',
    description: task?.description || '',
    createLocalTask: !task, // If task exists, don't create new local task
    targetDate: task?.targetDate ? task.targetDate.split('T')[0] : '',
    targetTime: task?.targetTime || '',
    priority: task?.priority || 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [jiraConfigured, setJiraConfigured] = useState(false);
  const [issueInfo, setIssueInfo] = useState(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkJiraConfig();
    // Pre-fill form if task exists
    if (task) {
      setFormData(prev => ({
        ...prev,
        title: task.title || '',
        description: task.description || '',
        targetDate: task.targetDate ? task.targetDate.split('T')[0] : '',
        targetTime: task.targetTime || '',
        priority: task.priority || 'medium'
      }));
    }
  }, [task]);

  const checkJiraConfig = async () => {
    try {
      const response = await jiraService.getConfig();
      setJiraConfigured(response.data.configured);
    } catch (error) {
      console.error('Error checking JIRA config:', error);
    }
  };

  const validateIssueKey = async (issueKey) => {
    if (!issueKey) {
      setIssueInfo(null);
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const response = await jiraService.getIssue(issueKey);
      setIssueInfo({
        key: response.data.key,
        summary: response.data.summary,
        status: response.data.status,
        project: response.data.project
      });
    } catch (error) {
      setIssueInfo(null);
      setError('Invalid issue key or issue not found');
    } finally {
      setValidating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'parentIssueKey') {
      validateIssueKey(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let jiraSubtaskKey = null;

      // Create JIRA subtask if configured
      if (jiraConfigured && formData.parentIssueKey) {
        try {
          const jiraResponse = await jiraService.createSubtask({
            parentIssueKey: formData.parentIssueKey,
            title: formData.title,
            description: formData.description
          });
          jiraSubtaskKey = jiraResponse.data.issueKey;
        } catch (jiraError) {
          console.error('JIRA subtask creation failed:', jiraError);
          setError(`JIRA Error: ${jiraError.response?.data?.error || jiraError.message}`);
          setLoading(false);
          return;
        }
      }

      // If task exists, update it with JIRA key; otherwise create new task if requested
      if (task) {
        // Update existing task with JIRA issue key
        // The parent component will handle the update
        onSuccess(jiraSubtaskKey);
      } else if (formData.createLocalTask) {
        // Create new local task
        let targetDate = formData.targetDate;
        if (targetDate && formData.targetTime) {
          targetDate = `${targetDate}T${formData.targetTime}:00`;
        } else if (targetDate) {
          targetDate = `${targetDate}T00:00:00`;
        }

        const taskData = {
          title: formData.title,
          description: formData.description + (jiraSubtaskKey ? `\n\nJIRA: ${jiraSubtaskKey}` : ''),
          targetDate: targetDate || null,
          targetTime: formData.targetTime || null,
          status: 'pending',
          priority: formData.priority,
          jiraIssueKey: jiraSubtaskKey
        };

        await taskService.createTask(taskData);
        onSuccess(jiraSubtaskKey);
      } else {
        onSuccess(jiraSubtaskKey);
      }

      onClose();
    } catch (error) {
      console.error('Error creating subtask:', error);
      setError(error.response?.data?.error || 'Failed to create subtask');
    } finally {
      setLoading(false);
    }
  };

  if (!jiraConfigured) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content jira-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>JIRA Not Configured</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="jira-config-message">
            <p>JIRA integration is not configured. Please set the following environment variables in the backend:</p>
            <ul>
              <li><code>JIRA_BASE_URL</code> - Your JIRA instance URL (e.g., https://yourcompany.atlassian.net)</li>
              <li><code>JIRA_EMAIL</code> - Your JIRA email address</li>
              <li><code>JIRA_API_TOKEN</code> - Your JIRA API token</li>
            </ul>
            <p>You can still create local tasks without JIRA integration.</p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content jira-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? `Link Task to JIRA: ${task.title}` : 'Create JIRA Subtask'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="jira-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="parentIssueKey">
              Parent Issue Key (User Story/Task ID) *
              <span className="help-text">e.g., PROJ-123, STORY-456</span>
            </label>
            <input
              type="text"
              id="parentIssueKey"
              name="parentIssueKey"
              value={formData.parentIssueKey}
              onChange={handleChange}
              required
              placeholder="PROJ-123"
              className={validating ? 'validating' : ''}
            />
            {validating && <span className="validating-indicator">Validating...</span>}
            {issueInfo && (
              <div className="issue-info">
                <strong>✓ {issueInfo.key}</strong>: {issueInfo.summary}
                <br />
                <small>Status: {issueInfo.status} | Project: {issueInfo.project}</small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="title">Subtask Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter subtask title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Enter subtask description"
            />
          </div>

          {!task && (
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="createLocalTask"
                  checked={formData.createLocalTask}
                  onChange={handleChange}
                />
                Also create local task in Task Tracker
              </label>
            </div>
          )}

          {task && (
            <div className="task-info-box">
              <strong>Linking existing task:</strong> {task.title}
              {task.jiraIssueKey && (
                <div className="existing-jira-link">
                  Currently linked to: <strong>{task.jiraIssueKey}</strong>
                </div>
              )}
            </div>
          )}

          {(formData.createLocalTask || task) && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetDate">Target Date</label>
                  <input
                    type="date"
                    id="targetDate"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="targetTime">Target Time</label>
                  <input
                    type="time"
                    id="targetTime"
                    name="targetTime"
                    value={formData.targetTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading || validating}>
              {loading ? (task ? 'Linking...' : 'Creating...') : (task ? 'Link to JIRA' : 'Create Subtask')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JiraSubtaskModal;
