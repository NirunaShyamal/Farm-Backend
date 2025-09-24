# 🚀 Farm Management System - Development Guide

## Quick Start Options

### Option 1: Use npm scripts (Recommended)
```bash
# Start both frontend and backend together
npm run dev

# Or start them individually
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

### Option 2: Use PowerShell script
```powershell
# Run the PowerShell script
.\start-dev.ps1
```

### Option 3: Use Batch file
```cmd
# Double-click or run from command prompt
start-dev.bat
```

### Option 4: Manual (PowerShell compatible)
```powershell
# Start backend
cd farm-backend; npm run dev

# In another terminal, start frontend
cd egg-farm; npm run dev
```

## Available Commands

### Root Level Commands
- `npm run dev` - Start both frontend and backend
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run install:all` - Install dependencies for all projects
- `npm run build` - Build frontend for production
- `npm run setup` - Complete setup (install + database setup)

### Database Commands
- `npm run db:init` - Initialize database
- `npm run db:seed` - Seed database with sample data
- `npm run db:status` - Check database status

## URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## Troubleshooting

### PowerShell Execution Policy Issues
If you get execution policy errors, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Command Chaining Issues
PowerShell doesn't support `&&` like bash. Use:
- `;` for sequential commands
- `npm scripts` for complex operations
- The provided scripts for convenience

## Project Structure
```
farm/
├── egg-farm/          # React frontend
├── farm-backend/      # Node.js backend
├── start-dev.ps1      # PowerShell startup script
├── start-dev.bat      # Batch startup script
└── package.json       # Root package with convenience scripts
```

