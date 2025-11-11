const axios = require('axios');

class JiraService {
  constructor() {
    this.baseURL = process.env.JIRA_BASE_URL || '';
    this.email = process.env.JIRA_EMAIL || '';
    this.apiToken = process.env.JIRA_API_TOKEN || '';
  }

  getAuthHeader() {
    if (!this.email || !this.apiToken) {
      throw new Error('JIRA credentials not configured');
    }
    const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return `Basic ${auth}`;
  }

  async createSubtask(parentIssueKey, summary, description = '') {
    try {
      if (!this.baseURL || !this.email || !this.apiToken) {
        throw new Error('JIRA not configured. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN');
      }

      // First, get the parent issue to determine project key
      const parentIssue = await this.getIssue(parentIssueKey);
      const projectKey = parentIssue.fields.project.key;

      // Get issue types to find subtask type
      const issueTypes = await this.getIssueTypes(projectKey);
      const subtaskType = issueTypes.find(type => type.subtask === true);

      if (!subtaskType) {
        throw new Error('Subtask issue type not found for this project');
      }

      const response = await axios.post(
        `${this.baseURL}/rest/api/3/issue`,
        {
          fields: {
            project: {
              key: projectKey
            },
            parent: {
              key: parentIssueKey
            },
            summary: summary,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: description || ''
                    }
                  ]
                }
              ]
            },
            issuetype: {
              id: subtaskType.id
            }
          }
        },
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        issueKey: response.data.key,
        issueId: response.data.id,
        url: `${this.baseURL}/browse/${response.data.key}`
      };
    } catch (error) {
      console.error('JIRA create subtask error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessages?.join(', ') || error.message);
    }
  }

  async getIssue(issueKey) {
    try {
      const response = await axios.get(
        `${this.baseURL}/rest/api/3/issue/${issueKey}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('JIRA get issue error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessages?.join(', ') || error.message);
    }
  }

  async getIssueTypes(projectKey) {
    try {
      const response = await axios.get(
        `${this.baseURL}/rest/api/3/project/${projectKey}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json'
          },
          params: {
            expand: 'issueTypes'
          }
        }
      );
      return response.data.issueTypes || [];
    } catch (error) {
      console.error('JIRA get issue types error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessages?.join(', ') || error.message);
    }
  }

  async logWork(issueKey, timeSpentSeconds, comment = '', started = null) {
    try {
      if (!this.baseURL || !this.email || !this.apiToken) {
        throw new Error('JIRA not configured');
      }

      const worklogData = {
        timeSpentSeconds: timeSpentSeconds,
        comment: comment || 'Time logged from Task Tracker'
      };

      if (started) {
        worklogData.started = started;
      }

      const response = await axios.post(
        `${this.baseURL}/rest/api/3/issue/${issueKey}/worklog`,
        worklogData,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        worklogId: response.data.id
      };
    } catch (error) {
      console.error('JIRA log work error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessages?.join(', ') || error.message);
    }
  }

  async updateWorklog(issueKey, worklogId, timeSpentSeconds, comment = '') {
    try {
      const worklogData = {
        timeSpentSeconds: timeSpentSeconds,
        comment: comment || 'Time updated from Task Tracker'
      };

      const response = await axios.put(
        `${this.baseURL}/rest/api/3/issue/${issueKey}/worklog/${worklogId}`,
        worklogData,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        worklogId: response.data.id
      };
    } catch (error) {
      console.error('JIRA update worklog error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessages?.join(', ') || error.message);
    }
  }
}

module.exports = new JiraService();
