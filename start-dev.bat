@echo off
echo 🚀 Starting Farm Management System Development Servers...

echo 📡 Starting backend server...
start "Backend Server" cmd /k "cd farm-backend && npm run dev"

timeout /t 2 /nobreak >nul

echo 🎨 Starting frontend server...
start "Frontend Server" cmd /k "cd egg-farm && npm run dev"

echo ✅ Both servers are starting up!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul

