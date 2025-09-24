# Farm Management Server Startup Script for PowerShell
# This script provides a robust way to start the farm management server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Farm Management Server Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Please run this script from the farm-backend directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
}

# Check database connection
Write-Host "Checking database connection..." -ForegroundColor Yellow
try {
    node src/scripts/checkDatabaseStatus.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Database connection issues detected" -ForegroundColor Yellow
        Write-Host "The server will start anyway, but some features may not work" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Could not check database status" -ForegroundColor Yellow
}
Write-Host ""

# Start the server
Write-Host "Starting Farm Management Server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

try {
    node start-server.js
} catch {
    Write-Host "Server stopped" -ForegroundColor Yellow
}

Read-Host "Press Enter to exit"
