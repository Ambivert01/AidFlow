import { describe, it } from "mocha";
import { expect } from "chai";
import fc from "fast-check";
import campaignDataParser from "../campaign.parser.js";

/**
 * Property-Based Tests for Campaign Data Parser
 *
 * Property 5: Campaign Data Parser Round-Trip
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

describe("Campaign Data Parser - Property-Based Tests", function () {
  /**
   * Property 5: Campaign Data Parser Round-Trip
   *
   * For any valid campaign data D:
   * - parse(D) should return valid formatted data
   * - Parsed data should maintain essential information
   * - Formatting should be consistent and predictable
   */
  describe("Property 5: Campaign Data Parser Round-Trip", function () {
    it("should correctly parse and format campaign funding progress", function () {
      return fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }), // totalDonated
          fc.integer({ min: 1, max: 1000000 }), // targetAmount
          (totalDonated, targetAmount) => {
            const campaignData = {
              totalDonated,
              targetAmount,
              title: "Test Campaign",
              description: "Test Description",
            };

            const parsed = campaignDataParser.parseCampaignData(campaignData);

            // Should calculate funding progress correctly
            const expectedProgress = Math.min(
              100,
              (totalDonated / targetAmount) * 100,
            );
            expect(parsed.fundingProgress).to.be.closeTo(
              expectedProgress,
              0.01,
            );

            // Should preserve original data
            expect(parsed.totalDonated).to.equal(totalDonated);
            expect(parsed.targetAmount).to.equal(targetAmount);

            // Should format display text
            expect(parsed.displayText).to.have.property("fundingProgressText");
            expect(parsed.displayText.fundingProgressText).to.be.a("string");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should correctly format location data", function () {
      return fc.assert(
        fc.property(
          fc.record({
            state: fc.string({ minLength: 1, maxLength: 50 }),
            district: fc.string({ minLength: 1, maxLength: 50 }),
            ward: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
              nil: undefined,
            }),
          }),
          (location) => {
            const campaignData = {
              location,
              title: "Test Campaign",
              description: "Test Description",
            };

            const parsed = campaignDataParser.parseCampaignData(campaignData);

            // Should format location string correctly
            expect(parsed.location).to.have.property("formatted");
            expect(parsed.location.formatted).to.be.a("string");
            expect(parsed.location.formatted).to.include(location.state);
            expect(parsed.location.formatted).to.include(location.district);

            if (location.ward) {
              expect(parsed.location.formatted).to.include(location.ward);
            }

            // Should preserve original location data
            expect(parsed.location.state).to.equal(location.state);
            expect(parsed.location.district).to.equal(location.district);
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle policy snapshot formatting", function () {
      return fc.assert(
        fc.property(
          fc.record({
            maxPerBeneficiary: fc.integer({ min: 100, max: 100000 }),
            validityDays: fc.integer({ min: 1, max: 365 }),
            allowedCategories: fc.array(
              fc.constantFrom("FOOD", "MEDICINE", "SHELTER", "EDUCATION"),
              { minLength: 1, maxLength: 4 },
            ),
          }),
          (policySnapshot) => {
            const campaignData = {
              policySnapshot,
              title: "Test Campaign",
              description: "Test Description",
            };

            const parsed = campaignDataParser.parseCampaignData(campaignData);

            // Should format policy snapshot
            expect(parsed.policySnapshot).to.have.property("formatted");
            expect(parsed.policySnapshot.formatted).to.be.a("string");

            // Should include key policy information
            expect(parsed.policySnapshot.formatted).to.include(
              policySnapshot.maxPerBeneficiary.toString(),
            );
            expect(parsed.policySnapshot.formatted).to.include(
              policySnapshot.validityDays.toString(),
            );

            // Should preserve original policy data
            expect(parsed.policySnapshot.maxPerBeneficiary).to.equal(
              policySnapshot.maxPerBeneficiary,
            );
            expect(parsed.policySnapshot.validityDays).to.equal(
              policySnapshot.validityDays,
            );
            expect(parsed.policySnapshot.allowedCategories).to.deep.equal(
              policySnapshot.allowedCategories,
            );
          },
        ),
        { numRuns: 30 },
      );
    });

    it("should handle edge cases gracefully", function () {
      return fc.assert(
        fc.property(
          fc.record({
            totalDonated: fc.option(fc.integer({ min: 0, max: 1000000 }), {
              nil: undefined,
            }),
            targetAmount: fc.option(fc.integer({ min: 0, max: 1000000 }), {
              nil: undefined,
            }),
            location: fc.option(
              fc.record({
                state: fc.option(fc.string(), { nil: undefined }),
                district: fc.option(fc.string(), { nil: undefined }),
              }),
              { nil: undefined },
            ),
            trustScore: fc.option(fc.integer({ min: 0, max: 100 }), {
              nil: null,
            }),
          }),
          (campaignData) => {
            const fullCampaignData = {
              title: "Test Campaign",
              description: "Test Description",
              ...campaignData,
            };

            // Should not throw errors even with missing/null data
            expect(() => {
              const parsed =
                campaignDataParser.parseCampaignData(fullCampaignData);

              // Should always return an object
              expect(parsed).to.be.an("object");

              // Should have required properties
              expect(parsed).to.have.property("title");
              expect(parsed).to.have.property("description");
              expect(parsed).to.have.property("fundingProgress");
              expect(parsed).to.have.property("location");
              expect(parsed).to.have.property("displayText");

              // Funding progress should be a valid number
              expect(parsed.fundingProgress).to.be.a("number");
              expect(parsed.fundingProgress).to.be.at.least(0);
              expect(parsed.fundingProgress).to.be.at.most(100);
            }).to.not.throw();
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should maintain data consistency across multiple parse operations", function () {
      return fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            totalDonated: fc.integer({ min: 0, max: 1000000 }),
            targetAmount: fc.integer({ min: 1, max: 1000000 }),
            trustScore: fc.integer({ min: 0, max: 100 }),
          }),
          (campaignData) => {
            // Parse the same data multiple times
            const parsed1 = campaignDataParser.parseCampaignData(campaignData);
            const parsed2 = campaignDataParser.parseCampaignData(campaignData);
            const parsed3 = campaignDataParser.parseCampaignData(campaignData);

            // Results should be identical
            expect(parsed1.fundingProgress).to.equal(parsed2.fundingProgress);
            expect(parsed2.fundingProgress).to.equal(parsed3.fundingProgress);

            expect(parsed1.displayText.fundingProgressText).to.equal(
              parsed2.displayText.fundingProgressText,
            );
            expect(parsed2.displayText.fundingProgressText).to.equal(
              parsed3.displayText.fundingProgressText,
            );

            // Should be deterministic
            expect(parsed1).to.deep.equal(parsed2);
            expect(parsed2).to.deep.equal(parsed3);
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});
