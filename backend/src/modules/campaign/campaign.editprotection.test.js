import { expect } from "chai";
import request from "supertest";
import app from "../../app.js";
import { User } from "../../models/auth/User.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../../config/jwt.config.js";

describe("Campaign Edit Protection - Task 3.5", () => {
  let ngoToken;
  let ngoId;
  let campaignId;

  before(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/aidflow-test",
      );
    }

    // Clean up test data
    await User.deleteMany({ email: /testngo@example.com/ });
    await Campaign.deleteMany({});
  });

  beforeEach(async () => {
    // Create NGO user
    const ngo = await User.create({
      name: "Test NGO",
      email: "testngo@example.com",
      passwordHash: "$2a$10$dummyhashfortest",
      phone: "1234567890",
      role: "NGO",
      verificationStatus: "APPROVED",
      profile: {
        avatar: null,
        language: "en",
        timezone: "UTC",
      },
    });
    ngoId = ngo._id;

    // Generate JWT token
    ngoToken = jwt.sign(
      { sub: ngo._id.toString(), role: ngo.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.accessExpiry },
    );
  });

  afterEach(async () => {
    // Cleanup
    await User.deleteMany({
      email: /testngo@example.com|anotherngo@example.com/,
    });
    await Campaign.deleteMany({});
  });

  describe("Edit Protection for DRAFT campaigns", () => {
    it("should allow editing a DRAFT campaign", async () => {
      // Create a DRAFT campaign
      const createRes = await request(app)
        .post("/api/campaigns")
        .set("Authorization", `Bearer ${ngoToken}`)
        .send({
          title: "Test Campaign",
          description: "This is a test campaign for edit protection",
          disasterType: "FLOOD",
          targetAmount: 100000,
          location: {
            state: "Test State",
            district: "Test District",
          },
          policy: {
            maxPerBeneficiary: 5000,
            maxPerTransaction: 1000,
            validityDays: 30,
            allowedCategories: ["FOOD", "MEDICINE"],
          },
        });

      expect(createRes.status).to.equal(201);
      campaignId = createRes.body.data._id;

      // Try to update the DRAFT campaign
      const updateRes = await request(app)
        .patch(`/api/campaigns/${campaignId}`)
        .set("Authorization", `Bearer ${ngoToken}`)
        .send({
          title: "Updated Test Campaign",
          description: "This is an updated test campaign",
        });

      expect(updateRes.status).to.equal(200);
      expect(updateRes.body.data.title).to.equal("Updated Test Campaign");
      expect(updateRes.body.data.description).to.equal(
        "This is an updated test campaign",
      );
    });
  });

  describe("Edit Protection for PENDING_APPROVAL campaigns", () => {
    it("should NOT allow editing a PENDING_APPROVAL campaign", async () => {
      // Create a DRAFT campaign
      const createRes = await request(app)
        .post("/api/campaigns")
        .set("Authorization", `Bearer ${ngoToken}`)
        .send({
          title: "Test Campaign 2",
          description: "This is a test campaign for pending approval",
          disasterType: "EARTHQUAKE",
          targetAmount: 200000,
          location: {
            state: "Test State",
            district: "Test District",
          },
          policy: {
            maxPerBeneficiary: 5000,
            maxPerTransaction: 1000,
            validityDays: 30,
            allowedCategories: ["FOOD", "MEDICINE"],
          },
        });

      expect(createRes.status).to.equal(201);
      const pendingCampaignId = createRes.body.data._id;

      // Submit for approval
      const submitRes = await request(app)
        .post(`/api/campaigns/${pendingCampaignId}/submit`)
        .set("Authorization", `Bearer ${ngoToken}`);

      expect(submitRes.status).to.equal(200);
      expect(submitRes.body.data.status).to.equal("PENDING_APPROVAL");

      // Try to update the PENDING_APPROVAL campaign
      const updateRes = await request(app)
        .patch(`/api/campaigns/${pendingCampaignId}`)
        .set("Authorization", `Bearer ${ngoToken}`)
        .send({
          title: "Trying to update pending campaign",
        });

      expect(updateRes.status).to.equal(400);
      expect(updateRes.body.message).to.equal(
        "Cannot edit campaign after submission",
      );
    });
  });

  describe("Edit Protection for REJECTED campaigns", () => {
    it("should allow editing a REJECTED campaign", async () => {
      // Create a campaign and manually set it to REJECTED
      const campaign = await Campaign.create({
        title: "Rejected Campaign",
        description: "This campaign was rejected by admin",
        disasterType: "FIRE",
        targetAmount: 150000,
        location: {
          state: "Test State",
          district: "Test District",
        },
        createdBy: ngoId,
        jobIdHash: "test-hash-rejected",
        policySnapshot: {
          maxPerBeneficiary: 5000,
          maxPerTransaction: 1000,
          validityDays: 30,
          allowedCategories: ["FOOD", "MEDICINE"],
        },
        status: "REJECTED",
        rejectionReason: "Insufficient documentation",
      });

      const rejectedCampaignId = campaign._id;

      // Try to update the REJECTED campaign
      const updateRes = await request(app)
        .patch(`/api/campaigns/${rejectedCampaignId}`)
        .set("Authorization", `Bearer ${ngoToken}`)
        .send({
          title: "Updated Rejected Campaign",
          description: "Updated description after rejection",
        });

      expect(updateRes.status).to.equal(200);
      expect(updateRes.body.data.title).to.equal("Updated Rejected Campaign");
      expect(updateRes.body.data.description).to.equal(
        "Updated description after rejection",
      );
    });
  });

  describe("Edit Protection for ACTIVE campaigns", () => {
    it("should NOT allow editing an ACTIVE campaign", async () => {
      // Create a campaign and manually set it to ACTIVE
      const campaign = await Campaign.create({
        title: "Active Campaign",
        description: "This campaign is already active",
        disasterType: "CYCLONE",
        targetAmount: 300000,
        location: {
          state: "Test State",
          district: "Test District",
        },
        createdBy: ngoId,
        jobIdHash: "test-hash-active",
        policySnapshot: {
          maxPerBeneficiary: 5000,
          maxPerTransaction: 1000,
          validityDays: 30,
          allowedCategories: ["FOOD", "MEDICINE"],
        },
        status: "ACTIVE",
        approvedBy: new mongoose.Types.ObjectId(),
        approvedAt: new Date(),
      });

      const activeCampaignId = campaign._id;

      // Try to update the ACTIVE campaign
      const updateRes = await request(app)
        .patch(`/api/campaigns/${activeCampaignId}`)
        .set("Authorization", `Bearer ${ngoToken}`)
        .send({
          title: "Trying to update active campaign",
        });

      expect(updateRes.status).to.equal(400);
      expect(updateRes.body.message).to.equal(
        "Cannot edit campaign after submission",
      );
    });
  });

  describe("Authorization checks", () => {
    it("should NOT allow editing another NGO's campaign", async () => {
      // Create another NGO
      const anotherNgo = await User.create({
        name: "Another NGO",
        email: "anotherngo@example.com",
        passwordHash: "$2a$10$dummyhashfortest",
        phone: "0987654321",
        role: "NGO",
        verificationStatus: "APPROVED",
        profile: {
          avatar: null,
          language: "en",
          timezone: "UTC",
        },
      });

      // Generate JWT token for another NGO
      const anotherNgoToken = jwt.sign(
        { sub: anotherNgo._id.toString(), role: anotherNgo.role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessExpiry },
      );

      // Create a campaign as the first NGO
      const createRes = await request(app)
        .post("/api/campaigns")
        .set("Authorization", `Bearer ${ngoToken}`)
        .send({
          title: "First NGO Campaign",
          description: "This campaign belongs to the first NGO",
          disasterType: "DROUGHT",
          targetAmount: 100000,
          location: {
            state: "Test State",
            district: "Test District",
          },
          policy: {
            maxPerBeneficiary: 5000,
            maxPerTransaction: 1000,
            validityDays: 30,
            allowedCategories: ["FOOD", "MEDICINE"],
          },
        });

      expect(createRes.status).to.equal(201);
      const firstNgoCampaignId = createRes.body.data._id;

      // Try to update as another NGO
      const updateRes = await request(app)
        .patch(`/api/campaigns/${firstNgoCampaignId}`)
        .set("Authorization", `Bearer ${anotherNgoToken}`)
        .send({
          title: "Trying to hijack campaign",
        });

      expect(updateRes.status).to.equal(403);
      expect(updateRes.body.message).to.equal(
        "Unauthorized: You can only update your own campaigns",
      );

      // Cleanup
      await User.deleteOne({ email: "anotherngo@example.com" });
    });
  });
});
