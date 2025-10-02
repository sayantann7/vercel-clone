@echo off
echo ========================================
echo Installing Backend Deployment Dependencies
echo ========================================
echo.

echo Installing dependencies for vercel-be-request-handler...
cd vercel-be-request-handler
call npm install redis http-proxy-middleware
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies for vercel-be-request-handler
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Building Backend Deploy Service...
echo ========================================
cd ..\vercel-be-deploy-service
call tsc -b
if %errorlevel% neq 0 (
    echo ERROR: Failed to build vercel-be-deploy-service
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Building Backend Request Handler...
echo ========================================
cd ..\vercel-be-request-handler
call tsc -b
if %errorlevel% neq 0 (
    echo ERROR: Failed to build vercel-be-request-handler
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Building Upload Service...
echo ========================================
cd ..\vercel-upload-service
call tsc -b
if %errorlevel% neq 0 (
    echo ERROR: Failed to build vercel-upload-service
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start all services using PM2 or manually
echo 2. Configure your reverse proxy (nginx/Apache)
echo 3. Test both frontend and backend deployments
echo.
echo See BACKEND_DEPLOYMENT_SETUP.md for detailed instructions
echo.
pause
