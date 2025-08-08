@echo off
REM Run this script to apply the authentication and security fixes

echo Applying authentication and security fixes...

REM Check if we have Supabase credentials
set ENV_FILE=.env.local
if exist %ENV_FILE% (
  for /f "tokens=*" %%a in (%ENV_FILE%) do set %%a
) else (
  echo Warning: No .env.local file found
)

if "%VITE_SUPABASE_URL%"=="" (
  echo Error: Supabase URL not found. Please set VITE_SUPABASE_URL in .env.local
  exit /b 1
)

if "%VITE_SUPABASE_ANON_KEY%"=="" (
  echo Error: Supabase anon key not found. Please set VITE_SUPABASE_ANON_KEY in .env.local
  exit /b 1
)

REM Get Supabase credentials for direct DB access
echo Please enter your Supabase database password:
set /p DB_PASSWORD=

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% equ 0 (
  REM Extract host and database from URL
  for /f "tokens=*" %%a in ('echo %VITE_SUPABASE_URL% ^| findstr /r "https\?://.*\.supabase\.co"') do (
    set DB_URL=%%a
  )
  
  set DB_HOST=%DB_URL:https://=%
  set DB_HOST=%DB_HOST:.supabase.co=%
  set DB_HOST=%DB_HOST%.supabase.co
  set DB_PORT=5432
  set DB_NAME=postgres
  set DB_USER=postgres
  
  REM Apply RLS policies
  echo Applying enhanced security policies...
  set PGPASSWORD=%DB_PASSWORD%
  psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f enhanced-security-policies.sql
  
  REM Apply user-store creation trigger
  echo Updating user registration trigger...
  psql -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -U %DB_USER% -f user-store-creation-trigger.sql
  
  echo Database migrations applied successfully!
) else (
  echo Error: psql command not found. Please install PostgreSQL client tools or apply the SQL files manually.
  echo The SQL files are: enhanced-security-policies.sql and user-store-creation-trigger.sql
)

echo Authentication and security fixes have been applied.
echo Please restart your application to see the changes.
