import api from "./api";

/*
Create new relief campaign
 */
export const createCampaign = (data) =>
  api.post("/campaigns", data);

/*
Fetch NGO-owned campaigns
 */
export const fetchNgoCampaigns = () =>
  api.get("/campaigns/ngo");

/*
Add beneficiary to campaign
 */
export const addBeneficiary = (data) =>
  api.post("/beneficiaries", data);

/*
Fetch beneficiaries of a campaign
 */
export const fetchBeneficiaries = (campaignId) =>
  api.get(`/beneficiaries/${campaignId}`);

/*
Start AidFlow AI workflow
 */
export const startWorkflow = (campaignId) =>
  api.post("/workflows/start", { campaignId });

/*
Fetch workflow status
 */
export const fetchWorkflowStatus = (campaignId) =>
  api.get(`/workflows/${campaignId}`);
