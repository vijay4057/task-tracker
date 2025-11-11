@echo off
echo Starting Task Tracker Application...
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Application...
start "Frontend App" cmd /k "cd frontend && npm start"
echo.
echo Both servers are starting...
echo Backend will be available at http://localhost:5000
echo Frontend will be available at http://localhost:3000
echo.
pause
