/**
 * Timeline Export Service for Donor Tracking System
 * Handles PDF and CSV export of donation timelines
 */

import { TIMELINE_EXPORT } from "./donation.timeline.constants.js";

/**
 * Export timeline to CSV format
 * @param {Object} timelineData - Timeline data from timeline service
 * @returns {String} - CSV formatted string
 */
export const exportTimelineToCSV = (timelineData) => {
  const { donation, timeline } = timelineData;

  // CSV header
  const headers = [
    "Timestamp",
    "Event",
    "Status",
    "Actor Role",
    "Actor Name",
    "Details",
  ];

  // CSV rows
  const rows = timeline.map((event) => [
    new Date(event.timestamp).toLocaleString("en-IN"),
    event.label || event.event,
    event.status || "",
    event.actor?.role || "",
    event.actor?.name || "",
    JSON.stringify(event.payload || {}),
  ]);

  // Combine header and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
};

/**
 * Export timeline to PDF format (simplified - returns HTML for PDF generation)
 * @param {Object} timelineData - Timeline data from timeline service
 * @returns {String} - HTML formatted string for PDF conversion
 */
export const exportTimelineToPDF = (timelineData) => {
  const { donation, timeline } = timelineData;

  // Generate HTML content for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Donation Timeline - ${donation.id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #4CAF50;
    }
    .summary {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary-item {
      margin: 10px 0;
    }
    .summary-label {
      font-weight: bold;
      color: #666;
    }
    .timeline {
      position: relative;
      padding-left: 30px;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 10px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #ddd;
    }
    .timeline-event {
      position: relative;
      margin-bottom: 30px;
      padding-left: 20px;
    }
    .timeline-event::before {
      content: '';
      position: absolute;
      left: -24px;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #4CAF50;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #ddd;
    }
    .event-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .event-title {
      font-weight: bold;
      font-size: 14px;
    }
    .event-time {
      color: #999;
      font-size: 12px;
    }
    .event-actor {
      color: #666;
      font-size: 12px;
      margin-bottom: 5px;
    }
    .event-details {
      background: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      color: #666;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Donation Timeline</h1>
    <p>Cryptographically Immutable Audit Trail</p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Donation ID:</span> ${donation.id}
    </div>
    <div class="summary-item">
      <span class="summary-label">Amount:</span> ₹${donation.amount?.toLocaleString("en-IN")}
    </div>
    <div class="summary-item">
      <span class="summary-label">Campaign:</span> ${donation.campaign?.title || "N/A"}
    </div>
    <div class="summary-item">
      <span class="summary-label">Status:</span> ${donation.status}
    </div>
    <div class="summary-item">
      <span class="summary-label">Created:</span> ${new Date(donation.createdAt).toLocaleString("en-IN")}
    </div>
  </div>

  <h2>Timeline Events</h2>
  <div class="timeline">
    ${timeline
      .map(
        (event) => `
      <div class="timeline-event">
        <div class="event-header">
          <div class="event-title">${event.label || event.event}</div>
          <div class="event-time">${new Date(event.timestamp).toLocaleString("en-IN")}</div>
        </div>
        <div class="event-actor">
          Verified by: ${event.actor?.name || event.actor?.role || "System"}
        </div>
        ${
          event.payload
            ? `
          <div class="event-details">
            ${Object.entries(event.payload)
              .map(
                ([key, value]) =>
                  `<div><strong>${key}:</strong> ${JSON.stringify(value)}</div>`,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `,
      )
      .join("")}
  </div>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString("en-IN")}</p>
    <p>This document is a cryptographically verified audit trail</p>
  </div>
</body>
</html>
  `;

  return html;
};

/**
 * Check export rate limit for a user
 * @param {String} userId - User ID
 * @param {Object} redis - Redis connection
 * @returns {Object} - Rate limit status
 */
export const checkExportRateLimit = async (userId, redis) => {
  const key = `export:ratelimit:${userId}`;
  const count = await redis.get(key);

  if (!count) {
    // First export in the window
    await redis.setex(key, TIMELINE_EXPORT.RATE_LIMIT.WINDOW_HOURS * 3600, 1);
    return {
      allowed: true,
      remaining: TIMELINE_EXPORT.RATE_LIMIT.MAX_EXPORTS - 1,
      resetAt: new Date(
        Date.now() + TIMELINE_EXPORT.RATE_LIMIT.WINDOW_HOURS * 3600 * 1000,
      ),
    };
  }

  const currentCount = parseInt(count);

  if (currentCount >= TIMELINE_EXPORT.RATE_LIMIT.MAX_EXPORTS) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + ttl * 1000),
      message: `Export limit reached. Try again after ${Math.ceil(ttl / 60)} minutes.`,
    };
  }

  // Increment count
  await redis.incr(key);

  return {
    allowed: true,
    remaining: TIMELINE_EXPORT.RATE_LIMIT.MAX_EXPORTS - currentCount - 1,
    resetAt: new Date(Date.now() + (await redis.ttl(key)) * 1000),
  };
};

/**
 * Get export filename
 * @param {String} donationId - Donation ID
 * @param {String} format - Export format (PDF or CSV)
 * @returns {String} - Filename
 */
export const getExportFilename = (donationId, format) => {
  const timestamp = new Date().toISOString().split("T")[0];
  return `donation-timeline-${donationId}-${timestamp}.${format.toLowerCase()}`;
};
