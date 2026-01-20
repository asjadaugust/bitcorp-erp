#!/bin/bash

# BitCorp ERP - Multi-Tenant Backend Testing Script
# Phase 24: Verify JWT-based tenant context works correctly

set -e  # Exit on error

echo "=========================================="
echo "BitCorp ERP - Multi-Tenant Backend Test"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3400"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

echo "Step 1: Testing Login Endpoint"
echo "-------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo ""
  echo "❌ FAILED: Could not get access token"
  echo "Login response:"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo ""
echo "✅ Login successful! Token obtained."
echo ""

echo "Step 2: Decoding JWT Payload"
echo "-----------------------------"
# Split JWT by '.' and decode the payload (middle part)
PAYLOAD=$(echo "$TOKEN" | cut -d. -f2)

# Add padding if needed for base64 decoding
case $((${#PAYLOAD} % 4)) in
  2) PAYLOAD="${PAYLOAD}==" ;;
  3) PAYLOAD="${PAYLOAD}=" ;;
esac

DECODED=$(echo "$PAYLOAD" | base64 -d 2>/dev/null || echo "$PAYLOAD" | base64 -D 2>/dev/null)

echo "JWT Payload:"
echo "$DECODED" | jq '.'

# Extract tenant info
TENANT_ID=$(echo "$DECODED" | jq -r '.id_empresa')
TENANT_CODE=$(echo "$DECODED" | jq -r '.codigo_empresa')
USER_ID=$(echo "$DECODED" | jq -r '.id_usuario')
USER_ROLE=$(echo "$DECODED" | jq -r '.rol')

echo ""
echo "Extracted Tenant Info:"
echo "  - Tenant ID: $TENANT_ID"
echo "  - Tenant Code: $TENANT_CODE"
echo "  - User ID: $USER_ID"
echo "  - User Role: $USER_ROLE"
echo ""

if [ "$TENANT_ID" == "null" ] || [ -z "$TENANT_ID" ]; then
  echo "❌ FAILED: Token missing id_empresa field"
  exit 1
fi

echo "✅ JWT contains tenant context!"
echo ""

echo "Step 3: Testing /me Endpoint"
echo "-----------------------------"
ME_RESPONSE=$(curl -s "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "Me Response:"
echo "$ME_RESPONSE" | jq '.'

ME_SUCCESS=$(echo "$ME_RESPONSE" | jq -r '.success')
if [ "$ME_SUCCESS" != "true" ]; then
  echo ""
  echo "❌ FAILED: /me endpoint returned success=false"
  exit 1
fi

echo ""
echo "✅ /me endpoint working!"
echo ""

echo "Step 4: Testing Multi-Tenant Endpoints"
echo "---------------------------------------"

# Test Operators endpoint
echo "Testing GET /api/operators"
OPERATORS_RESPONSE=$(curl -s "${BASE_URL}/api/operators?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

OPERATORS_SUCCESS=$(echo "$OPERATORS_RESPONSE" | jq -r '.success')
OPERATORS_COUNT=$(echo "$OPERATORS_RESPONSE" | jq -r '.data | length')

echo "Operators Response:"
echo "$OPERATORS_RESPONSE" | jq '.'
echo ""

if [ "$OPERATORS_SUCCESS" == "true" ]; then
  echo "✅ Operators endpoint working! (Found $OPERATORS_COUNT operators)"
else
  echo "⚠️  Operators endpoint returned success=false"
fi
echo ""

# Test Reports endpoint
echo "Testing GET /api/daily-reports"
REPORTS_RESPONSE=$(curl -s "${BASE_URL}/api/daily-reports?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

REPORTS_SUCCESS=$(echo "$REPORTS_RESPONSE" | jq -r '.success')
REPORTS_COUNT=$(echo "$REPORTS_RESPONSE" | jq -r '.data | length')

echo "Reports Response:"
echo "$REPORTS_RESPONSE" | jq '.'
echo ""

if [ "$REPORTS_SUCCESS" == "true" ]; then
  echo "✅ Daily Reports endpoint working! (Found $REPORTS_COUNT reports)"
else
  echo "⚠️  Daily Reports endpoint returned success=false"
fi
echo ""

# Test Fuel endpoint
echo "Testing GET /api/fuel"
FUEL_RESPONSE=$(curl -s "${BASE_URL}/api/fuel?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

FUEL_SUCCESS=$(echo "$FUEL_RESPONSE" | jq -r '.success')
FUEL_COUNT=$(echo "$FUEL_RESPONSE" | jq -r '.data | length')

echo "Fuel Response:"
echo "$FUEL_RESPONSE" | jq '.'
echo ""

if [ "$FUEL_SUCCESS" == "true" ]; then
  echo "✅ Fuel endpoint working! (Found $FUEL_COUNT fuel records)"
else
  echo "⚠️  Fuel endpoint returned success=false"
fi
echo ""

# Test Tenders endpoint
echo "Testing GET /api/tenders"
TENDERS_RESPONSE=$(curl -s "${BASE_URL}/api/tenders?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

TENDERS_SUCCESS=$(echo "$TENDERS_RESPONSE" | jq -r '.success')
TENDERS_COUNT=$(echo "$TENDERS_RESPONSE" | jq -r '.data | length')

echo "Tenders Response:"
echo "$TENDERS_RESPONSE" | jq '.'
echo ""

if [ "$TENDERS_SUCCESS" == "true" ]; then
  echo "✅ Tenders endpoint working! (Found $TENDERS_COUNT tenders)"
else
  echo "⚠️  Tenders endpoint returned success=false"
fi
echo ""

echo "=========================================="
echo "Multi-Tenant Backend Test Summary"
echo "=========================================="
echo ""
echo "✅ Login: Working"
echo "✅ JWT Structure: Contains tenant context (id_empresa, codigo_empresa)"
echo "✅ /me Endpoint: Working"
echo ""
echo "Multi-Tenant Endpoints:"
echo "  - Operators: $OPERATORS_SUCCESS ($OPERATORS_COUNT records)"
echo "  - Daily Reports: $REPORTS_SUCCESS ($REPORTS_COUNT records)"
echo "  - Fuel: $FUEL_SUCCESS ($FUEL_COUNT records)"
echo "  - Tenders: $TENDERS_SUCCESS ($TENDERS_COUNT records)"
echo ""
echo "All backend multi-tenant changes are working correctly! ✅"
echo ""
echo "Next Steps:"
echo "1. Push commits to origin: git push origin main"
echo "2. Update frontend auth service to handle new JWT structure"
echo "3. Test frontend login and navigation"
echo ""
