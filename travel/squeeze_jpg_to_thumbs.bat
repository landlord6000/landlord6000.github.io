@echo off
echo Looking for all "photos" folders and creating compressed previews...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0squeeze.ps1"

echo.
echo Done. Originals in photos\ are untouched, previews are in thumbs\ next to each photos\.
pause