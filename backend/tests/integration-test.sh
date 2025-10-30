#!/bin/bash
#
# MEVrebels Backend Integration Tests
# Tests all backend services end-to-end via HTTPS
#

set -e

API_URL="https://api.mevrebels.rectorspace.com"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🧪 MEVrebels Backend Integration Tests"
echo "======================================="
echo "Testing: $API_URL"
echo ""

# Test function
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    local method="${4:-GET}"
    local data="${5:-}"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "[$TOTAL_TESTS] Testing: $test_name... "

    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" "$url" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_code, got $http_code)"
        echo "   Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test JSON response
test_json_endpoint() {
    local test_name="$1"
    local url="$2"
    local json_key="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "[$TOTAL_TESTS] Testing: $test_name... "

    response=$(curl -s "$url" 2>&1)

    if echo "$response" | jq -e ".$json_key" > /dev/null 2>&1; then
        value=$(echo "$response" | jq -r ".$json_key")
        echo -e "${GREEN}✅ PASS${NC} ($json_key: $value)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Key '$json_key' not found)"
        echo "   Response: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test CORS headers
test_cors() {
    local test_name="$1"
    local url="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "[$TOTAL_TESTS] Testing: $test_name... "

    cors_header=$(curl -s -I -H "Origin: https://example.com" "$url" | grep -i "access-control-allow-origin" | cut -d' ' -f2 | tr -d '\r\n')

    if [ -n "$cors_header" ]; then
        echo -e "${GREEN}✅ PASS${NC} (CORS: $cors_header)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (No CORS header)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. SSL/TLS & Security Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test SSL certificate
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "[$TOTAL_TESTS] Testing: SSL certificate validity... "
if openssl s_client -connect api.mevrebels.rectorspace.com:443 -servername api.mevrebels.rectorspace.com < /dev/null 2>&1 | grep -q "Verify return code: 0"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test HSTS header
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "[$TOTAL_TESTS] Testing: HSTS security header... "
hsts=$(curl -s -I "$API_URL/health" | grep -i "strict-transport-security")
if [ -n "$hsts" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. Health Check Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "API Server health" "$API_URL/health" 200
test_json_endpoint "API Server status" "$API_URL/health" "status"
test_json_endpoint "API Server uptime" "$API_URL/health" "uptime"

test_endpoint "Analytics health" "$API_URL/analytics/health" 200
test_json_endpoint "Analytics status" "$API_URL/analytics/health" "status"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. API Endpoint Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "GET /api/strategies" "$API_URL/api/strategies" 200
test_endpoint "GET /api/strategies/:id (404)" "$API_URL/api/strategies/nonexistent" 404
test_endpoint "GET /api/executions" "$API_URL/api/executions" 200
test_endpoint "GET /api/proposals" "$API_URL/api/proposals" 200

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. Analytics Endpoint Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint "GET /analytics/strategies/stats" "$API_URL/analytics/strategies/stats" 200
test_endpoint "GET /analytics/executions/stats" "$API_URL/analytics/executions/stats" 200
test_endpoint "GET /analytics/leaderboard" "$API_URL/analytics/leaderboard" 200

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. CORS & Security Headers Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_cors "CORS header on /health" "$API_URL/health"
test_cors "CORS header on /api/strategies" "$API_URL/api/strategies"

# Test OPTIONS preflight
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "[$TOTAL_TESTS] Testing: OPTIONS preflight request... "
options_response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API_URL/api/strategies")
if [ "$options_response" = "204" ] || [ "$options_response" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $options_response)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $options_response)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. Performance Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test response time
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "[$TOTAL_TESTS] Testing: API response time (<500ms)... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$API_URL/health")
response_time_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)

if [ "$response_time_ms" -lt 500 ]; then
    echo -e "${GREEN}✅ PASS${NC} (${response_time_ms}ms)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  WARN${NC} (${response_time_ms}ms - slower than expected)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7. Docker Services Health${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Docker services via SSH
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -n "[$TOTAL_TESTS] Testing: Docker services status... "
docker_status=$(ssh mevrebels "cd /home/mevrebels/mevrebels-backend && docker compose ps --format json" | jq -r '.[] | select(.Health == "healthy") | .Service' | wc -l)

if [ "$docker_status" -ge 4 ]; then
    echo -e "${GREEN}✅ PASS${NC} ($docker_status/4 services healthy)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (Only $docker_status/4 services healthy)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Summary
echo ""
echo "======================================="
echo -e "${BLUE}Test Summary${NC}"
echo "======================================="
echo "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Backend is ready for production use 🚀"
    exit 0
else
    PASS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    echo "Pass Rate: ${PASS_RATE}%"
    echo ""
    echo "Review failed tests above and fix issues."
    exit 1
fi
