import mongoose from "mongoose";

const systemEventSchema = new mongoose.Schema(
  {
    // EVENT TYPE
    eventType: {
      type: String,
      enum: [
        "API_REQUEST",
        "API_ERROR",
        "WORKER_JOB",
        "QUEUE_EVENT",
        "SYSTEM_ERROR",
        "DATABASE_EVENT",
        "SECURITY_EVENT",
        "AI_JOB",
        "EXTERNAL_SERVICE",
        "CRON_JOB",
        "OTHER"
      ],
      required: true,
      index: true,
    },

    // SERVICE CONTEXT
    service: {
      type: String,
      required: true,
      index: true,
    },

    environment: {
      type: String,
      enum: ["development", "staging", "production"],
      default: "production",
    },

    // EVENT STATUS
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "WARNING"],
      default: "SUCCESS",
      index: true,
    },

    // MESSAGE
    message: {
      type: String,
      required: true,
    },

    // ENTITY CONTEXT
    entityType: {
      type: String,
      default: null,
    },

    entityId: {
      type: String,
      default: null,
      index: true,
    },

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },

    // REQUEST CONTEXT
    request: {
      method: { type: String, default: null },
      path: { type: String, default: null },
      ip: { type: String, default: null },
      userAgent: { type: String, default: null },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      }
    },

    // PERFORMANCE METRICS
    metrics: {
      durationMs: { type: Number, default: null },
      memoryUsageMb: { type: Number, default: null },
      cpuUsagePercent: { type: Number, default: null },
    },

    // ERROR DETAILS
    error: {
      code: { type: String, default: null },
      stackTrace: { type: String, default: null },
    },

    // JOB TRACE
    jobIdHash: {
      type: String,
      default: null,
      index: true,
    },

    correlationId: {
      type: String,
      default: null,
      index: true,
    },

    // SYSTEM METADATA
    metadata: {
      type: Object,
      default: {},
    },

    version: {
      type: Number,
      default: 1,
    }
  },
  { timestamps: true }
);

// INDEXES
systemEventSchema.index({ service: 1, createdAt: -1 });
systemEventSchema.index({ eventType: 1 });
systemEventSchema.index({ status: 1 });
systemEventSchema.index({ correlationId: 1 });

export const SystemEvent = mongoose.model(
  "SystemEvent",
  systemEventSchema
);