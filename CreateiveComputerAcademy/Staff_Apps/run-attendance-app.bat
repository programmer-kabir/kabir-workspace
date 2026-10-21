@echo off
title CCA Desktop Attendance App
cd /d "%~dp0Attendance-Desktop"
if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
) else (
    npm.cmd start
)
exit
