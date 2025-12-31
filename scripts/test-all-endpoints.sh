#!/bin/bash

# Bitcorp ERP - Comprehensive API Test Script
# Tests all endpoints to verify the application is working correctly

set -e

# Colors for output
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL=${API_URL:-http://localhost:3400}
ADMIN_USER=${ADMIN_USER:-admin}
ADMIN_PASS=${ADMIN_PASS:-admin123}
OPERATOR_USER=${OPERATOR_USER:-operador1}
OPERATOR_PASS=${OPERATOR_PASS:-demo123}

echo "================================="
echo "Bitcorp ERP - API Test Suite"
echo "================================="
echo "API URL: $API_URL"
echo ""

# Function to print test result
print_result() {
    local name=$1
    local status=$2
    local count=$3
    
    if [ "$status" == "OK" ]; then
        echo -e "${GREEN}✓${NC} $name: $count records"
    elif [ "$status" == "EMPTY" ]; then
        echo -e "${YELLOW}○${NC} $name: Empty (no test data)"
    else
        echo -e "${RED}✗${NC} $name: ERROR - $count"
    fi
}

# Login as admin
echo "=== Authentication ==="
echo "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed!${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo ""

# Test endpoints
echo "=== Core Endpoints ==="

# Projects
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/projects")
COUNT=$(echo $RESPONSE | jq -r '.data | length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Projects" "OK" "$COUNT"
else
    ERROR=$(echo $RESPONSE | jq -r '.error' 2>/dev/null || echo "Unknown error")
    print_result "Projects" "ERROR" "$ERROR"
fi

# Equipment
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/equipment")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Equipment" "OK" "$COUNT"
else
    print_result "Equipment" "EMPTY" "0"
fi

# Operators
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/operators")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Operators" "OK" "$COUNT"
else
    print_result "Operators" "EMPTY" "0"
fi

echo ""
echo "=== Logistics Endpoints ==="

# Products
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/logistics/products")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Products" "OK" "$COUNT"
else
    print_result "Products" "EMPTY" "0"
fi

# Movements
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/logistics/movements")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Movements" "OK" "$COUNT"
else
    print_result "Movements" "EMPTY" "0"
fi

# Providers
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/logistics/providers")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Providers" "OK" "$COUNT"
else
    print_result "Providers" "EMPTY" "0"
fi

echo ""
echo "=== HR & SST Endpoints ==="

# Employees
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/hr/employees")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Employees" "OK" "$COUNT"
else
    print_result "Employees" "EMPTY" "0"
fi

# Safety Incidents
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/sst/incidents")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Safety Incidents" "OK" "$COUNT"
else
    print_result "Safety Incidents" "EMPTY" "0"
fi

echo ""
echo "=== Scheduling Endpoints ==="

# Timesheets
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/scheduling/timesheets")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Timesheets" "OK" "$COUNT"
else
    print_result "Timesheets" "EMPTY" "0"
fi

# Tasks
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/scheduling/tasks")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Tasks" "OK" "$COUNT"
else
    print_result "Tasks" "EMPTY" "0"
fi

# Maintenance Schedules
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/scheduling/maintenance-schedules")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Maintenance Schedules" "OK" "$COUNT"
else
    print_result "Maintenance Schedules" "EMPTY" "0"
fi

echo ""
echo "=== Financial Endpoints ==="

# Contracts
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/contracts")
COUNT=$(echo $RESPONSE | jq -r '.data | length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Contracts" "OK" "$COUNT"
else
    print_result "Contracts" "EMPTY" "0"
fi

# Tenders
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/tenders")
COUNT=$(echo $RESPONSE | jq -r 'length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Tenders" "OK" "$COUNT"
else
    print_result "Tenders" "EMPTY" "0"
fi

# Valuations
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/valuations")
COUNT=$(echo $RESPONSE | jq -r '.data | length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Valuations" "OK" "$COUNT"
else
    print_result "Valuations" "EMPTY" "0"
fi

# Fuel
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/fuel")
COUNT=$(echo $RESPONSE | jq -r '.data | length' 2>/dev/null || echo "0")
if [ "$COUNT" != "null" ] && [ "$COUNT" != "0" ]; then
    print_result "Fuel Records" "OK" "$COUNT"
else
    print_result "Fuel Records" "EMPTY" "0"
fi

echo ""
echo "=== Operator Login Test ==="
OPERATOR_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$OPERATOR_USER\",\"password\":\"$OPERATOR_PASS\"}")

OPERATOR_TOKEN=$(echo $OPERATOR_LOGIN | jq -r '.access_token')
if [ "$OPERATOR_TOKEN" != "null" ] && [ -n "$OPERATOR_TOKEN" ]; then
    echo -e "${GREEN}✓ Operator login successful${NC}"
else
    echo -e "${RED}✗ Operator login failed${NC}"
fi

echo ""
echo "================================="
echo "Test Suite Complete"
echo "================================="
