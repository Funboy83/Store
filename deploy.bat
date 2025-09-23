@echo off
REM Firebase Deployment Script for Windows
REM This script handles both static hosting and app hosting deployment

echo 🔥 Firebase Deployment Script
echo ==============================

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not found. Installing...
    npm install -g firebase-tools
)

REM Environment setup
echo 📝 Checking environment configuration...
if not exist ".env.local" (
    echo ⚠️  .env.local not found. Please copy .env.example to .env.local and configure your Firebase settings.
    exit /b 1
)

REM Build the project
echo 🏗️  Building project...
npm run build

if errorlevel 1 (
    echo ❌ Build failed. Please fix build errors before deploying.
    exit /b 1
)

REM Deploy based on user choice
echo 🚀 Choose deployment type:
echo 1) Static Web Hosting (firebase.json)
echo 2) App Hosting (apphosting.yaml)
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo 📦 Deploying to Firebase Static Hosting...
    firebase deploy --only hosting
) else if "%choice%"=="2" (
    echo 🚀 Deploying to Firebase App Hosting...
    firebase deploy --only apphosting
) else (
    echo ❌ Invalid choice. Exiting.
    exit /b 1
)

echo ✅ Deployment complete!
pause