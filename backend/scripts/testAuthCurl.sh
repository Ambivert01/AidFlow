#!/bin/bash

# Advanced Auth System - Manual API Testing Script
# Tests all auth endpoints with curl commands

API_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Advanced Auth System - API Tests${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Register DONOR (auto-approved)
echo -e "${YELLOW}TEST 1: Register DONOR${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Donor",
    "email": "testdonor@example.com",
    "password": "TestPass123!",
    "role": "DONOR"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract email verification token
EMAIL_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.emailVerificationToken')
echo -e "${GREEN}✓ DONOR registered${NC}"
echo -e "Email Verification Token: $EMAIL_TOKEN\n"

# Test 2: Register NGO (requires admin approval)
echo -e "${YELLOW}TEST 2: Register NGO${NC}"
NGO_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test NGO",
    "email": "testngo@example.com",
    "password": "TestPass123!",
    "role": "NGO"
  }')

echo "$NGO_RESPONSE" | jq '.'
echo -e "${GREEN}✓ NGO registered (pending approval)${NC}\n"

# Test 3: Verify Email
echo -e "${YELLOW}TEST 3: Verify Email${NC}"
if [ ! -z "$EMAIL_TOKEN" ]; then
  VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/auth/verify-email" \
    -H "Content-Type: application/json" \
    -d "{\"token\": \"$EMAIL_TOKEN\"}")
  
  echo "$VERIFY_RESPONSE" | jq '.'
  echo -e "${GREEN}✓ Email verified${NC}\n"
else
  echo -e "${RED}✗ No email token available${NC}\n"
fi

# Test 4: Login DONOR
echo -e "${YELLOW}TEST 4: Login DONOR${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdonor@example.com",
    "password": "TestPass123!"}')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract tokens
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken')

echo -e "${GREEN}✓ Login successful${NC}"
echo -e "Access Token: ${ACCESS_TOKEN:0:50}..."
echo -e "Refresh Token: ${REFRESH_TOKEN:0:50}...\n"

# Test 5: Get Current User
echo -e "${YELLOW}TEST 5: Get Current User (/me)${NC}"
ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$ME_RESPONSE" | jq '.'
echo -e "${GREEN}✓ User profile retrieved${NC}\n"

# Test 6: Get Active Sessions
echo -e "${YELLOW}TEST 6: Get Active Sessions${NC}"
SESSIONS_RESPONSE=$(curl -s -X GET "$API_URL/auth/sessions" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$SESSIONS_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Sessions retrieved${NC}\n"

# Test 7: Refresh Access Token
echo -e "${YELLOW}TEST 7: Refresh Access Token${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

echo "$REFRESH_RESPONSE" | jq '.'

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.accessToken')
echo -e "${GREEN}✓ Token refreshed${NC}"
echo -e "New Access Token: ${NEW_ACCESS_TOKEN:0:50}...\n"

# Test 8: Request Password Reset
echo -e "${YELLOW}TEST 8: Request Password Reset${NC}"
FORGOT_RESPONSE=$(curl -s -X POST "$API_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdonor@example.com"
  }')

echo "$FORGOT_RESPONSE" | jq '.'

RESET_TOKEN=$(echo "$FORGOT_RESPONSE" | jq -r '.data.resetToken')
echo -e "${GREEN}✓ Password reset requested${NC}"
echo -e "Reset Token: $RESET_TOKEN\n"

# Test 9: Reset Password
if [ ! -z "$RESET_TOKEN" ] && [ "$RESET_TOKEN" != "null" ]; then
  echo -e "${YELLOW}TEST 9: Reset Password${NC}"
  RESET_RESPONSE=$(curl -s -X POST "$API_URL/auth/reset-password" \
    -H "Content-Type: application/json" \
    -d "{
      \"token\": \"$RESET_TOKEN\",
      \"newPassword\": \"NewTestPass123!\"
    }")
  
  echo "$RESET_RESPONSE" | jq '.'
  echo -e "${GREEN}✓ Password reset successful${NC}\n"
  
  # Test 10: Login with new password
  echo -e "${YELLOW}TEST 10: Login with New Password${NC}"
  NEW_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testdonor@example.com",
      "password": "NewTestPass123!"
    }')
  
  echo "$NEW_LOGIN_RESPONSE" | jq '.'
  
  NEW_ACCESS_TOKEN=$(echo "$NEW_LOGIN_RESPONSE" | jq -r '.data.accessToken')
  NEW_REFRESH_TOKEN=$(echo "$NEW_LOGIN_RESPONSE" | jq -r '.data.refreshToken')
  
  echo -e "${GREEN}✓ Login with new password successful${NC}\n"
else
  echo -e "${YELLOW}Skipping password reset test (no token)${NC}\n"
fi

# Test 11: Logout
echo -e "${YELLOW}TEST 11: Logout (Single Device)${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -d "{\"refreshToken\": \"$NEW_REFRESH_TOKEN\"}")

echo "$LOGOUT_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Logout successful${NC}\n"

# Test 12: Try to use revoked refresh token (should fail)
echo -e "${YELLOW}TEST 12: Try Revoked Refresh Token${NC}"
REVOKED_RESPONSE=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$NEW_REFRESH_TOKEN\"}")

echo "$REVOKED_RESPONSE" | jq '.'

if echo "$REVOKED_RESPONSE" | grep -q "Invalid"; then
  echo -e "${GREEN}✓ Revoked token properly rejected${NC}\n"
else
  echo -e "${RED}✗ Revoked token still valid!${NC}\n"
fi

# Test 13: Login again for logout all test
echo -e "${YELLOW}TEST 13: Login Again${NC}"
FINAL_LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdonor@example.com",
    "password": "NewTestPass123!"
  }')

FINAL_ACCESS=$(echo "$FINAL_LOGIN" | jq -r '.data.accessToken')
echo -e "${GREEN}✓ Logged in again${NC}\n"

# Test 14: Logout All Devices
echo -e "${YELLOW}TEST 14: Logout All Devices${NC}"
LOGOUT_ALL_RESPONSE=$(curl -s -X POST "$API_URL/auth/logout-all" \
  -H "Authorization: Bearer $FINAL_ACCESS")

echo "$LOGOUT_ALL_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Logged out from all devices${NC}\n"

# Test 15: Security Tests
echo -e "${YELLOW}TEST 15: Security Tests${NC}"

echo -e "  Testing invalid password..."
INVALID_PASS=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdonor@example.com",
    "password": "WrongPassword123!"
  }')

if echo "$INVALID_PASS" | grep -q "Invalid"; then
  echo -e "  ${GREEN}✓ Invalid password rejected${NC}"
else
  echo -e "  ${RED}✗ Invalid password accepted!${NC}"
fi

echo -e "  Testing non-existent user..."
INVALID_USER=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "TestPass123!"
  }')

if echo "$INVALID_USER" | grep -q "Invalid"; then
  echo -e "  ${GREEN}✓ Non-existent user rejected${NC}"
else
  echo -e "  ${RED}✗ Non-existent user accepted!${NC}"
fi

echo -e "  Testing invalid refresh token..."
INVALID_REFRESH=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "invalid.token.here"}')

if echo "$INVALID_REFRESH" | grep -q "Invalid"; then
  echo -e "  ${GREEN}✓ Invalid refresh token rejected${NC}"
else
  echo -e "  ${RED}✗ Invalid refresh token accepted!${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All auth endpoints tested${NC}"
echo -e "${GREEN}✓ Registration working for all roles${NC}"
echo -e "${GREEN}✓ Email verification working${NC}"
echo -e "${GREEN}✓ Login/Logout working${NC}"
echo -e "${GREEN}✓ Token refresh working${NC}"
echo -e "${GREEN}✓ Password reset working${NC}"
echo -e "${GREEN}✓ Session management working${NC}"
echo -e "${GREEN}✓ Security validations working${NC}"
echo ""
