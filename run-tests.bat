@echo off
echo 🧪 MTT Poker Solver - Comprehensive Test Suite
echo ===============================================
echo.

set BACKEND_TESTS_PASSED=false
set FRONTEND_TESTS_PASSED=false
set INTEGRATION_TESTS_PASSED=false
set SECURITY_TESTS_PASSED=false

echo Starting comprehensive test suite...
echo.

:run_backend_tests
echo 📊 Running Backend Unit Tests...
cd backend

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

call npm test
if %ERRORLEVEL% equ 0 (
    echo ✅ Backend tests passed!
    set BACKEND_TESTS_PASSED=true
) else (
    echo ❌ Backend tests failed!
)

cd ..
echo.

:run_frontend_tests
echo 🎨 Running Frontend Component Tests...
cd frontend

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

call npm test -- --watchAll=false
if %ERRORLEVEL% equ 0 (
    echo ✅ Frontend tests passed!
    set FRONTEND_TESTS_PASSED=true
) else (
    echo ❌ Frontend tests failed!
)

cd ..
echo.

:run_integration_tests
echo 🔗 Running Integration Tests...
cd backend

echo Setting up test environment...
call npm test -- --testPathPattern=integration
if %ERRORLEVEL% equ 0 (
    echo ✅ Integration tests passed!
    set INTEGRATION_TESTS_PASSED=true
) else (
    echo ❌ Integration tests failed!
)

cd ..
echo.

:run_security_tests
echo 🔒 Running Security Tests...
echo Scanning for vulnerabilities...

cd backend
call npm audit --audit-level moderate
set BACKEND_AUDIT=%ERRORLEVEL%

cd ..\frontend
call npm audit --audit-level moderate
set FRONTEND_AUDIT=%ERRORLEVEL%

if %BACKEND_AUDIT% equ 0 if %FRONTEND_AUDIT% equ 0 (
    echo ✅ Security audit passed!
    set SECURITY_TESTS_PASSED=true
) else (
    echo ❌ Security vulnerabilities found!
)

cd ..
echo.

:run_performance_tests
echo ⚡ Running Performance Tests...
cd backend

call npm test -- --testNamePattern="performance"
if %ERRORLEVEL% equ 0 (
    echo ✅ Performance tests passed!
) else (
    echo ❌ Performance tests failed!
)

cd ..
echo.

:generate_coverage
echo 📈 Generating Coverage Reports...

cd backend
call npm test -- --coverage

cd ..\frontend
call npm test -- --coverage --watchAll=false

cd ..
echo Coverage reports generated in backend/coverage and frontend/coverage
echo.

:summary
echo 📋 Test Results Summary
echo ======================

if "%BACKEND_TESTS_PASSED%"=="true" (
    echo ✅ Backend Unit Tests: PASSED
) else (
    echo ❌ Backend Unit Tests: FAILED
)

if "%FRONTEND_TESTS_PASSED%"=="true" (
    echo ✅ Frontend Component Tests: PASSED
) else (
    echo ❌ Frontend Component Tests: FAILED
)

if "%INTEGRATION_TESTS_PASSED%"=="true" (
    echo ✅ Integration Tests: PASSED
) else (
    echo ❌ Integration Tests: FAILED
)

if "%SECURITY_TESTS_PASSED%"=="true" (
    echo ✅ Security Tests: PASSED
) else (
    echo ❌ Security Tests: FAILED
)

echo.

if "%BACKEND_TESTS_PASSED%"=="true" if "%FRONTEND_TESTS_PASSED%"=="true" if "%INTEGRATION_TESTS_PASSED%"=="true" if "%SECURITY_TESTS_PASSED%"=="true" (
    echo 🎉 ALL TESTS PASSED! Your MTT Poker Solver is ready for production.
    exit /b 0
) else (
    echo 💥 SOME TESTS FAILED! Please review the results above.
    exit /b 1
)

pause