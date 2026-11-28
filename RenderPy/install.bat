@echo off
setlocal enabledelayedexpansion
title RenderPy Setup

:: ============================================================
::  RenderPy -- Setup Script for New PC
:: ============================================================

set "GREEN=[92m"
set "CYAN=[96m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

echo %CYAN%=========================================%RESET%
echo %CYAN%       RenderPy - Initial Setup%RESET%
echo %CYAN%=========================================%RESET%
echo.

:: 1. Check Python
echo %CYAN%[1/4] Checking Python installation...%RESET%
where python >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Python is not installed or not on PATH.%RESET%
    echo Please install Python 3.11+ from https://www.python.org/
    echo Make sure to check the box: "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)
python --version

:: 2. Create Virtual Environment
echo.
echo %CYAN%[2/4] Setting up Python Virtual Environment (.venv)...%RESET%
if not exist ".venv" (
    python -m venv .venv
    if errorlevel 1 (
        echo %RED%[ERROR] Failed to create virtual environment.%RESET%
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
) else (
    echo Virtual environment already exists.
)

:: 3. Install Dependencies
echo.
echo %CYAN%[3/4] Installing dependencies...%RESET%
call .venv\Scripts\activate.bat
echo Upgrading pip...
python -m pip install --upgrade pip >nul 2>&1
echo Installing core requirements...
pip install -r requirements.txt
echo Installing dev requirements...
pip install -r requirements-dev.txt

:: 4. Check FFmpeg
echo.
echo %CYAN%[4/4] Checking FFmpeg installation...%RESET%
where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%[WARNING] FFmpeg was not found on your PATH.%RESET%
    echo RenderPy requires FFmpeg to convert animations into MP4 videos.
    echo.
    echo You can install it easily on Windows 10/11 using Winget by running this command in a new terminal:
    echo %GREEN%winget install ffmpeg%RESET%
    echo.
    echo Alternatively, download it from https://ffmpeg.org/download.html and add its bin folder to your PATH.
) else (
    echo %GREEN%FFmpeg is already installed!%RESET%
)

echo.
echo %CYAN%=========================================%RESET%
echo %GREEN%  Setup Complete!%RESET%
echo %CYAN%  You can now double-click %GREEN%run.bat%CYAN% to launch RenderPy.%RESET%
echo %CYAN%=========================================%RESET%
echo.
pause
