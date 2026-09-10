@echo off
setlocal

cd /d "%~dp0"

echo Starting OMS services...
docker compose up -d --build
if errorlevel 1 (
    echo.
    echo Failed to start the Docker Compose stack.
    pause
    exit /b 1
)

echo.
echo OMS services are starting.
echo Web app: http://localhost:3001
echo Tracking page: http://localhost:3001/t
echo API readiness: http://localhost:3000/ready
echo.
docker compose ps

echo.
echo Press any key to close this launcher. Services will continue running in Docker.
pause >nul
endlocal
