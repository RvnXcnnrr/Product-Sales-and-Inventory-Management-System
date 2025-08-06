@echo off
title POS & Inventory Management System - Quick Start

echo 🚀 POS & Inventory Management System - Quick Start
echo =================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

echo ✅ Project files found

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env file exists
echo.
if not exist ".env" (
    echo ⚠️  No .env file found. Creating from template...
    if exist ".env.template" (
        copy ".env.template" ".env" >nul
        echo 📝 .env file created from template
        echo.
        echo ⚠️  IMPORTANT: You need to configure your Supabase credentials in .env file
        echo    1. Go to https://supabase.com and create a new project
        echo    2. Get your Project URL and API Key from Settings ^> API
        echo    3. Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
        echo    4. Follow SETUP.md for database schema setup
    ) else (
        echo ❌ .env.template not found
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

REM Check if Supabase is configured
echo.
findstr "your_supabase_project_url_here" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Supabase not configured yet. The app will run with mock data.
    echo    Configure Supabase following SETUP.md for full functionality.
) else (
    echo ✅ Supabase appears to be configured
)

REM Start development server
echo.
echo 🎯 Starting development server...
echo    The application will open at http://localhost:3000
echo    Press Ctrl+C to stop the server
echo.

REM Demo credentials info
echo 🔑 Demo Credentials (for testing):
echo    Email: demo@example.com
echo    Password: demo123
echo.

timeout /t 2 >nul

REM Start the dev server
call npm run dev

pause
