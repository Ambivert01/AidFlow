import axios from "axios";

/**
 * AI Agent Clients
 * Each agent is isolated and replaceable
 */
export const aiClients = {
  eligibility: {
    async check(payload) {
      const res = await axios.post(
        "http://localhost:8001/check",
        payload
      );
      return res.data;
    },
  },

  fraud: {
    async detect(payload) {
      const res = await axios.post(
        "http://localhost:8002/detect",
        payload
      );
      return res.data;
    },
  },

  risk: {
    async assess(payload) {
      const res = await axios.post(
        "http://localhost:8003/evaluate",
        payload
      );
      return res.data;
    },
  },
};
