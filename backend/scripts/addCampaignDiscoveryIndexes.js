import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Add database indexes for Campaign Discovery Service performance optimization
 * This script adds indexes on frequently filtered fields for the donor discovery system
 */

async function addCampaignDiscoveryIndexes() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully");

    const db = mongoose.connection.db;
    const campaignsCollection = db.collection("campaigns");

    console.log("Adding campaign discovery indexes...");

    // Compound index for discovery queries (status + filters)
    await campaignsCollection.createIndex(
      {
        status: 1,
        disasterType: 1,
        createdAt: -1,
      },
      {
        name: "campaign_discovery_basic",
        background: true,
      },
    );
    console.log(
      "✓ Added basic discovery index (status + disasterType + createdAt)",
    );

    // Location-based search index
    await campaignsCollection.createIndex(
      {
        "location.state": 1,
        "location.district": 1,
        status: 1,
      },
      {
        name: "campaign_location_search",
        background: true,
      },
    );
    console.log("✓ Added location search index");

    // Trust score index for sorting
    await campaignsCollection.createIndex(
      {
        trustScore: -1,
        status: 1,
        createdAt: -1,
      },
      {
        name: "campaign_trust_score_sort",
        background: true,
      },
    );
    console.log("✓ Added trust score sorting index");

    // Funding metrics index for sorting and filtering
    await campaignsCollection.createIndex(
      {
        totalDonated: -1,
        status: 1,
        createdAt: -1,
      },
      {
        name: "campaign_funding_sort",
        background: true,
      },
    );
    console.log("✓ Added funding metrics index");

    // End date index for "ending soon" sorting
    await campaignsCollection.createIndex(
      {
        endDate: 1,
        status: 1,
      },
      {
        name: "campaign_end_date_sort",
        background: true,
        partialFilterExpression: { endDate: { $exists: true } },
      },
    );
    console.log("✓ Added end date sorting index");

    // Text search index for campaign titles and descriptions
    await campaignsCollection.createIndex(
      {
        title: "text",
        description: "text",
        "location.state": "text",
        "location.district": "text",
        "location.ward": "text",
      },
      {
        name: "campaign_text_search",
        background: true,
        weights: {
          title: 10,
          "location.state": 5,
          "location.district": 5,
          "location.ward": 3,
          description: 1,
        },
      },
    );
    console.log("✓ Added text search index");

    // NGO-based filtering (for createdBy lookups)
    await campaignsCollection.createIndex(
      {
        createdBy: 1,
        status: 1,
        createdAt: -1,
      },
      {
        name: "campaign_ngo_filter",
        background: true,
      },
    );
    console.log("✓ Added NGO filtering index");

    console.log("\n📊 Listing all campaign indexes:");
    const indexes = await campaignsCollection.listIndexes().toArray();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log("\n✅ Campaign discovery indexes added successfully!");
    console.log("These indexes will improve performance for:");
    console.log(
      "  • Campaign filtering by disaster type, location, trust score",
    );
    console.log(
      "  • Sorting by trust score, funding amount, creation date, end date",
    );
    console.log("  • Text search across campaign titles and locations");
    console.log("  • NGO-based campaign filtering");
  } catch (error) {
    console.error("❌ Error adding campaign discovery indexes:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
addCampaignDiscoveryIndexes();
