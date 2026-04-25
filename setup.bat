@echo off
echo ===================================
echo   TaskMe GitHub Setup Quick Start
echo ===================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PowerShell not found
    echo Please install PowerShell or run setup manually
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "scripts\setup-github.ps1"

pause
