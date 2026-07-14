/**
 * WebSocket Client Service for Real-Time Timeline Updates
 *
 * This service manages WebSocket connections to receive real-time
 * donation timeline updates from the backend.
 *
 * Features:
 * - JWT authentication
 * - Automatic reconnection with exponential backoff
 * - Missed event fetching on reconnect
 * - Connection status tracking
 */

import { io } from "socket.io-client";

let socket = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 10;
let reconnectDelay = 1000; // Start with 1 second
let maxReconnectDelay = 8000; // Max 8 seconds
let lastEventTimestamp = null;
let currentDonationId = null;
let onUpdateCallback = null;

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Connect to WebSocket server
 * @param {string} donationId - Donation ID to subscribe to
 * @param {function} onUpdate - Callback function for timeline updates
 * @returns {object} Connection status
 */
export const connectWebSocket = (donationId, onUpdate) => {
  // Disconnect existing connection if any
  if (socket) {
    disconnectWebSocket();
  }

  // Get JWT token from localStorage
  const token = localStorage.getItem("aidflow_token");
  if (!token) {
    console.error("No authentication token found");
    return { connected: false, error: "Not authenticated" };
  }

  // Store callback and donation ID
  onUpdateCallback = onUpdate;
  currentDonationId = donationId;
  lastEventTimestamp = new Date().toISOString();

  // Create socket connection
  socket = io(BACKEND_URL, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: reconnectDelay,
    reconnectionDelayMax: maxReconnectDelay,
    reconnectionAttempts: maxReconnectAttempts,
  });

  // Connection event handlers
  socket.on("connect", () => {
    console.log("WebSocket connected:", socket.id);
    reconnectAttempts = 0;
    reconnectDelay = 1000; // Reset delay

    // Subscribe to specific donation
    if (currentDonationId) {
      socket.emit("subscribe:donation", currentDonationId);
    }

    // Fetch missed events if reconnecting
    if (lastEventTimestamp) {
      fetchMissedEvents(currentDonationId, lastEventTimestamp);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("WebSocket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("WebSocket connection error:", error.message);
    reconnectAttempts++;

    // Exponential backoff
    reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("WebSocket reconnected after", attemptNumber, "attempts");
  });

  socket.on("reconnect_failed", () => {
    console.error("WebSocket reconnection failed after maximum attempts");
  });

  // Timeline update event handler
  socket.on("TIMELINE_UPDATE", (data) => {
    console.log("Timeline update received:", data);
    lastEventTimestamp = data.timestamp;

    if (onUpdateCallback && data.donationId === currentDonationId) {
      onUpdateCallback(data.event);
    }
  });

  // Specific event type handlers
  socket.on("PROOF_UPLOADED", (data) => {
    console.log("Proof uploaded event:", data);
    if (onUpdateCallback && data.donationId === currentDonationId) {
      onUpdateCallback(data.data);
    }
  });

  socket.on("PROOF_VERIFIED", (data) => {
    console.log("Proof verified event:", data);
    if (onUpdateCallback && data.donationId === currentDonationId) {
      onUpdateCallback(data.data);
    }
  });

  socket.on("BLOCKCHAIN_ANCHORED", (data) => {
    console.log("Blockchain anchored event:", data);
    if (onUpdateCallback && data.donationId === currentDonationId) {
      onUpdateCallback(data.data);
    }
  });

  socket.on("TRUST_UPDATED", (data) => {
    console.log("Trust updated event:", data);
    if (onUpdateCallback && data.donationId === currentDonationId) {
      onUpdateCallback(data.data);
    }
  });

  socket.on("WALLET_SPENT", (data) => {
    console.log("Wallet spent event:", data);
    if (onUpdateCallback && data.donationId === currentDonationId) {
      onUpdateCallback(data.data);
    }
  });

  return { connected: true };
};

/**
 * Disconnect from WebSocket server
 */
export const disconnectWebSocket = () => {
  if (socket) {
    // Unsubscribe from donation
    if (currentDonationId) {
      socket.emit("unsubscribe:donation", currentDonationId);
    }

    socket.disconnect();
    socket = null;
    currentDonationId = null;
    onUpdateCallback = null;
    lastEventTimestamp = null;
    reconnectAttempts = 0;
    reconnectDelay = 1000;
    console.log("WebSocket disconnected");
  }
};

/**
 * Fetch missed events after reconnection
 * @param {string} donationId - Donation ID
 * @param {string} since - ISO timestamp of last received event
 */
const fetchMissedEvents = async (donationId, since) => {
  try {
    const token = localStorage.getItem("aidflow_token");
    const sinceDate = new Date(since).toISOString();

    const response = await fetch(
      `${BACKEND_URL}/api/donations/${donationId}/timeline?startDate=${sinceDate}&pageSize=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      console.error(`Failed to fetch missed events: ${response.status}`);
      return;
    }

    const data = await response.json();
    const missedEvents = data.data?.timeline || data.timeline || [];

    console.log(`Fetched ${missedEvents.length} missed events`);

    if (onUpdateCallback && missedEvents.length > 0) {
      // Deduplicate events by _id before calling callback
      const uniqueEvents = missedEvents.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e._id === event._id),
      );

      console.log(
        `Applying ${uniqueEvents.length} unique missed events (${missedEvents.length - uniqueEvents.length} duplicates removed)`,
      );

      uniqueEvents.forEach((event) => {
        onUpdateCallback(event);
      });
    }
  } catch (error) {
    console.error("Error fetching missed events:", error);
    // Don't throw - this is a non-critical enhancement
  }
};

/**
 * Get connection status
 * @returns {object} Connection status
 */
export const getConnectionStatus = () => {
  return {
    connected: socket?.connected || false,
    socketId: socket?.id || null,
    reconnectAttempts,
  };
};

/**
 * Check if WebSocket is connected
 * @returns {boolean} Connection status
 */
export const isConnected = () => {
  return socket?.connected || false;
};
