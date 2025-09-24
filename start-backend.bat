@echo off
echo ========================================
echo    Farm Management Backend Server
echo ========================================
echo.

REM Set environment variables
set MONGO_URI=mongodb+srv://codez:codez123@codez.7wxzojy.mongodb.net/farm_management?retryWrites=true&w=majority
set DB_NAME=farm_management
set NODE_ENV=development
set PORT=5000
set JWT_SECRET=your_jwt_secret_key_here_change_in_production_2024
set FRONTEND_URL=http://localhost:5173

echo 📡 Environment variables set
echo 🔗 MongoDB URI: mongodb+srv://***:***@codez.7wxzojy.mongodb.net/farm_management
echo 🗄️ Database: %DB_NAME%
echo 🌐 Port: %PORT%
echo.

cd farm-backend
echo 📂 Changed to farm-backend directory

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully!
    echo.
)

REM Check database connection
echo 🔍 Checking database connection...
node src/scripts/checkDatabaseStatus.js
if %errorlevel% neq 0 (
    echo ⚠️ Database connection issues detected
    echo The server will start anyway, but some features may not work
    echo.
)

echo 🚀 Starting robust server with auto-reconnection...
echo Press Ctrl+C to stop the server
echo.
npm start



