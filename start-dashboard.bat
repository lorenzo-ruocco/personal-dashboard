@echo off
set "BACKEND_DIR=%~dp0backend"

powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath '%BACKEND_DIR%\mvnw.cmd' -ArgumentList 'spring-boot:run' -WorkingDirectory '%BACKEND_DIR%' -WindowStyle Hidden"
