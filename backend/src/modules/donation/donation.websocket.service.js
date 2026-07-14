/**
 * WebSocket Service for Real-Time Donation Timeline Updates
 *
 * This service manages WebSocket connections for authenticated donors
 * and emits real-time timeline updates when audit logs are created.
 *
 * Features:
 * - JWT authentication for WebSocket connections
 * - Donor-specific rooms for targeted event delivery
 * - Event emission for timeline updates
 * - Connection/disconnection logging
 * - Rate limiting support
 */

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "../../utils/logger.js";
import { getAllowedOrigins } from "../../config/env.config.js";
import {
  WEBSOCKET_EVENT_TYPE,
  WEBSOCKET_RATE_LIMIT,
} from "./donation.timeline.constants.js";

let io = null;

// Rate limiting tracking: donorId -> [timestamps]
const rateLimitTracking = new Map();

// Event queuing: donorId -> [events]
const eventQueues = new Map();

// Active connections: Set of donorIds
const activeConnections = new Set();

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
    path: "/socket.io/",
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to socket (JWT uses 'sub' field for user ID)
      socket.userId = decoded.sub || decoded.userId;
      socket.userRole = decoded.role;

      logger.info(
        `WebSocket authentication successful for user ${socket.userId}`,
      );
      next();
    } catch (error) {
      logger.error("WebSocket authentication failed", error);
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    logger.info(
      `WebSocket client connected: ${socket.id}, userId: ${socket.userId}`,
    );

    // Mark donor as active
    activeConnections.add(socket.userId);

    // Join donor-specific room
    const donorRoom = `donor:${socket.userId}`;
    socket.join(donorRoom);
    logger.info(`User ${socket.userId} joined room: ${donorRoom}`);

    // Deliver queued events on connection
    deliverQueuedEvents(socket.userId);

    // Handle donation subscription (optional - for specific donation tracking)
    socket.on("subscribe:donation", (donationId) => {
      const donationRoom = `donation:${donationId}`;
      socket.join(donationRoom);
      logger.info(
        `User ${socket.userId} subscribed to donation: ${donationId}`,
      );
    });

    // Handle donation unsubscription
    socket.on("unsubscribe:donation", (donationId) => {
      const donationRoom = `donation:${donationId}`;
      socket.leave(donationRoom);
      logger.info(
        `User ${socket.userId} unsubscribed from donation: ${donationId}`,
      );
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      // Mark donor as inactive
      activeConnections.delete(socket.userId);
      logger.info(
        `WebSocket client disconnected: ${socket.id}, reason: ${reason}`,
      );
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error(`WebSocket error for client ${socket.id}:`, error);
    });
  });

  logger.info("WebSocket server initialized successfully");
  return io;
};

/**
 * Check if donor is currently connected
 * @param {string} donorId - Donor user ID
 * @returns {boolean} True if donor is connected
 */
const isDonorConnected = (donorId) => {
  return activeConnections.has(donorId);
};

/**
 * Check if donor has exceeded rate limit
 * Uses sliding window algorithm: max 10 events per minute
 * @param {string} donorId - Donor user ID
 * @returns {boolean} True if rate limited
 */
const isRateLimited = (donorId) => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Get timestamps for this donor
  let timestamps = rateLimitTracking.get(donorId) || [];

  // Remove timestamps older than 1 minute (sliding window)
  timestamps = timestamps.filter((t) => t > oneMinuteAgo);

  // Check if limit exceeded
  if (timestamps.length >= WEBSOCKET_RATE_LIMIT.MAX_EVENTS_PER_MINUTE) {
    logger.warn(
      `Rate limit exceeded for donor ${donorId}: ${timestamps.length} events in last minute`,
    );
    return true; // Rate limited
  }

  // Add current timestamp
  timestamps.push(now);
  rateLimitTracking.set(donorId, timestamps);

  return false;
};

/**
 * Queue event for offline donor
 * @param {string} donorId - Donor user ID
 * @param {object} eventData - Event data to queue
 */
const queueEvent = (donorId, eventData) => {
  let queue = eventQueues.get(donorId) || [];

  // Add event to queue
  queue.push({
    ...eventData,
    queuedAt: new Date().toISOString(),
  });

  // Enforce max queue size (FIFO - drop oldest)
  if (queue.length > WEBSOCKET_RATE_LIMIT.QUEUE_SIZE) {
    const dropped = queue.shift(); // Remove oldest
    logger.warn(
      `Queue size exceeded for donor ${donorId}, dropped oldest event: ${dropped.event?.eventType || "unknown"}`,
    );
  }

  eventQueues.set(donorId, queue);
  logger.info(
    `Event queued for offline donor ${donorId}, queue size: ${queue.length}`,
  );
};

/**
 * Deliver all queued events to reconnected donor
 * @param {string} donorId - Donor user ID
 */
const deliverQueuedEvents = (donorId) => {
  const queue = eventQueues.get(donorId) || [];

  if (queue.length === 0) {
    return;
  }

  logger.info(`Delivering ${queue.length} queued events to donor ${donorId}`);

  // Deliver all queued events
  queue.forEach((queuedEvent) => {
    const { donationId, event, queuedAt } = queuedEvent;

    try {
      const donorRoom = `donor:${donorId}`;
      io.to(donorRoom).emit(WEBSOCKET_EVENT_TYPE.TIMELINE_UPDATE, {
        donationId,
        event,
        timestamp: new Date().toISOString(),
        queuedAt, // Include original queue timestamp
        isQueued: true, // Flag to indicate this was queued
      });
    } catch (error) {
      logger.error(`Error delivering queued event to donor ${donorId}:`, error);
    }
  });

  // Clear queue after successful delivery
  eventQueues.delete(donorId);
  logger.info(`Cleared event queue for donor ${donorId}`);
};

/**
 * Emit timeline update to donor
 * Implements rate limiting and queuing for offline donors
 * @param {string} donorId - Donor user ID
 * @param {string} donationId - Donation ID
 * @param {object} event - Timeline event data
 */
export const emitTimelineUpdate = (donorId, donationId, event) => {
  if (!io) {
    logger.warn("WebSocket server not initialized, cannot emit event");
    return;
  }

  try {
    // Check if donor is connected
    if (!isDonorConnected(donorId)) {
      // Queue event for later delivery
      queueEvent(donorId, { donationId, event });
      logger.info(
        `Event queued for offline donor ${donorId}, donation ${donationId}`,
      );
      return;
    }

    // Check rate limit
    if (isRateLimited(donorId)) {
      logger.warn(
        `Rate limit exceeded for donor ${donorId}, event dropped: ${event.eventType || "unknown"}`,
      );
      return;
    }

    // Emit event to donor's room
    const donorRoom = `donor:${donorId}`;
    io.to(donorRoom).emit(WEBSOCKET_EVENT_TYPE.TIMELINE_UPDATE, {
      donationId,
      event,
      timestamp: new Date().toISOString(),
    });

    // Also emit to specific donation room if anyone is subscribed
    const donationRoom = `donation:${donationId}`;
    io.to(donationRoom).emit(WEBSOCKET_EVENT_TYPE.TIMELINE_UPDATE, {
      donationId,
      event,
      timestamp: new Date().toISOString(),
    });

    logger.info(
      `Timeline update emitted for donation ${donationId} to donor ${donorId}`,
    );
  } catch (error) {
    logger.error("Error emitting timeline update:", error);
  }
};

/**
 * Emit specific event type to donor
 * @param {string} donorId - Donor user ID
 * @param {string} donationId - Donation ID
 * @param {string} eventType - Event type (PROOF_UPLOADED, PROOF_VERIFIED, etc.)
 * @param {object} eventData - Event data
 */
export const emitDonationEvent = (
  donorId,
  donationId,
  eventType,
  eventData,
) => {
  if (!io) {
    logger.warn("WebSocket server not initialized, cannot emit event");
    return;
  }

  try {
    const donorRoom = `donor:${donorId}`;

    // Emit specific event type
    io.to(donorRoom).emit(eventType, {
      donationId,
      data: eventData,
      timestamp: new Date().toISOString(),
    });

    logger.info(
      `Event ${eventType} emitted for donation ${donationId} to donor ${donorId}`,
    );
  } catch (error) {
    logger.error(`Error emitting event ${eventType}:`, error);
  }
};

/**
 * Get WebSocket server instance
 * @returns {Server|null} Socket.IO server instance
 */
export const getWebSocketServer = () => {
  return io;
};

/**
 * Get connected clients count
 * @returns {number} Number of connected clients
 */
export const getConnectedClientsCount = () => {
  if (!io) return 0;
  return io.sockets.sockets.size;
};

/**
 * Get clients in a specific room
 * @param {string} room - Room name
 * @returns {Set} Set of socket IDs in the room
 */
export const getClientsInRoom = (room) => {
  if (!io) return new Set();
  return io.sockets.adapter.rooms.get(room) || new Set();
};

/**
 * Get rate limit statistics for monitoring
 * @returns {object} Rate limit statistics
 */
export const getRateLimitStats = () => {
  const stats = {
    totalTrackedDonors: rateLimitTracking.size,
    donors: [],
  };

  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  rateLimitTracking.forEach((timestamps, donorId) => {
    const recentEvents = timestamps.filter((t) => t > oneMinuteAgo);
    stats.donors.push({
      donorId,
      eventsInLastMinute: recentEvents.length,
      isRateLimited:
        recentEvents.length >= WEBSOCKET_RATE_LIMIT.MAX_EVENTS_PER_MINUTE,
    });
  });

  return stats;
};

/**
 * Get event queue statistics for monitoring
 * @returns {object} Queue statistics
 */
export const getQueueStats = () => {
  const stats = {
    totalQueues: eventQueues.size,
    totalQueuedEvents: 0,
    queues: [],
  };

  eventQueues.forEach((queue, donorId) => {
    stats.totalQueuedEvents += queue.length;
    stats.queues.push({
      donorId,
      queueSize: queue.length,
      oldestEventAge: queue.length > 0 ? queue[0].queuedAt : null,
    });
  });

  return stats;
};

/**
 * Get active connections list
 * @returns {Array} Array of active donor IDs
 */
export const getActiveConnections = () => {
  return Array.from(activeConnections);
};

/**
 * Clear rate limit tracking for a donor (for testing/admin purposes)
 * @param {string} donorId - Donor user ID
 */
export const clearRateLimitForDonor = (donorId) => {
  rateLimitTracking.delete(donorId);
  logger.info(`Rate limit tracking cleared for donor ${donorId}`);
};

/**
 * Clear event queue for a donor (for testing/admin purposes)
 * @param {string} donorId - Donor user ID
 */
export const clearQueueForDonor = (donorId) => {
  const queue = eventQueues.get(donorId);
  if (queue) {
    eventQueues.delete(donorId);
    logger.info(
      `Event queue cleared for donor ${donorId}, ${queue.length} events removed`,
    );
    return queue.length;
  }
  return 0;
};
