@echo off
REM One-command bootstrap for Knip (Windows).
REM
REM   Checks that Node.js is installed, installs it via winget if missing,
REM   then runs the official Knip setup: `npm init @knip/config`.
REM
REM Usage - a single command that does everything:
REM   setup.bat
REM   :: or from cmd, without cloning anything:
REM   curl -fsSL https://raw.githubusercontent.com/IndianCoder3/knip-fork/main/setup.bat -o %temp%\knip-setup.bat && %temp%\knip-setup.bat
REM
setlocal enabledelayedexpansion

echo.
echo === Checking for Node.js ===

where node >nul 2>nul
if %errorlevel%==0 (
  for /f "delims=" %%v in ('node --version') do set NODEVER=%%v
  echo   [OK] Node.js !NODEVER! found
  goto :haveNode
)

echo   Node.js not found. Installing via winget...

where winget >nul 2>nul
if %errorlevel%==0 (
  winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  if errorlevel 1 goto :fail
) else (
  echo   winget not found. Please install Node.js LTS from https://nodejs.org and re-run.
  goto :fail
)

where node >nul 2>nul
if %errorlevel%==0 (
  for /f "delims=" %%v in ('node --version') do set NODEVER=%%v
  echo   [OK] Node.js !NODEVER! installed
) else (
  echo   Node.js not detected after install. Open a new terminal and re-run.
  goto :fail
)

:haveNode
where npm >nul 2>nul
if %errorlevel%==0 goto :setup

echo   npm not found (it ships with Node.js). Check your installation.
goto :fail

:setup
echo.
echo === Running Knip setup (this installs dependencies and configures knip) ===
call npm init @knip/config
if errorlevel 1 goto :fail

call :shortcut

echo.
echo Done.
echo   [OK] Run Knip with: npm run knip
echo   [OK] Shortcut created in the Start Menu: "Knip"
exit /b 0

:shortcut
for %%I in ("%CD%") do set KPROJ=%%~fI
set "SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Knip.lnk"
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%SHORTCUT%'); $s.TargetPath='powershell.exe'; $s.Arguments='-NoExit -Command \"cd ''%KPROJ%''; npm run knip\"'; $s.IconLocation='powershell.exe,0'; $s.Save()"
if %errorlevel%==0 (
  echo   [OK] Created Start Menu shortcut
) else (
  echo   [WARN] Could not create Start Menu shortcut
)
exit /b 0

:fail
echo.
echo Setup failed. See the messages above.
exit /b 1
