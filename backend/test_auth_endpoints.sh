#!/bin/bash

# Authentication Endpoints Test Script
# Run this after starting the backend server

BASE_URL="http://localhost:8000/api/v1"
echo "Testing Authentication Endpoints..."
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Register a new user
echo -e "${BLUE}Test 1: Register a new user${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "testuser1",
    "email": "testuser1@example.com",
    "password": "TestPass@123",
    "name": "Test User One"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "$REGISTER_RESPONSE"
fi
echo ""

# Test 2: Login
echo -e "${BLUE}Test 2: Login with credentials${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "login_id": "testuser1",
    "password": "TestPass@123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "$LOGIN_RESPONSE"
fi
echo ""

# Test 3: Get current user profile
echo -e "${BLUE}Test 3: Get current user profile (/me)${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q "testuser1"; then
  echo -e "${GREEN}✓ Profile retrieval successful${NC}"
else
  echo -e "${RED}✗ Profile retrieval failed${NC}"
  echo "$ME_RESPONSE"
fi
echo ""

# Test 4: Forgot Password
echo -e "${BLUE}Test 4: Forgot Password${NC}"
FORGOT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser1@example.com"
  }')

if echo "$FORGOT_RESPONSE" | grep -q "reset"; then
  echo -e "${GREEN}✓ Forgot password request successful${NC}"
  echo "  Check server console for reset token"
else
  echo -e "${RED}✗ Forgot password request failed${NC}"
  echo "$FORGOT_RESPONSE"
fi
echo ""

# Note: Test 5 requires manual token from console
echo -e "${BLUE}Test 5: Reset Password${NC}"
echo "  Note: To test password reset, get the token from server console and run:"
echo "  curl -X POST $BASE_URL/auth/reset-password \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"token\": \"YOUR_TOKEN_HERE\", \"new_password\": \"NewPass@456\"}'"
echo ""

# Test 6: Logout
echo -e "${BLUE}Test 6: Logout${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q "Successfully logged out"; then
  echo -e "${GREEN}✓ Logout successful${NC}"
else
  echo -e "${RED}✗ Logout failed${NC}"
  echo "$LOGOUT_RESPONSE"
fi
echo ""

echo "===================================="
echo "All basic authentication tests completed!"
echo ""
echo "To test admin endpoints, you need an admin token."
echo "To test password reset, follow the instructions above."
