import axios from "axios";

export async function runAIDecisionChain(payload) {
  const eligibility = await axios.post("http://localhost:8001/check", payload.eligibility);
  const fraud = await axios.post("http://localhost:8002/detect", payload.fraud);
  const risk = await axios.post("http://localhost:8003/evaluate", {
    eligibility: eligibility.data,
    fraud: fraud.data,
    policy: payload.policy
  });

  return {
    eligibility: eligibility.data,
    fraud: fraud.data,
    risk: risk.data
  };
}
