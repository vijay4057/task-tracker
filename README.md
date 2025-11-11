````markdown
# Task Tracker Application

A comprehensive task tracking web application built with React frontend and Node.js/Express backend with file-based storage.

## Features

- ✅ **Task Management**: Create, update, and delete tasks
- ⏱️ **Time Tracking**: Charge time to tasks with detailed time entries
- 🔔 **Reminders**: Automatic reminders for overdue and upcoming tasks
- 📊 **Dashboard**: Daily focus view with today's tasks and statistics
- 📅 **Calendar View**: Visual calendar showing tasks by date with add/remove capabilities
- 🎨 **Modern UI**: Beautiful, responsive design with gradient themes

## Project Structure

```
task-tracker/
├── backend/          # Node.js/Express API server
│   ├── server.js     # Main server file
│   ├── package.json  # Backend dependencies
│   └── data/         # JSON file storage (created automatically)
└── frontend/         # React application
    ├── src/
    │   ├── components/  # React components
    │   ├── services/    # API service layer
    │   └── App.js       # Main app component
    └── package.json     # Frontend dependencies
```

## Quick Start

### For Local Use (Single User)

1. **Install Dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Start the Application:**
   
   **Windows:** Double-click `start.bat` or run it from command prompt
   
   **Linux/Mac:** Run `chmod +x start.sh && ./start.sh`
   
   **Manual Start:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

3. **Access:** Open `http://localhost:3000` in your browser

### For Multiple Users / Network Access

See **[SETUP.md](SETUP.md)** for detailed instructions on:
- Setting up on other systems
- Making the app accessible on local network
- Creating production builds
- Deploying to cloud platforms (Heroku, Vercel, etc.)

### Prerequisites

- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)
- Modern web browser

### Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Use the navigation menu to access:
   - **Dashboard**: View today's tasks and focus areas
   - **Tasks**: Manage all your tasks with filtering and sorting
   - **Calendar**: Visual calendar view with task management
3. Click the bell icon in the header to see reminders
4. Click the profile icon to access profile settings (placeholder)

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `POST /api/tasks/:id/time` - Add time entry to a task
- `GET /api/tasks/date/:date` - Get tasks for a specific date
- `GET /api/tasks/reminders` - Get overdue and upcoming tasks

## Data Storage

Tasks are stored in `backend/data/tasks.json` as a JSON file. The file is automatically created when the server starts.

## Features in Detail

### Task Management
- Create tasks with title, description, target date/time, priority, and status
- Update task details
- Delete tasks
- Mark tasks as completed

### Time Tracking
- Add time entries to tasks
- Quick-add buttons for common time increments
- View total time spent on each task
- Add notes to time entries

### Reminders
- Automatic detection of overdue tasks
- Upcoming tasks (within 24 hours)
- Visual indicators in the header
- Reminder dropdown with task details

### Dashboard
- Today's tasks overview
- Statistics cards (today's tasks, overdue, upcoming, completed)
- Quick status updates
- Priority indicators

### Calendar View
- Monthly calendar with task counts
- Click on dates to view tasks
- Add tasks directly from calendar view
- Visual indicators for dates with tasks
- Overdue task highlighting

## Technologies Used

- **Frontend**: React, React Router, React Calendar, Axios, date-fns
- **Backend**: Node.js, Express, CORS, fs-extra
- **Storage**: JSON file-based storage

## License

ISC


````