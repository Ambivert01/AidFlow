/**
 * Advanced Auth System - Comprehensive Test Script
 * Tests all auth endpoints with real data for all roles
 */

import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { User } from "../src/models/auth/User.model.js";

const API_URL = "http://localhost:5000/api";

// Test data for all roles
const testUsers = {
  donor: {
    name: "Test Donor",
    email: "donor@test.com",
    password: "TestPass123!",
    role: "DONOR",
  },
  ngo: {
    name: "Test NGO",
    email: "ngo@test.com",
    password: "TestPass123!",
    role: "NGO",
  },
  merchant: {
    name: "Test Merchant",
    email: "merchant@test.com",
    password: "TestPass123!",
    role: "MERCHANT",
  },
  government: {
    name: "Test Government",
    email: "govt@test.com",
    password: "TestPass123!",
    role: "GOVERNMENT",
  },
  beneficiary: {
    name: "Test Beneficiary",
    email: "beneficiary@test.com",
    password: "TestPass123!",
    role: "BENEFICIARY",
  },
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "cyan");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function logSection(message) {
  log(`\n${"=".repeat(60)}`, "blue");
  log(`  ${message}`, "blue");
  log(`${"=".repeat(60)}`, "blue");
}

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, details = "") {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    logSuccess(`${name} ${details}`);
  } else {
    testResults.failed++;
    logError(`${name} ${details}`);
  }
}

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logSuccess("Connected to MongoDB");
  } catch (error) {
    logError(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

// Clean up test data
async function cleanupTestData() {
  logInfo("Cleaning up existing test data...");
  const emails = Object.values(testUsers).map((u) => u.email);
  await User.deleteMany({ email: { $in: emails } });
  logSuccess("Test data cleaned up");
}

// Test 1: Registration for all roles
async function testRegistration() {
  logSection("TEST 1: User Registration (All Roles)");

  for (const [role, userData] of Object.entries(testUsers)) {
    try {
      // DONOR uses /auth/register, others use /access/request
      // BENEFICIARY cannot self-register (registered by NGOs)
      let endpoint, response;

      if (role === "donor") {
        endpoint = `${API_URL}/auth/register`;
        response = await axios.post(endpoint, userData);
      } else if (role === "beneficiary") {
        // Skip BENEFICIARY - they are registered by NGOs, not self-registered
        logInfo(
          `Skipping BENEFICIARY - registered by NGOs, not self-registered`,
        );
        continue;
      } else {
        // NGO, MERCHANT, GOVERNMENT use /access/request
        endpoint = `${API_URL}/access/request`;
        response = await axios.post(endpoint, userData);
      }

      if (response.status === 201) {
        const { user, emailVerificationToken } = response.data.data;

        // Store verification token and user ID
        testUsers[role].emailVerificationToken = emailVerificationToken;
        testUsers[role].userId = user._id;

        recordTest(
          `Register ${role.toUpperCase()}`,
          true,
          `- User ID: ${user._id}`,
        );

        // Check verification status
        if (role === "donor") {
          if (user.verificationStatus === "APPROVED") {
            logInfo(`  → DONOR auto-approved (can login immediately)`);
          }
        } else {
          if (user.verificationStatus === "PENDING") {
            logInfo(`  → ${role.toUpperCase()} pending admin approval`);
          }
        }
      }
    } catch (error) {
      recordTest(
        `Register ${role.toUpperCase()}`,
        false,
        `- ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

// Test 2: Email Verification
async function testEmailVerification() {
  logSection("TEST 2: Email Verification");

  for (const [role, userData] of Object.entries(testUsers)) {
    if (role === "beneficiary") {
      logWarning(`Skipping ${role} - not self-registered`);
      continue;
    }

    if (!userData.emailVerificationToken) {
      logWarning(`Skipping ${role} - no verification token`);
      continue;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, {
        token: userData.emailVerificationToken,
      });

      if (response.status === 200) {
        recordTest(`Email Verification ${role.toUpperCase()}`, true);
      }
    } catch (error) {
      recordTest(
        `Email Verification ${role.toUpperCase()}`,
        false,
        `- ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

// Test 3: Login (only DONOR can login without admin approval)
async function testLogin() {
  logSection("TEST 3: User Login");

  // Approve non-donor users first (skip beneficiary)
  logInfo("Approving NGO, MERCHANT, GOVERNMENT users...");
  for (const [role, userData] of Object.entries(testUsers)) {
    if (role !== "donor" && role !== "beneficiary" && userData.userId) {
      await User.findByIdAndUpdate(userData.userId, {
        verificationStatus: "APPROVED",
      });
    }
  }
  logSuccess("All users approved");

  // Test login for all roles (skip beneficiary)
  for (const [role, userData] of Object.entries(testUsers)) {
    if (role === "beneficiary") {
      logWarning(`Skipping ${role} - not self-registered`);
      continue;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password,
      });

      if (response.status === 200) {
        const { user, accessToken, refreshToken } = response.data.data;

        // Store tokens
        testUsers[role].accessToken = accessToken;
        testUsers[role].refreshToken = refreshToken;

        recordTest(
          `Login ${role.toUpperCase()}`,
          true,
          `- Access token length: ${accessToken.length}`,
        );
        logInfo(`  → Refresh token length: ${refreshToken.length}`);
      }
    } catch (error) {
      recordTest(
        `Login ${role.toUpperCase()}`,
        false,
        `- ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

// Test 4: Get Current User (Me endpoint)
async function testGetMe() {
  logSection("TEST 4: Get Current User (/me)");

  for (const [role, userData] of Object.entries(testUsers)) {
    if (!userData.accessToken) {
      logWarning(`Skipping ${role} - no access token`);
      continue;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${userData.accessToken}` },
      });

      if (response.status === 200) {
        const user = response.data.data;
        recordTest(
          `Get Me ${role.toUpperCase()}`,
          true,
          `- Email: ${user.email}, Role: ${user.role}`,
        );
      }
    } catch (error) {
      recordTest(
        `Get Me ${role.toUpperCase()}`,
        false,
        `- ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

// Test 5: Refresh Token
async function testRefreshToken() {
  logSection("TEST 5: Refresh Access Token");

  for (const [role, userData] of Object.entries(testUsers)) {
    if (!userData.refreshToken) {
      logWarning(`Skipping ${role} - no refresh token`);
      continue;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: userData.refreshToken,
      });

      if (response.status === 200) {
        const { accessToken } = response.data.data;

        // Update access token
        testUsers[role].newAccessToken = accessToken;

        recordTest(
          `Refresh Token ${role.toUpperCase()}`,
          true,
          `- New token length: ${accessToken.length}`,
        );
      }
    } catch (error) {
      recordTest(
        `Refresh Token ${role.toUpperCase()}`,
        false,
        `- ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

// Test 6: Get Active Sessions
async function testGetSessions() {
  logSection("TEST 6: Get Active Sessions");

  for (const [role, userData] of Object.entries(testUsers)) {
    if (!userData.accessToken) {
      logWarning(`Skipping ${role} - no access token`);
      continue;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/sessions`, {
        headers: { Authorization: `Bearer ${userData.accessToken}` },
      });

      if (response.status === 200) {
        const { sessions } = response.data.data;
        recordTest(
          `Get Sessions ${role.toUpperCase()}`,
          true,
          `- Active sessions: ${sessions.length}`,
        );

        if (sessions.length > 0) {
          logInfo(`  → Device: ${sessions[0].device}`);
          logInfo(`  → IP: ${sessions[0].ip || "N/A"}`);
        }
      }
    } catch (error) {
      recordTest(
        `Get Sessions ${role.toUpperCase()}`,
        false,
        `- ${error.response?.data?.message || error.message}`,
      );
    }
  }
}

// Test 7: Password Reset Flow
async function testPasswordReset() {
  logSection("TEST 7: Password Reset Flow");

  const testRole = "donor"; // Test with donor
  const userData = testUsers[testRole];

  // Step 1: Request password reset
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, {
      email: userData.email,
    });

    if (response.status === 200) {
      const { resetToken } = response.data.data;
      recordTest("Request Password Reset", true);

      // Step 2: Reset password
      if (resetToken) {
        const newPassword = "NewTestPass123!";

        try {
          const resetResponse = await axios.post(
            `${API_URL}/auth/reset-password`,
            {
              token: resetToken,
              newPassword,
            },
          );

          if (resetResponse.status === 200) {
            recordTest("Reset Password", true);

            // Step 3: Login with new password
            try {
              const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                email: userData.email,
                password: newPassword,
              });

              if (loginResponse.status === 200) {
                recordTest("Login with New Password", true);

                // Restore old password for other tests
                await User.findByIdAndUpdate(userData.userId, {
                  passwordHash: await import("bcrypt").then((bcrypt) =>
                    bcrypt.hash(userData.password, 12),
                  ),
                });
              }
            } catch (error) {
              recordTest(
                "Login with New Password",
                false,
                `- ${error.response?.data?.message || error.message}`,
              );
            }
          }
        } catch (error) {
          recordTest(
            "Reset Password",
            false,
            `- ${error.response?.data?.message || error.message}`,
          );
        }
      }
    }
  } catch (error) {
    recordTest(
      "Request Password Reset",
      false,
      `- ${error.response?.data?.message || error.message}`,
    );
  }
}

// Test 8: Logout
async function testLogout() {
  logSection("TEST 8: Logout (Single Device)");

  const testRole = "merchant"; // Test with merchant
  const userData = testUsers[testRole];

  if (!userData.accessToken || !userData.refreshToken) {
    logWarning("Skipping logout test - no tokens");
    return;
  }

  try {
    const response = await axios.post(
      `${API_URL}/auth/logout`,
      {
        refreshToken: userData.refreshToken,
      },
      {
        headers: { Authorization: `Bearer ${userData.accessToken}` },
      },
    );

    if (response.status === 200) {
      recordTest("Logout Single Device", true);

      // Try to use the refresh token (should fail)
      try {
        await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: userData.refreshToken,
        });
        recordTest("Revoked Token Rejected", false, "- Token still valid!");
      } catch (error) {
        if (error.response?.status === 401) {
          recordTest(
            "Revoked Token Rejected",
            true,
            "- Token properly revoked",
          );
        }
      }
    }
  } catch (error) {
    recordTest(
      "Logout Single Device",
      false,
      `- ${error.response?.data?.message || error.message}`,
    );
  }
}

// Test 9: Logout All Devices
async function testLogoutAll() {
  logSection("TEST 9: Logout All Devices");

  const testRole = "ngo"; // Test with NGO
  const userData = testUsers[testRole];

  if (!userData.accessToken) {
    logWarning("Skipping logout all test - no access token");
    return;
  }

  try {
    const response = await axios.post(
      `${API_URL}/auth/logout-all`,
      {},
      {
        headers: { Authorization: `Bearer ${userData.accessToken}` },
      },
    );

    if (response.status === 200) {
      recordTest("Logout All Devices", true);

      // Verify all sessions cleared
      const user = await User.findById(userData.userId);
      if (user.sessions.length === 0) {
        recordTest("All Sessions Cleared", true);
      } else {
        recordTest(
          "All Sessions Cleared",
          false,
          `- ${user.sessions.length} sessions remaining`,
        );
      }
    }
  } catch (error) {
    recordTest(
      "Logout All Devices",
      false,
      `- ${error.response?.data?.message || error.message}`,
    );
  }
}

// Test 10: Invalid Credentials
async function testInvalidCredentials() {
  logSection("TEST 10: Security Tests");

  // Test 1: Invalid password
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: testUsers.donor.email,
      password: "WrongPassword123!",
    });
    recordTest("Invalid Password Rejected", false, "- Login succeeded!");
  } catch (error) {
    if (error.response?.status === 401) {
      recordTest("Invalid Password Rejected", true);
    }
  }

  // Test 2: Non-existent user
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: "nonexistent@test.com",
      password: "TestPass123!",
    });
    recordTest("Non-existent User Rejected", false, "- Login succeeded!");
  } catch (error) {
    if (error.response?.status === 401) {
      recordTest("Non-existent User Rejected", true);
    }
  }

  // Test 3: Invalid refresh token
  try {
    await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: "invalid.token.here",
    });
    recordTest("Invalid Refresh Token Rejected", false, "- Refresh succeeded!");
  } catch (error) {
    if (error.response?.status === 401) {
      recordTest("Invalid Refresh Token Rejected", true);
    }
  }

  // Test 4: Invalid verification token
  try {
    await axios.post(`${API_URL}/auth/verify-email`, {
      token: "invalidtoken123",
    });
    recordTest(
      "Invalid Verification Token Rejected",
      false,
      "- Verification succeeded!",
    );
  } catch (error) {
    if (error.response?.status === 400) {
      recordTest("Invalid Verification Token Rejected", true);
    }
  }
}

// Test 11: Session Limit
async function testSessionLimit() {
  logSection("TEST 11: Session Limit (Max 5 Sessions)");

  const testRole = "government"; // Test with government
  const userData = testUsers[testRole];

  // Create 6 sessions (should keep only last 5)
  const sessions = [];
  for (let i = 0; i < 6; i++) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password,
      });

      if (response.status === 200) {
        sessions.push(response.data.data.refreshToken);
      }
    } catch (error) {
      logError(`Failed to create session ${i + 1}`);
    }
  }

  // Check session count in database
  const user = await User.findById(userData.userId);
  if (user.sessions.length === 5) {
    recordTest("Session Limit Enforced", true, "- Max 5 sessions maintained");
  } else {
    recordTest(
      "Session Limit Enforced",
      false,
      `- ${user.sessions.length} sessions found`,
    );
  }

  // Verify oldest session was removed
  if (sessions.length === 6) {
    try {
      await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: sessions[0], // First session should be removed
      });
      recordTest(
        "Oldest Session Removed",
        false,
        "- First session still valid",
      );
    } catch (error) {
      if (error.response?.status === 401) {
        recordTest("Oldest Session Removed", true);
      }
    }
  }
}

// Print test summary
function printSummary() {
  logSection("TEST SUMMARY");

  log(`\nTotal Tests: ${testResults.tests.length}`, "cyan");
  log(`Passed: ${testResults.passed}`, "green");
  log(`Failed: ${testResults.failed}`, "red");
  log(
    `Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(2)}%`,
    testResults.failed === 0 ? "green" : "yellow",
  );

  if (testResults.failed > 0) {
    log("\nFailed Tests:", "red");
    testResults.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        log(`  - ${t.name} ${t.details}`, "red");
      });
  }

  log("\n");
}

// Main test runner
async function runTests() {
  try {
    log("\n🚀 Starting Advanced Auth System Tests\n", "cyan");

    await connectDB();
    await cleanupTestData();

    await testRegistration();
    await testEmailVerification();
    await testLogin();
    await testGetMe();
    await testRefreshToken();
    await testGetSessions();
    await testPasswordReset();
    await testLogout();
    await testLogoutAll();
    await testInvalidCredentials();
    await testSessionLimit();

    printSummary();

    // Cleanup
    await cleanupTestData();
    await mongoose.connection.close();

    process.exit(testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    logError(`Test runner failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
