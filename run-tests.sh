#!/bin/bash

echo "🧪 MTT Poker Solver - Comprehensive Test Suite"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
BACKEND_TESTS_PASSED=false
FRONTEND_TESTS_PASSED=false
INTEGRATION_TESTS_PASSED=false
SECURITY_TESTS_PASSED=false

echo -e "${BLUE}Starting comprehensive test suite...${NC}"
echo ""

# Function to run backend tests
run_backend_tests() {
    echo -e "${YELLOW}📊 Running Backend Unit Tests...${NC}"
    cd backend

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi

    # Run tests
    npm test
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend tests passed!${NC}"
        BACKEND_TESTS_PASSED=true
    else
        echo -e "${RED}❌ Backend tests failed!${NC}"
    fi

    cd ..
    echo ""
}

# Function to run frontend tests
run_frontend_tests() {
    echo -e "${YELLOW}🎨 Running Frontend Component Tests...${NC}"
    cd frontend

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi

    # Run tests
    npm test -- --watchAll=false
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend tests passed!${NC}"
        FRONTEND_TESTS_PASSED=true
    else
        echo -e "${RED}❌ Frontend tests failed!${NC}"
    fi

    cd ..
    echo ""
}

# Function to run integration tests
run_integration_tests() {
    echo -e "${YELLOW}🔗 Running Integration Tests...${NC}"
    cd backend

    # Start test database (if using Docker)
    echo "Setting up test environment..."

    # Run integration tests specifically
    npm run test:integration 2>/dev/null || npm test -- --testPathPattern=integration
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Integration tests passed!${NC}"
        INTEGRATION_TESTS_PASSED=true
    else
        echo -e "${RED}❌ Integration tests failed!${NC}"
    fi

    cd ..
    echo ""
}

# Function to run security tests
run_security_tests() {
    echo -e "${YELLOW}🔒 Running Security Tests...${NC}"

    # Check for known vulnerabilities
    echo "Scanning for vulnerabilities..."

    cd backend
    npm audit --audit-level moderate
    BACKEND_AUDIT=$?

    cd ../frontend
    npm audit --audit-level moderate
    FRONTEND_AUDIT=$?

    if [ $BACKEND_AUDIT -eq 0 ] && [ $FRONTEND_AUDIT -eq 0 ]; then
        echo -e "${GREEN}✅ Security audit passed!${NC}"
        SECURITY_TESTS_PASSED=true
    else
        echo -e "${RED}❌ Security vulnerabilities found!${NC}"
    fi

    cd ..
    echo ""
}

# Function to run performance tests
run_performance_tests() {
    echo -e "${YELLOW}⚡ Running Performance Tests...${NC}"
    cd backend

    # Run performance-specific tests
    npm test -- --testNamePattern="performance"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Performance tests passed!${NC}"
    else
        echo -e "${RED}❌ Performance tests failed!${NC}"
    fi

    cd ..
    echo ""
}

# Function to generate coverage report
generate_coverage() {
    echo -e "${YELLOW}📈 Generating Coverage Reports...${NC}"

    # Backend coverage
    cd backend
    npm run test:coverage 2>/dev/null || npm test -- --coverage

    # Frontend coverage
    cd ../frontend
    npm run test:coverage 2>/dev/null || npm test -- --coverage --watchAll=false

    cd ..
    echo -e "${GREEN}Coverage reports generated in backend/coverage and frontend/coverage${NC}"
    echo ""
}

# Main test execution
main() {
    echo "🚀 Running all test suites..."
    echo ""

    # Run all test suites
    run_backend_tests
    run_frontend_tests
    run_integration_tests
    run_security_tests
    run_performance_tests
    generate_coverage

    # Summary
    echo "📋 Test Results Summary"
    echo "======================"

    if [ "$BACKEND_TESTS_PASSED" = true ]; then
        echo -e "${GREEN}✅ Backend Unit Tests: PASSED${NC}"
    else
        echo -e "${RED}❌ Backend Unit Tests: FAILED${NC}"
    fi

    if [ "$FRONTEND_TESTS_PASSED" = true ]; then
        echo -e "${GREEN}✅ Frontend Component Tests: PASSED${NC}"
    else
        echo -e "${RED}❌ Frontend Component Tests: FAILED${NC}"
    fi

    if [ "$INTEGRATION_TESTS_PASSED" = true ]; then
        echo -e "${GREEN}✅ Integration Tests: PASSED${NC}"
    else
        echo -e "${RED}❌ Integration Tests: FAILED${NC}"
    fi

    if [ "$SECURITY_TESTS_PASSED" = true ]; then
        echo -e "${GREEN}✅ Security Tests: PASSED${NC}"
    else
        echo -e "${RED}❌ Security Tests: FAILED${NC}"
    fi

    echo ""

    # Overall result
    if [ "$BACKEND_TESTS_PASSED" = true ] && [ "$FRONTEND_TESTS_PASSED" = true ] && [ "$INTEGRATION_TESTS_PASSED" = true ] && [ "$SECURITY_TESTS_PASSED" = true ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Your MTT Poker Solver is ready for production.${NC}"
        exit 0
    else
        echo -e "${RED}💥 SOME TESTS FAILED! Please review the results above.${NC}"
        exit 1
    fi
}

# Parse command line arguments
case "${1:-all}" in
    "backend")
        run_backend_tests
        ;;
    "frontend")
        run_frontend_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "security")
        run_security_tests
        ;;
    "performance")
        run_performance_tests
        ;;
    "coverage")
        generate_coverage
        ;;
    "all"|*)
        main
        ;;
esac