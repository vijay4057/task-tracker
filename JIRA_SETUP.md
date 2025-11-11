````markdown
# JIRA Integration Setup Guide

This guide explains how to configure JIRA integration for the Task Tracker application.

## Prerequisites

- A JIRA account with API access
- A JIRA API token
- Your JIRA instance URL

## Step 1: Get Your JIRA API Token

1. Log in to your JIRA instance
2. Go to: **Account Settings** → **Security** → **API tokens**
3. Click **Create API token**
4. Give it a label (e.g., "Task Tracker")
5. Copy the generated token (you'll only see it once!)

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend` folder or set environment variables:

### Windows (Command Prompt)
```batch
set JIRA_BASE_URL=https://yourcompany.atlassian.net
set JIRA_EMAIL=your.email@company.com
set JIRA_API_TOKEN=your_api_token_here
```

### Windows (PowerShell)
```powershell
$env:JIRA_BASE_URL="https://yourcompany.atlassian.net"
$env:JIRA_EMAIL="your.email@company.com"
$env:JIRA_API_TOKEN="your_api_token_here"
```

### Linux/Mac
```bash
export JIRA_BASE_URL=https://yourcompany.atlassian.net
export JIRA_EMAIL=your.email@company.com
export JIRA_API_TOKEN=your_api_token_here
```

### Using .env file (Recommended)

Create `backend/.env`:
```
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your.email@company.com
JIRA_API_TOKEN=your_api_token_here
```

**Note:** For production, use a package like `dotenv` to load environment variables:
```bash
npm install dotenv
```

Then add at the top of `backend/server.js`:
```javascript
require('dotenv').config();
```

## Step 3: Verify Configuration

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Check the console - you should see:
   - ✅ No warning about JIRA configuration
   - ✅ Server running message

3. Test the configuration endpoint:
   ```bash
   curl http://localhost:5000/api/jira/config
   ```
   
   Should return:
   ```json
   {
     "configured": true,
     "baseURL": "https://yourcompany.atlassian.net",
     "email": "you***"
   }
   ```

## Step 4: Using JIRA Integration

### Creating a JIRA Subtask

1. Click **"🔗 Create JIRA Subtask"** button in the Dashboard
2. Enter the **Parent Issue Key** (e.g., PROJ-123, STORY-456)
   - The system will validate the issue key
3. Enter the **Subtask Title**
4. (Optional) Add a description
5. Choose whether to also create a local task
6. Click **"Create Subtask"**

### Time Logging to JIRA

When you track time for a task that has a JIRA issue key:
- Time is automatically logged to the JIRA issue
- You'll see a message: "⚡ Time will be synced to JIRA: PROJ-123"
- Time entries include notes as comments in JIRA

## Troubleshooting

### "JIRA not configured" Error

- Check that all three environment variables are set
- Restart the backend server after setting variables
- Verify the `.env` file is in the `backend` folder

### "Invalid issue key" Error

- Ensure the issue key format is correct (e.g., PROJ-123)
- Verify you have access to the issue in JIRA
- Check that the issue exists and is not deleted

### "Failed to create subtask" Error

- Verify the parent issue allows subtasks
- Check that your JIRA account has permission to create subtasks
- Ensure the project has subtask issue type enabled

### "Failed to log work" Error

- Verify the JIRA issue key is correct
- Check that you have permission to log work on the issue
- Ensure the issue is not in a status that prevents work logging

### CORS Errors

If you see CORS errors, ensure your JIRA instance allows requests from your backend server.

## API Endpoints

The following JIRA endpoints are available:

- `GET /api/jira/config` - Check JIRA configuration status
- `POST /api/jira/subtask` - Create a JIRA subtask
- `POST /api/jira/worklog` - Log work to a JIRA issue
- `GET /api/jira/issue/:issueKey` - Get JIRA issue information

## Security Notes

- **Never commit** your `.env` file to version control
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate API tokens regularly
- Use read-only tokens if possible for time logging

## Example Usage

### Creating a Subtask via API

```bash
curl -X POST http://localhost:5000/api/jira/subtask \
  -H "Content-Type: application/json" \
  -d '{
    "parentIssueKey": "PROJ-123",
    "title": "Implement feature X",
    "description": "Detailed description here"
  }'
```

### Logging Work via API

```bash
curl -X POST http://localhost:5000/api/jira/worklog \
  -H "Content-Type: application/json" \
  -d '{
    "issueKey": "PROJ-123",
    "timeSpentMinutes": 120,
    "comment": "Worked on implementation"
  }'
```

## Support

For JIRA API documentation, visit:
- [JIRA REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [JIRA API Authentication](https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/)


````