# PowerShell script to start development servers with robust database handling
# This script works perfectly with Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Farm Management System Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:MONGO_URI='mongodb+srv://codez:codez123@codez.7wxzojy.mongodb.net/farm_management?retryWrites=true&w=majority'
$env:DB_NAME='farm_management'
$env:NODE_ENV='development'
$env:PORT='5000'
$env:JWT_SECRET='your_jwt_secret_key_here_change_in_production_2024'
$env:FRONTEND_URL='http://localhost:5173'

Write-Host "📡 Environment variables set" -ForegroundColor Green
Write-Host "🔗 MongoDB URI: mongodb+srv://***:***@codez.7wxzojy.mongodb.net/farm_management" -ForegroundColor Gray
Write-Host "🗄️ Database: $env:DB_NAME" -ForegroundColor Gray
Write-Host "🌐 Port: $env:PORT" -ForegroundColor Gray
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Start backend server in background with robust error handling
Write-Host "📡 Starting backend server with auto-reconnection..." -ForegroundColor Yellow
$backendCommand = @"
cd farm-backend
if (-not (Test-Path 'node_modules')) {
    Write-Host '📦 Installing dependencies...' -ForegroundColor Yellow
    npm install
}
Write-Host '🔍 Checking database connection...' -ForegroundColor Yellow
node src/scripts/checkDatabaseStatus.js
Write-Host '🚀 Starting robust server...' -ForegroundColor Green
npm start
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server in background  
Write-Host "🎨 Starting frontend server..." -ForegroundColor Yellow
$frontendCommand = @"
cd egg-farm
if (-not (Test-Path 'node_modules')) {
    Write-Host '📦 Installing dependencies...' -ForegroundColor Yellow
    npm install
}
Write-Host '🚀 Starting frontend server...' -ForegroundColor Green
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers are starting up!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - If you see database connection issues, the server will auto-retry" -ForegroundColor Gray
Write-Host "   - Check the backend window for detailed connection status" -ForegroundColor Gray
Write-Host "   - Run 'npm run db:status' in farm-backend to check database health" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
