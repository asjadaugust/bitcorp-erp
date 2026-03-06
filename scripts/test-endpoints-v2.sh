#!/bin/bash
# Comprehensive API Endpoint Testing Script
# Sprint 3 - Testing Infrastructure
# Date: 2026-01-04

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3400}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-Admin@123}"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results array
declare -a FAILED_ENDPOINTS

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Bitcorp ERP - API Endpoint Test Suite      ║${NC}"
echo -e "${BLUE}║   Sprint 3 - Comprehensive Testing            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}API Base URL:${NC} $API_BASE_URL"
echo -e "${YELLOW}Test User:${NC} $ADMIN_USER"
echo ""

# Function to print test result
print_result() {
    local name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "  ${GREEN}✓${NC} $name $details"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FAILED_ENDPOINTS+=("$name: $details")
        echo -e "  ${RED}✗${NC} $name $details"
    fi
}

# Function to test endpoint with data count
test_endpoint_with_count() {
    local method="$1"
    local endpoint="$2"
    local name="$3"
    
    response=$(curl -s -X "$method" \
        "$API_BASE_URL$endpoint" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" 2>&1)
    
    # Check if response is valid JSON
    if echo "$response" | jq empty 2>/dev/null; then
        # Try to get data count
        if echo "$response" | jq -e '.data' >/dev/null 2>&1; then
            count=$(echo "$response" | jq '.data | length' 2>/dev/null || echo "?")
            success=$(echo "$response" | jq -r '.success' 2>/dev/null || echo "unknown")
            
            if [ "$success" = "true" ]; then
                print_result "$name" "PASS" "($count items)"
            else
                print_result "$name" "FAIL" "(success=false)"
            fi
        elif echo "$response" | jq -e 'type == "array"' >/dev/null 2>&1; then
            count=$(echo "$response" | jq 'length' 2>/dev/null || echo "?")
            print_result "$name" "PASS" "($count items)"
        else
            print_result "$name" "PASS" "(valid JSON)"
        fi
    else
        print_result "$name" "FAIL" "(invalid JSON response)"
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Authentication${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get authentication token
TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$ADMIN_USER\", \"password\": \"$ADMIN_PASS\"}" 2>&1)

if echo "$TOKEN_RESPONSE" | jq empty 2>/dev/null; then
    TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token' 2>/dev/null)
    
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        print_result "Authentication" "PASS" "(token obtained)"
    else
        echo -e "${RED}✗ Failed to obtain authentication token${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Invalid JSON response from login endpoint${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Testing All Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test all endpoints
test_endpoint_with_count "GET" "/api/dashboard/stats" "Dashboard Stats"
test_endpoint_with_count "GET" "/api/projects" "Projects"
test_endpoint_with_count "GET" "/api/equipment" "Equipment"
test_endpoint_with_count "GET" "/api/operators" "Operators"
test_endpoint_with_count "GET" "/api/providers" "Providers"
test_endpoint_with_count "GET" "/api/logistics/movements" "Inventory Movements"
test_endpoint_with_count "GET" "/api/logistics/products" "Products"
test_endpoint_with_count "GET" "/api/contracts" "Contracts"
test_endpoint_with_count "GET" "/api/valuations" "Valuations"
test_endpoint_with_count "GET" "/api/scheduling/tasks" "Scheduled Tasks"
test_endpoint_with_count "GET" "/api/sst/incidents" "Safety Incidents"
test_endpoint_with_count "GET" "/api/sig/documents" "SIG Documents"
test_endpoint_with_count "GET" "/api/admin/cost-centers" "Cost Centers"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              TEST SUMMARY                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Total Tests:${NC}  $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}       $PASSED_TESTS"
echo -e "${RED}Failed:${NC}       $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed:${NC}"
    for failure in "${FAILED_ENDPOINTS[@]}"; do
        echo -e "${RED}  • $failure${NC}"
    done
    exit 1
fi
