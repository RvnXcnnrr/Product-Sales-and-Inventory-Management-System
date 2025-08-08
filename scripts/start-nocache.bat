@echo off
echo Starting POS and Inventory Management System in no-cache mode...
echo.
echo This will prevent browser caching issues and page refresh loops
echo.

set BROWSER=none
set VITE_DISABLE_PWA=true
set VITE_ENABLE_PWA=false
set VITE_DEV_MODE=true
set VITE_DEBUG_MODE=true

echo Clearing browser cache and service workers...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --incognito --disable-application-cache --disable-cache --disable-service-worker-fetch-handler localhost:5173

echo Starting development server...
npm run dev
