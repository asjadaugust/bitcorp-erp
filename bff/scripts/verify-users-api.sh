#!/bin/bash

# Configuration
API_URL="http://localhost:3400/api"
ADMIN_USER="admin"
ADMIN_PASS="admin123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting User Management API Verification..."

# 1. Authentication
echo -n "1. Authenticating as Admin... "
response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$ADMIN_USER\", \"password\": \"$ADMIN_PASS\"}")

token=$(echo $response | jq -r '.data.access_token')

if [ "$token" != "null" ] && [ -n "$token" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  echo "Response: $response"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $token"

# 2. Get Roles
echo -n "2. Fetching Roles... "
response=$(curl -s -X GET "$API_URL/users/roles" -H "$AUTH_HEADER")
roles_count=$(echo $response | jq '.data | length')

if [ "$roles_count" -gt 0 ]; then
  echo -e "${GREEN}OK ($roles_count roles found)${NC}"
else
  echo -e "${RED}FAILED${NC}"
  echo "Response: $response"
  exit 1
fi

# 3. Create User
echo -n "3. Creating Test User... "
timestamp=$(date +%s)
test_user="testuser_$timestamp"
test_email="test_$timestamp@bitcorp.pe"

create_payload=$(cat <<EOF
{
  "username": "$test_user",
  "password": "password123",
  "email": "$test_email",
  "first_name": "Test",
  "last_name": "User",
  "dni": "99999999",
  "phone": "999999999",
  "rol_id": 1,
  "is_active": true
}
EOF
)

response=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$create_payload")

user_id=$(echo $response | jq -r '.data.id')

if [ "$user_id" != "null" ] && [ -n "$user_id" ]; then
  echo -e "${GREEN}OK (ID: $user_id)${NC}"
else
  echo -e "${RED}FAILED${NC}"
  echo "Response: $response"
  exit 1
fi

# 4. Get User Details
echo -n "4. Fetching Created User... "
response=$(curl -s -X GET "$API_URL/users/$user_id" -H "$AUTH_HEADER")
fetched_username=$(echo $response | jq -r '.data.username')

if [ "$fetched_username" == "$test_user" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  echo "Response: $response"
  exit 1
fi

# 5. Update User
echo -n "5. Updating User... "
update_payload='{"first_name": "Updated Name"}'
response=$(curl -s -X PUT "$API_URL/users/$user_id" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$update_payload")

updated_name=$(echo $response | jq -r '.data.first_name')

if [ "$updated_name" == "Updated Name" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  echo "Response: $response"
  exit 1
fi

# 6. Toggle Active Status
echo -n "6. Deactivating User... "
response=$(curl -s -X PATCH "$API_URL/users/$user_id/toggle-active" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER")

is_active=$(echo $response | jq -r '.data.is_active')

if [ "$is_active" == "false" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  echo "Response: $response"
  exit 1
fi

# 7. Change Password
echo -n "7. Changing Password... "
password_payload='{"new_password": "newpassword123"}'
response=$(curl -s -X PATCH "$API_URL/users/$user_id/password" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "$password_payload")

message=$(echo $response | jq -r '.data.message')

if [[ "$message" == *"exitosamente"* ]]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  echo "Response: $response"
  exit 1
fi

# 8. List Users (Cleanup check)
echo -n "8. Listing Users... "
response=$(curl -s -X GET "$API_URL/users?search=$test_user" -H "$AUTH_HEADER")
list_count=$(echo $response | jq '.data | length')

if [ "$list_count" -ge 1 ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  echo "Response: $response"
  exit 1
fi

echo ""
echo -e "${GREEN}All checks passed successfully!${NC}"
