import axios from "axios";
import { config } from "../config/env.js";

export const aiClients = {
  eligibility: {
    check: (payload) =>
      axios.post(`${config.aiAgents.eligibility}/check`, payload).then(r => r.data),
  },
  fraud: {
    detect: (payload) =>
      axios.post(`${config.aiAgents.fraud}/detect`, payload).then(r => r.data),
  },
  risk: {
    assess: (payload) =>
      axios.post(`${config.aiAgents.risk}/evaluate`, payload).then(r => r.data),
  },
};
