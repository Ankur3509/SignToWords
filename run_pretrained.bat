@echo off
cls
color 0A

echo ============================================================
echo      SignToWords - AI Sign Language Translator
echo ============================================================
echo.
echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

echo Installing/Updating dependencies...
python -m pip install --quiet --upgrade pip
python -m pip install --quiet opencv-python mediapipe numpy pyttsx3 pywin32

echo.
echo ============================================================
echo Starting SignToWords...
echo ============================================================
echo.
echo Press 'Q' while the camera window is open to exit.
echo.

python main_pretrained.py

if %errorlevel% neq 0 (
    echo.
    echo ------------------------------------------------------------
    echo CRITICAL ERROR: The app crashed.
    echo ------------------------------------------------------------
    echo.
    echo Possible fix: 
    echo 1. Close any other apps using the camera (Zoom, Teams).
    echo 2. Run: python -m pip uninstall mediapipe
    echo 3. Run: python -m pip install mediapipe
    echo.
    pause
)
