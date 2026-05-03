/**
 * Bug Condition Exploration Test for Campaign Approval Security Fix
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10**
 *
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 *
 * Property 1: Bug Condition - NGO Direct Campaign Activation Vulnerability
 *
 * This test encodes the EXPECTED BEHAVIOR after the fix:
 * - Activation endpoint should return 404 (endpoint removed)
 * - Campaign should require submission via POST /api/campaigns/:id/submit
 * - Campaign should transition to PENDING_APPROVAL, not ACTIVE
 * - AI risk evaluation should be triggered
 * - Admin approval should be required before status becomes ACTIVE
 *
 * On UNFIXED code, this test will FAIL because:
 * - The activation endpoint exists and returns 200
 * - Campaign goes directly from DRAFT to ACTIVE
 * - No approval workflow is enforced
 */

import { expect } from "chai";
import request from "supertest";
import fc from "fast-check";
import mongoose from "mongoose";
import app from "../../app.js";
import { User } from "../../models/auth/User.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { AIDecisionLog } from "../../models/system/AIDecisionLog.model.js";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../../config/jwt.config.js";

describe("Property 1: Bug Condition - NGO Direct Campaign Activation Vulnerability", function () {
  let ngoUser;
  let ngoToken;

  before(async function () {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/aidflow-test",
      );
    }

    // Clean up test data
    await User.deleteMany({ email: /test-ngo-bugfix/ });
    await Campaign.deleteMany({ title: /Test Campaign Bugfix/ });
    await AIDecisionLog.deleteMany({});
  });

  beforeEach(async function () {
    // Create a verified NGO user for testing
    ngoUser = await User.create({
      name: "Test NGO for Bugfix",
      email: "test-ngo-bugfix@example.com",
      passwordHash: "hashedpassword123",
      phone: "1234567890",
      role: "NGO",
      verificationStatus: "APPROVED",
      profile: {
        avatar: null,
        language: "en",
        timezone: "UTC",
      },
    });

    // Generate JWT token for authentication
    ngoToken = jwt.sign(
      { sub: ngoUser._id.toString(), role: ngoUser.role },
      jwtConfig.secret,
      {
        expiresIn: "1h",
      },
    );
  });

  afterEach(async function () {
    // Clean up after each test
    await Campaign.deleteMany({ createdBy: ngoUser._id });
    await User.deleteOne({ _id: ngoUser._id });
    await AIDecisionLog.deleteMany({});
  });

  after(async function () {
    // Final cleanup
    await User.deleteMany({ email: /test-ngo-bugfix/ });
    await Campaign.deleteMany({ title: /Test Campaign Bugfix/ });
    await AIDecisionLog.deleteMany({});
  });

  /**
   * Property-Based Test: NGO Cannot Directly Activate Campaign
   *
   * This test generates random campaign data and verifies that:
   * 1. The activation endpoint should NOT exist (404)
   * 2. Campaign should require submission workflow
   * 3. Campaign should NOT go directly from DRAFT to ACTIVE
   *
   * EXPECTED ON UNFIXED CODE: This test will FAIL because the activation
   * endpoint exists and allows direct activation without approval.
   */
  it("should prevent NGO from directly activating campaign without admin approval", async function () {
    await fc.assert(
      fc.asyncProperty(
        // Generate random campaign data
        fc.record({
          title: fc
            .string({ minLength: 10, maxLength: 100 })
            .map((s) => `Test Campaign Bugfix ${s}`),
          description: fc.string({ minLength: 20, maxLength: 500 }),
          targetAmount: fc.integer({ min: 1000, max: 1000000 }),
          disasterType: fc.constantFrom(
            "FLOOD",
            "EARTHQUAKE",
            "CYCLONE",
            "FIRE",
            "DROUGHT",
            "PANDEMIC",
            "WAR",
            "OTHER",
          ),
          location: fc.record({
            state: fc.string({ minLength: 3, maxLength: 50 }),
            district: fc.string({ minLength: 3, maxLength: 50 }),
          }),
          policy: fc.record({
            allowedCategories: fc.constant(["FOOD", "MEDICINE", "SHELTER"]),
            maxPerBeneficiary: fc.integer({ min: 1000, max: 10000 }),
            validityDays: fc.integer({ min: 7, max: 30 }),
            maxPerTransaction: fc.integer({ min: 100, max: 5000 }),
          }),
        }),
        async (campaignData) => {
          // Step 1: Create campaign as NGO (should be DRAFT)
          const createResponse = await request(app)
            .post("/api/campaigns")
            .set("Authorization", `Bearer ${ngoToken}`)
            .send(campaignData)
            .expect(201);

          const campaign = createResponse.body.data;
          expect(campaign.status).to.equal(
            "DRAFT",
            "Campaign should be created with DRAFT status",
          );

          // Step 2: Attempt to activate campaign directly (THIS IS THE BUG)
          // EXPECTED BEHAVIOR (after fix): Should return 404 (endpoint removed)
          // ACTUAL BEHAVIOR (unfixed): Returns 200 and activates campaign
          const activateResponse = await request(app)
            .patch(`/api/campaigns/${campaign._id}/activate`)
            .set("Authorization", `Bearer ${ngoToken}`)
            .send();

          // ASSERTION 1: Activation endpoint should NOT exist (404)
          // This will FAIL on unfixed code because endpoint exists and returns 200
          expect(activateResponse.status).to.equal(
            404,
            "EXPECTED BEHAVIOR: Activation endpoint should not exist (404). " +
              "ACTUAL (UNFIXED): Endpoint exists and returns 200. " +
              "COUNTEREXAMPLE: NGO can directly activate campaign without approval.",
          );

          // Step 3: Verify campaign status is still DRAFT (not ACTIVE)
          const campaignAfterActivation = await Campaign.findById(campaign._id);

          // ASSERTION 2: Campaign should NOT be ACTIVE without approval
          // This will FAIL on unfixed code because status changes to ACTIVE
          expect(campaignAfterActivation.status).to.not.equal(
            "ACTIVE",
            "EXPECTED BEHAVIOR: Campaign should not be ACTIVE without admin approval. " +
              "ACTUAL (UNFIXED): Campaign status changed to ACTIVE directly. " +
              "COUNTEREXAMPLE: Campaign went from DRAFT to ACTIVE without approval workflow.",
          );

          // ASSERTION 3: Campaign should be in PENDING_APPROVAL or DRAFT
          // This will FAIL on unfixed code because status is ACTIVE
          expect(["DRAFT", "PENDING_APPROVAL"]).to.include(
            campaignAfterActivation.status,
            "EXPECTED BEHAVIOR: Campaign should be DRAFT or PENDING_APPROVAL. " +
              "ACTUAL (UNFIXED): Campaign is ACTIVE. " +
              "COUNTEREXAMPLE: No approval workflow enforced.",
          );

          // ASSERTION 4: No AI risk evaluation should have been triggered
          // (because activation should not have succeeded)
          const aiDecisionLogs = await AIDecisionLog.find({
            entityId: campaign._id,
            entityType: "CAMPAIGN",
          });

          // On unfixed code, this might pass because AI evaluation is not triggered
          // But we're documenting that AI evaluation SHOULD be triggered on submission
          expect(aiDecisionLogs.length).to.equal(
            0,
            "EXPECTED BEHAVIOR: No AI evaluation on direct activation attempt. " +
              "AI evaluation should only happen on proper submission workflow.",
          );

          // ASSERTION 5: approvedBy should be null (no admin approval)
          // This will FAIL on unfixed code if approvedBy is set
          expect(campaignAfterActivation.approvedBy).to.equal(
            null,
            "EXPECTED BEHAVIOR: approvedBy should be null without admin approval. " +
              "ACTUAL (UNFIXED): Campaign activated without admin approval. " +
              "COUNTEREXAMPLE: No admin approval record exists but campaign is ACTIVE.",
          );
        },
      ),
      {
        numRuns: 10, // Run 10 test cases with different campaign data
        verbose: true, // Show detailed output for debugging
      },
    );
  });

  /**
   * Concrete Test Case: Direct Activation Vulnerability
   *
   * This is a concrete example that demonstrates the bug clearly.
   * It's easier to understand than the property-based test above.
   */
  it("CONCRETE EXAMPLE: NGO creates DRAFT campaign and directly activates it (demonstrates bug)", async function () {
    // Create a campaign
    const campaignData = {
      title: "Test Campaign Bugfix - Flood Relief",
      description:
        "This is a test campaign to demonstrate the security vulnerability",
      targetAmount: 50000,
      disasterType: "FLOOD",
      location: {
        state: "Test State",
        district: "Test District",
      },
      policy: {
        allowedCategories: ["FOOD", "MEDICINE", "SHELTER"],
        maxPerBeneficiary: 5000,
        validityDays: 14,
        maxPerTransaction: 1000,
      },
    };

    const createResponse = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${ngoToken}`)
      .send(campaignData)
      .expect(201);

    const campaign = createResponse.body.data;
    expect(campaign.status).to.equal("DRAFT");

    // Attempt to activate directly
    const activateResponse = await request(app)
      .patch(`/api/campaigns/${campaign._id}/activate`)
      .set("Authorization", `Bearer ${ngoToken}`)
      .send();

    // EXPECTED (after fix): 404 - endpoint should not exist
    // ACTUAL (unfixed): 200 - endpoint exists and activates campaign
    expect(activateResponse.status).to.equal(
      404,
      "COUNTEREXAMPLE FOUND: NGO successfully activated campaign without approval. " +
        "The /activate endpoint should not exist. " +
        "Expected 404, but got " +
        activateResponse.status,
    );

    // Verify campaign is not ACTIVE
    const updatedCampaign = await Campaign.findById(campaign._id);
    expect(updatedCampaign.status).to.not.equal(
      "ACTIVE",
      "COUNTEREXAMPLE FOUND: Campaign status changed to ACTIVE without admin approval. " +
        "Campaign should remain DRAFT or require submission to PENDING_APPROVAL.",
    );

    // Verify no admin approval exists
    expect(updatedCampaign.approvedBy).to.equal(
      null,
      "COUNTEREXAMPLE FOUND: Campaign is ACTIVE but approvedBy is null. " +
        "This proves no admin approval was required.",
    );
  });

  /**
   * Test: Submission Endpoint Should Exist (Expected Behavior)
   *
   * This test verifies that the proper submission workflow exists.
   * On unfixed code, this will FAIL because the endpoint doesn't exist.
   */
  it("should provide submission endpoint for NGO to request approval", async function () {
    // Create a campaign
    const campaignData = {
      title: "Test Campaign Bugfix - Submission Test",
      description: "Testing the submission workflow",
      targetAmount: 30000,
      disasterType: "EARTHQUAKE",
      location: {
        state: "Test State",
        district: "Test District",
      },
      policy: {
        allowedCategories: ["FOOD", "MEDICINE"],
        maxPerBeneficiary: 3000,
        validityDays: 10,
        maxPerTransaction: 500,
      },
    };

    const createResponse = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${ngoToken}`)
      .send(campaignData)
      .expect(201);

    const campaign = createResponse.body.data;

    // Attempt to submit for approval
    const submitResponse = await request(app)
      .post(`/api/campaigns/${campaign._id}/submit`)
      .set("Authorization", `Bearer ${ngoToken}`)
      .send();

    // EXPECTED (after fix): 200 - submission endpoint exists
    // ACTUAL (unfixed): 404 - endpoint doesn't exist
    expect(submitResponse.status).to.equal(
      200,
      "EXPECTED BEHAVIOR: Submission endpoint should exist at POST /api/campaigns/:id/submit. " +
        "ACTUAL (UNFIXED): Endpoint returns 404. " +
        "COUNTEREXAMPLE: No submission workflow exists.",
    );

    // Verify campaign transitioned to PENDING_APPROVAL
    const submittedCampaign = await Campaign.findById(campaign._id);
    expect(submittedCampaign.status).to.equal(
      "PENDING_APPROVAL",
      "EXPECTED BEHAVIOR: Campaign should transition to PENDING_APPROVAL after submission. " +
        "ACTUAL (UNFIXED): Campaign status is " +
        submittedCampaign.status,
    );
  });
});
