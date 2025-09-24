@echo off
echo ========================================
echo    Farm Management Server Startup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found. Please run this script from the farm-backend directory.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
)

REM Check database connection
echo Checking database connection...
node src/scripts/checkDatabaseStatus.js
if %errorlevel% neq 0 (
    echo WARNING: Database connection issues detected
    echo The server will start anyway, but some features may not work
    echo.
)

REM Start the server
echo Starting Farm Management Server...
echo Press Ctrl+C to stop the server
echo.
node start-server.js

pause
