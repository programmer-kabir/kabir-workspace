@echo off
setlocal enabledelayedexpansion
title RenderPy Studio

set "SCRIPT_DIR=%~dp0"
set "PYTHON_EXE=python"
if exist "%SCRIPT_DIR%.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%SCRIPT_DIR%.venv\Scripts\python.exe"
)

echo [RenderPy Studio] Starting desktop application...
"%PYTHON_EXE%" "%SCRIPT_DIR%desktop\app.py" %*
