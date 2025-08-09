#!/bin/bash

# Script to run API tests with coverage
echo "🧪 Running API Tests for StoryScale"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Run the generate endpoint tests
echo "📝 Testing /api/generate endpoint..."
npm test -- __tests__/app/api/generate/route.test.ts --coverage --collectCoverageFrom='src/app/api/generate/**/*.{ts,tsx}' --silent
GENERATE_EXIT=$?

echo ""
echo "🏥 Testing /api/health endpoint..."
npm test -- __tests__/app/api/health/route.test.ts --coverage --collectCoverageFrom='src/app/api/health/**/*.{ts,tsx}' --silent
HEALTH_EXIT=$?

echo ""
echo "📊 Running all API tests with coverage..."
npm run test:api -- --coverage --collectCoverageFrom='src/app/api/**/*.{ts,tsx}' --silent

# Check results
echo ""
echo "===================================="
if [ $GENERATE_EXIT -eq 0 ] && [ $HEALTH_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ All API tests passed!${NC}"
    echo ""
    echo "Coverage Report:"
    echo "----------------"
    # Show coverage summary
    npx jest --coverage --collectCoverageFrom='src/app/api/**/*.{ts,tsx}' --coverageReporters='text-summary' 2>/dev/null | grep -A 10 "Coverage summary"
else
    echo -e "${RED}❌ Some tests failed. Please check the output above.${NC}"
    exit 1
fi

echo ""
echo "To view detailed coverage report, open: coverage/lcov-report/index.html"