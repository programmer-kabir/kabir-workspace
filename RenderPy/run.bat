@echo off
setlocal enabledelayedexpansion
title RenderPy Launcher v1.1

:: ============================================================
::  RenderPy -- Windows Batch Launcher
:: ============================================================

:: -- Locate Python --------------------------------------------
set "PYTHON_EXE=python"
set "SCRIPT_DIR=%~dp0"
if exist "!SCRIPT_DIR!\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=!SCRIPT_DIR!\.venv\Scripts\python.exe"
) else (
    where python >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python not found on PATH. Install Python 3.11+ and try again.
        pause
        exit /b 2
    )
)

:: -- Locate renderpy.py ---------------------------------------
set "RENDERPY=!SCRIPT_DIR!renderpy.py"

if not exist "!RENDERPY!" (
    echo [ERROR] renderpy.py not found in: !SCRIPT_DIR!
    pause
    exit /b 2
)

:: -- If called with arguments, pass them straight through -----
if not "%~1"=="" (
    echo [RenderPy] Running: "!PYTHON_EXE!" renderpy.py %*
    echo.
    "!PYTHON_EXE!" "!RENDERPY!" %*
    set EXIT_CODE=!errorlevel!
    echo.
    if !EXIT_CODE! equ 0 (
        echo [RenderPy] Done. Exit code: 0
    ) else (
        echo [RenderPy] Finished with exit code: !EXIT_CODE!
    )
    exit /b !EXIT_CODE!
)

:: -- Interactive Menu -----------------------------------------
:MENU
cls
echo.
echo  =========================================
echo     RenderPy CLI Launcher v1.1
echo  =========================================
echo.
echo   --- Single Script Mode ---
echo   1.  Full 4K Render         (default quality)
echo   2.  Draft Render           (1080p, ultrafast)
echo   3.  Preview PNG Frames     (pick timestamps)
echo   4.  Partial Render         (frame range)
echo   5.  Dry Run                (validate only)
echo.
echo   --- Bulk Folder Mode ---
echo   6.  Bulk 4K Render         (all .py in folder)
echo   7.  Bulk Draft Render      (all .py in folder)
echo.
echo   --- Utilities ---
echo   8.  Check FFmpeg           (verify install)
echo   9.  Custom Command         (type your own flags)
echo   10. Run Tests              (pytest)
echo   11. Install Dependencies   (pip install)
echo   0.  Exit
echo.
set /p CHOICE="  Select option [0-11]: "

if "%CHOICE%"=="1" goto FULL_RENDER
if "%CHOICE%"=="2" goto DRAFT_RENDER
if "%CHOICE%"=="3" goto PREVIEW
if "%CHOICE%"=="4" goto PARTIAL
if "%CHOICE%"=="5" goto DRY_RUN
if "%CHOICE%"=="6" goto BULK_4K
if "%CHOICE%"=="7" goto BULK_DRAFT
if "%CHOICE%"=="8" goto CHECK_FFMPEG
if "%CHOICE%"=="9" goto CUSTOM
if "%CHOICE%"=="10" goto TESTS
if "%CHOICE%"=="11" goto INSTALL
if "%CHOICE%"=="0" exit /b 0

echo [!] Invalid option. Try again.
timeout /t 1 >nul
goto MENU


:: ============================================================
::   SINGLE SCRIPT MODE
:: ============================================================

:FULL_RENDER
echo.
set /p ANIM="  Path to animation script (.py): "
set ANIM=!ANIM:"=!
if "!ANIM!"=="" (echo [ERROR] No script given. & timeout /t 2 >nul & goto MENU)
echo.
echo  [RenderPy] Full 4K render -- !ANIM!
"!PYTHON_EXE!" "!RENDERPY!" "!ANIM!"
call :SHOW_RESULT !errorlevel!
goto MENU

:DRAFT_RENDER
echo.
set /p ANIM="  Path to animation script (.py): "
set ANIM=!ANIM:"=!
if "!ANIM!"=="" (echo [ERROR] No script given. & timeout /t 2 >nul & goto MENU)
echo.
echo  [RenderPy] Draft render (1920x1080, ultrafast) -- !ANIM!
"!PYTHON_EXE!" "!RENDERPY!" "!ANIM!" --width 1920 --height 1080 --preset ultrafast --crf 28
call :SHOW_RESULT !errorlevel!
goto MENU

:PREVIEW
echo.
set /p ANIM="  Path to animation script (.py): "
set ANIM=!ANIM:"=!
if "!ANIM!"=="" (echo [ERROR] No script given. & timeout /t 2 >nul & goto MENU)
set /p TIMESTAMPS="  Timestamps in seconds (e.g. 0 2.5 5.0): "
if "!TIMESTAMPS!"=="" set TIMESTAMPS=0
echo.
echo  [RenderPy] Preview at t=!TIMESTAMPS! -- !ANIM!
"!PYTHON_EXE!" "!RENDERPY!" "!ANIM!" --preview !TIMESTAMPS!
call :SHOW_RESULT !errorlevel!
goto MENU

:PARTIAL
echo.
set /p ANIM="  Path to animation script (.py): "
set ANIM=!ANIM:"=!
if "!ANIM!"=="" (echo [ERROR] No script given. & timeout /t 2 >nul & goto MENU)
set /p START="  Start frame (default 0): "
set /p END="  End frame (default last): "
if "!START!"=="" set START=0
echo.
set PARTIAL_ARGS=--start-frame !START!
if not "!END!"=="" set PARTIAL_ARGS=!PARTIAL_ARGS! --end-frame !END!
echo  [RenderPy] Partial render frames !START! to !END! -- !ANIM!
"!PYTHON_EXE!" "!RENDERPY!" "!ANIM!" !PARTIAL_ARGS!
call :SHOW_RESULT !errorlevel!
goto MENU

:DRY_RUN
echo.
set /p ANIM="  Path to animation script (.py): "
set ANIM=!ANIM:"=!
if "!ANIM!"=="" (echo [ERROR] No script given. & timeout /t 2 >nul & goto MENU)
echo.
echo  [RenderPy] Dry run (validate only) -- !ANIM!
"!PYTHON_EXE!" "!RENDERPY!" "!ANIM!" --dry-run
call :SHOW_RESULT !errorlevel!
goto MENU


:: ============================================================
::   BULK FOLDER MODE
:: ============================================================

:BULK_4K
echo.
set /p FOLDER="  Path to folder containing .py scripts: "
set FOLDER=!FOLDER:"=!
if "!FOLDER!"=="" (echo [ERROR] No folder given. & timeout /t 2 >nul & goto MENU)
if not exist "!FOLDER!\" (echo [ERROR] Folder does not exist. & timeout /t 2 >nul & goto MENU)
echo.
echo  [RenderPy] Starting BULK 4K Render in folder: !FOLDER!
echo  ---------------------------------------------------------
set /a BULK_OK=0
set /a BULK_FAIL=0
for %%f in ("!FOLDER!\*.py") do (
    if /i not "%%~nxf"=="__init__.py" (
        echo.
        echo  [RenderPy] Rendering: %%~nxf
        "!PYTHON_EXE!" "!RENDERPY!" "%%f"
        if errorlevel 1 (
            set /a BULK_FAIL+=1
            echo  [WARN] Failed: %%~nxf
        ) else (
            set /a BULK_OK+=1
        )
    )
)
echo.
echo  [RenderPy] Bulk render complete. Succeeded: !BULK_OK!, Failed: !BULK_FAIL!
pause
goto MENU

:BULK_DRAFT
echo.
set /p FOLDER="  Path to folder containing .py scripts: "
set FOLDER=!FOLDER:"=!
if "!FOLDER!"=="" (echo [ERROR] No folder given. & timeout /t 2 >nul & goto MENU)
if not exist "!FOLDER!\" (echo [ERROR] Folder does not exist. & timeout /t 2 >nul & goto MENU)
echo.
echo  [RenderPy] Starting BULK DRAFT Render (1080p, ultrafast) in folder: !FOLDER!
echo  ---------------------------------------------------------
set /a BULK_OK=0
set /a BULK_FAIL=0
for %%f in ("!FOLDER!\*.py") do (
    if /i not "%%~nxf"=="__init__.py" (
        echo.
        echo  [RenderPy] Rendering: %%~nxf
        "!PYTHON_EXE!" "!RENDERPY!" "%%f" --width 1920 --height 1080 --preset ultrafast --crf 28
        if errorlevel 1 (
            set /a BULK_FAIL+=1
            echo  [WARN] Failed: %%~nxf
        ) else (
            set /a BULK_OK+=1
        )
    )
)
echo.
echo  [RenderPy] Bulk render complete. Succeeded: !BULK_OK!, Failed: !BULK_FAIL!
pause
goto MENU


:: ============================================================
::   UTILITIES
:: ============================================================

:CHECK_FFMPEG
echo.
echo  [RenderPy] Checking FFmpeg...
echo.
"!PYTHON_EXE!" "!RENDERPY!" --check-ffmpeg
call :SHOW_RESULT !errorlevel!
goto MENU

:CUSTOM
echo.
echo    Example: animation.py --output out.mp4 --preset fast --crf 20 --workers 4
set /p CUSTOM_ARGS="  Enter arguments: "
if "!CUSTOM_ARGS!"=="" (echo [ERROR] Nothing entered. & timeout /t 2 >nul & goto MENU)
echo.
echo  [RenderPy] Running: "!PYTHON_EXE!" renderpy.py !CUSTOM_ARGS!
"!PYTHON_EXE!" "!RENDERPY!" !CUSTOM_ARGS!
call :SHOW_RESULT !errorlevel!
goto MENU

:TESTS
echo.
echo  [RenderPy] Running pytest...
echo.
"!PYTHON_EXE!" -m pytest --version >nul 2>&1
if errorlevel 1 (
    echo [!] pytest not found in current Python environment.
    echo     Install with: "!PYTHON_EXE!" -m pip install -r requirements-dev.txt
    echo.
    pause
    goto MENU
)
cd /d "!SCRIPT_DIR!"
"!PYTHON_EXE!" -m pytest tests\ -v
call :SHOW_RESULT !errorlevel!
goto MENU

:INSTALL
echo.
echo  [RenderPy] Installing dependencies using "!PYTHON_EXE!"...
echo.
"!PYTHON_EXE!" -m pip install -r "!SCRIPT_DIR!requirements.txt"
echo.
echo  [RenderPy] Installing dev dependencies...
"!PYTHON_EXE!" -m pip install -r "!SCRIPT_DIR!requirements-dev.txt"
echo.
echo  [RenderPy] All dependencies installed.
pause
goto MENU

:: -- Result display subroutine --------------------------------
:SHOW_RESULT
echo.
if "%~1"=="0" (
    echo  [RenderPy] Completed successfully.
) else if "%~1"=="130" (
    echo  [RenderPy] Cancelled by user.
) else (
    echo  [ERROR] Failed with exit code: %~1
    echo    Codes: 1=Script error  2=Config error  3=FFmpeg error  4=IO error
)
echo.
pause
exit /b %~1
