@echo off
title CCA Desktop Attendance App
set ELECTRON_RUN_AS_NODE=
cd /d "%~dp0Attendance-Desktop"
if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
) else (
    npm.cmd start
)
exit
