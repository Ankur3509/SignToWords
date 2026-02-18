@echo off
cls
color 0E

echo ============================================================
echo          SignToWords - System Check
echo ============================================================
echo.
echo Checking if your system is ready...
echo.

REM Check for Python
echo [1/3] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo    ✓ Python found: 
    python --version
    set PYTHON_FOUND=1
    set PYTHON_CMD=python
    goto :check_pip
)

py --version >nul 2>&1
if %errorlevel% == 0 (
    echo    ✓ Python found:
    py --version
    set PYTHON_FOUND=1
    set PYTHON_CMD=py
    goto :check_pip
)

python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo    ✓ Python found:
    python3 --version
    set PYTHON_FOUND=1
    set PYTHON_CMD=python3
    goto :check_pip
)

:python_not_found
color 0C
echo    ✗ Python NOT found!
echo.
echo ============================================================
echo PYTHON INSTALLATION REQUIRED
echo ============================================================
echo.
echo Please install Python to use SignToWords:
echo.
echo Step 1: Go to https://www.python.org/downloads/
echo Step 2: Download Python 3.8 or higher
echo Step 3: Run the installer
echo Step 4: ✅ CHECK "Add Python to PATH" (VERY IMPORTANT!)
echo Step 5: Click "Install Now"
echo Step 6: Restart your computer
echo Step 7: Run this script again
echo.
echo ============================================================
pause
exit /b 1

:check_pip
echo.
echo [2/3] Checking pip (package manager)...
%PYTHON_CMD% -m pip --version >nul 2>&1
if %errorlevel% == 0 (
    echo    ✓ pip is installed
) else (
    echo    ✗ pip not found, but we can install it
)

echo.
echo [3/3] Checking camera...
echo    → Cannot test camera without Python
echo    → Will be tested when you run the app
echo.

echo ============================================================
echo SYSTEM CHECK COMPLETE
echo ============================================================
echo.
echo ✓ Python is installed and ready!
echo.
echo Next steps:
echo   1. Double-click: run_pretrained.bat
echo   2. Wait for dependencies to install
echo   3. Start using SignToWords!
echo.
echo ============================================================
pause
