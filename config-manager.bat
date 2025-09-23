@echo off
echo Firebase Studio - Configuration Manager
echo ========================================
echo.
echo Select deployment configuration:
echo.
echo 1) App Hosting (Full Next.js features - Recommended)
echo 2) Static Hosting (Static export only)
echo 3) Show current configuration
echo 4) Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Switching to App Hosting configuration...
    copy /Y next.config.apphosting.ts next.config.ts >nul
    echo ✅ Configuration updated for Firebase App Hosting
    echo ℹ️  Use: npm run firebase:apphosting
) else if "%choice%"=="2" (
    echo.
    echo Switching to Static Hosting configuration...
    copy /Y next.config.static.ts next.config.ts >nul
    echo ✅ Configuration updated for Static Hosting
    echo ℹ️  Use: npm run firebase:hosting
) else if "%choice%"=="3" (
    echo.
    echo Current next.config.ts:
    echo =====================
    type next.config.ts
) else if "%choice%"=="4" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    pause
    goto :EOF
)

echo.
echo Would you like to build and deploy now? (y/n)
set /p deploy="Enter choice: "

if /i "%deploy%"=="y" (
    echo.
    echo Building project...
    npm run build
    
    if errorlevel 1 (
        echo ❌ Build failed. Please fix errors before deploying.
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Build successful!
    
    if "%choice%"=="1" (
        echo Deploying to Firebase App Hosting...
        firebase deploy --only apphosting
    ) else if "%choice%"=="2" (
        echo Deploying to Firebase Static Hosting...
        firebase deploy --only hosting
    )
    
    echo.
    echo ✅ Deployment complete!
)

echo.
pause