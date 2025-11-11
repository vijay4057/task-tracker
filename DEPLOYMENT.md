````markdown
# Deployment Guide

This guide covers different ways to deploy and share your Task Tracker application.

## Option 1: Local Network Sharing (Same WiFi/LAN)

Perfect for sharing with colleagues or family on the same network.

### Steps:

1. **Find Your IP Address:**
   - **Windows:** Open Command Prompt, run `ipconfig`, look for "IPv4 Address"
   - **Mac/Linux:** Run `ifconfig` or `ip addr`, find your network interface IP
   - Example: `192.168.1.100`

2. **Update API Configuration:**
   Edit `frontend/src/services/api.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000/api';
   // Example: const API_BASE_URL = 'http://192.168.1.100:5000/api';
   ```

3. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

4. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

5. **Share Access:**
   - Other users on the same network can access: `http://YOUR_IP_ADDRESS:3000`
   - Make sure your firewall allows connections on ports 3000 and 5000

## Option 2: Production Build (Recommended)

Create an optimized build that can be served from a single server.

### Steps:

1. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   ```
   This creates a `build` folder with optimized files.

2. **Update Backend to Serve Frontend:**

   Edit `backend/server.js`, add before the API routes:
   ```javascript
   const express = require('express');
   const path = require('path');
   
   // ... existing code ...
   
   // Serve static files from React app
   app.use(express.static(path.join(__dirname, '../frontend/build')));
   
   // API routes here (existing routes)
   
   // Send React app for all other routes
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
   });
   ```

3. **Update API URL for Production:**
   Edit `frontend/src/services/api.js`:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
   ```
   Or create `.env` in frontend folder:
   ```
   REACT_APP_API_URL=/api
   ```

4. **Rebuild Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

5. **Start Server:**
   ```bash
   cd backend
   npm start
   ```

6. **Access:**
   - Single URL: `http://localhost:5000` or `http://YOUR_IP:5000`
   - Both frontend and backend served from one port

## Option 3: Cloud Deployment

### Deploy to Heroku

1. **Install Heroku CLI:** [Download](https://devcenter.heroku.com/articles/heroku-cli)

2. **Prepare for Heroku:**
   
   Create `Procfile` in root:
   ```
   web: cd backend && node server.js
   ```
   
   Update `backend/server.js`:
   ```javascript
   const PORT = process.env.PORT || 5000;
   ```
   
   Update `backend/package.json`:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

3. **Deploy:**
   ```bash
   heroku login
   heroku create your-app-name
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

4. **Access:** `https://your-app-name.herokuapp.com`

### Deploy to Vercel (Frontend) + Railway (Backend)

**Backend on Railway:**
1. Push code to GitHub
2. Go to [Railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Select repository
5. Set root directory: `backend`
6. Deploy

**Frontend on Vercel:**
1. Build frontend: `npm run build`
2. Update API URL to Railway backend URL
3. Go to [Vercel.com](https://vercel.com)
4. Import project → Select frontend folder
5. Deploy

## Option 4: Docker Deployment

### Create Dockerfile

**backend/Dockerfile:**
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:16 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend/data:/app/data
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

**Run:**
```bash
docker-compose up -d
```

## Environment Variables

Create `.env` files for configuration:

**backend/.env:**
```
PORT=5000
NODE_ENV=production
```

**frontend/.env:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Security Considerations

For production deployment:

1. **Add Authentication:**
   - Implement user login/signup
   - Use JWT tokens
   - Protect API routes

2. **Enable HTTPS:**
   - Use SSL certificates
   - Configure reverse proxy (nginx)

3. **Rate Limiting:**
   - Add rate limiting middleware
   - Prevent abuse

4. **Input Validation:**
   - Validate all inputs
   - Sanitize data
   - Prevent SQL injection (if using database later)

5. **CORS Configuration:**
   - Restrict CORS to specific domains
   - Don't use `*` in production

## Troubleshooting

### Port Issues
- Change ports in configuration files
- Check firewall settings
- Ensure ports aren't in use

### CORS Errors
- Verify backend CORS settings
- Check API URL configuration
- Ensure backend is accessible

### Build Errors
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Review error messages

## Quick Reference

| Method | Best For | Complexity |
|--------|---------|------------|
| Local Network | Same office/home | Easy |
| Production Build | Single server | Medium |
| Heroku | Quick cloud deploy | Medium |
| Docker | Containerized apps | Advanced |
| Vercel+Railway | Separate frontend/backend | Medium |

Choose the method that best fits your needs!


````