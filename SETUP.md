````markdown
# Task Tracker - Setup and Deployment Guide

This guide explains how to set up and use the Task Tracker application on any system, and how to make it accessible to others.

## Prerequisites

Before setting up the application, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A modern web browser (Chrome, Firefox, Edge, Safari)

## Local Setup (For Personal Use)

### Step 1: Copy the Project

Copy the entire `task-tracker` folder to the target system.

### Step 2: Install Dependencies

1. **Install Backend Dependencies:**
   ```bash
   cd task-tracker/backend
   npm install
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Step 3: Start the Application

You need to run both the backend and frontend servers:

**Terminal 1 - Backend Server:**
```bash
cd task-tracker/backend
npm start
```
The backend will run on `http://localhost:5000`

**Terminal 2 - Frontend Application:**
```bash
cd task-tracker/frontend
npm start
```
The frontend will automatically open in your browser at `http://localhost:3000`

### Step 4: Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

## Making the App Accessible to Others

There are several ways to make the app accessible to other users:

### Option 1: Local Network Access (Same WiFi/LAN)

If other users are on the same network, you can make the app accessible:

1. **Find your local IP address:**
   - Windows: Run `ipconfig` in Command Prompt, look for "IPv4 Address"
   - Mac/Linux: Run `ifconfig` or `ip addr`, look for your network interface IP

2. **Update Frontend API Configuration:**
   Edit `task-tracker/frontend/src/services/api.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000/api';
   // Example: const API_BASE_URL = 'http://192.168.1.100:5000/api';
   ```

3. **Start Backend with Network Access:**
   The backend should already accept connections from other devices on the network.

4. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```
   Note: React dev server usually binds to `0.0.0.0` by default, making it accessible on the network.

5. **Access from Other Devices:**
   Other users on the same network can access:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

### Option 2: Production Build (Recommended for Sharing)

Create a production build that can be served:

1. **Build the Frontend:**
   ```bash
   cd task-tracker/frontend
   npm run build
   ```
   This creates an optimized production build in the `build` folder.

2. **Serve the Production Build:**
   
   **Option A: Using serve (simple):**
   ```bash
   npm install -g serve
   cd task-tracker/frontend
   serve -s build -l 3000
   ```

   **Option B: Using Express (more control):**
   Create `task-tracker/backend/public` folder and copy the build contents there.
   Update `task-tracker/backend/server.js` to serve static files:
   ```javascript
   // Add this after middleware setup
   app.use(express.static(path.join(__dirname, 'public')));
   
   // Add this before API routes
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'public', 'index.html'));
   });
   ```

3. **Start Backend:**
   ```bash
   cd task-tracker/backend
   npm start
   ```

4. **Access:**
   Users can access the app at `http://YOUR_IP_ADDRESS:5000`

### Option 3: Cloud Deployment

Deploy to cloud platforms for global access:

#### Deploy to Heroku:

1. **Install Heroku CLI** - [Download here](https://devcenter.heroku.com/articles/heroku-cli)

2. **Create Heroku App:**
   ```bash
   cd task-tracker
   heroku create your-app-name
   ```

3. **Configure for Heroku:**
   - Create `Procfile` in root:
     ```
     web: cd backend && node server.js
     ```
   - Update `backend/server.js` to use `process.env.PORT`
   - Build frontend and serve from backend

4. **Deploy:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

#### Deploy to Vercel/Netlify (Frontend) + Railway/Render (Backend):

**Backend (Railway/Render):**
1. Push backend code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

**Frontend (Vercel/Netlify):**
1. Build frontend: `npm run build`
2. Update API URL to point to deployed backend
3. Deploy build folder to Vercel/Netlify

## Configuration for Different Environments

### Development (Local)
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### Production (Same Server)
- Backend: `http://your-domain.com:5000` or `http://your-domain.com/api`
- Frontend: `http://your-domain.com`

### Network Access
- Backend: `http://YOUR_IP:5000`
- Frontend: `http://YOUR_IP:3000` (dev) or `http://YOUR_IP:5000` (production build)

## Important Notes

1. **Data Storage:** Tasks are stored in `backend/data/tasks.json`. Make sure this file is backed up if you want to preserve data.

2. **Security:** The current setup is for development. For production:
   - Add authentication
   - Use environment variables for sensitive data
   - Enable HTTPS
   - Add rate limiting
   - Validate and sanitize inputs

3. **Port Configuration:** 
   - Backend default port: 5000 (change in `backend/server.js`)
   - Frontend dev port: 3000 (change in `frontend/package.json`)

4. **Firewall:** If others can't access, check firewall settings to allow connections on ports 3000 and 5000.

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- Backend: Change `PORT` in `backend/server.js`
- Frontend: Set `PORT=3001 npm start` (or edit `package.json`)

### CORS Errors
If you see CORS errors, ensure the backend `cors` middleware is properly configured in `backend/server.js`.

### Cannot Access from Other Devices
- Ensure all devices are on the same network
- Check firewall settings
- Verify IP address is correct
- Try accessing from the host machine first

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

## Quick Start Script

Create a `start.sh` (Linux/Mac) or `start.bat` (Windows) file:

**start.sh (Linux/Mac):**
```bash
#!/bin/bash
cd backend && npm start &
cd frontend && npm start
```

**start.bat (Windows):**
```batch
@echo off
start cmd /k "cd backend && npm start"
start cmd /k "cd frontend && npm start"
```

Make executable (Linux/Mac): `chmod +x start.sh`

## Support

For issues or questions, check:
- Node.js version compatibility
- Port availability
- Network connectivity
- Firewall settings


````