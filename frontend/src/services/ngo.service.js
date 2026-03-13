import api from "./api";

/*
Create new relief campaign
 */
export const createCampaign = (data) => api.post("/campaigns", data);

/*
Fetch NGO-owned campaigns
 */
export const fetchNgoCampaigns = () => api.get("/campaigns/ngo");

/*
Add beneficiary to campaign
 */
export const addBeneficiary = (data) => api.post("/beneficiary/register", data);

/*
Fetch beneficiaries of a campaign
 */
export const fetchBeneficiaries = (campaignId) =>
  api.get("/beneficiary", { params: { campaignId } });

/*
 * Fetch NGO workflow visibility (PIPELINE VIEW)
 */
export const fetchWorkflowStatus = (campaignId) =>
  api.get(`/ngo/workflow/${campaignId}`);

/*
 * Start workflow (OPTIONAL – if you expose button later)
 */
export const startWorkflow = (campaignId) =>
  Promise.resolve({ data: { message: "Workflow starts automatically for active campaigns", campaignId } });

// NGO REVIEW (Approval Flow)

// Fetch donations pending NGO review
export const fetchPendingDonations = async () => {
  const res = await api.get("/ngo/donations/pending");
  return res.data;
};

// Approve donation
export const approveDonation = async (donationId) => {
  const res = await api.post(`/ngo/donations/${donationId}/approve`);
  return res.data;
};

// Reject donation
export const rejectDonation = async (donationId, reason) => {
  const res = await api.post(`/ngo/donations/${donationId}/reject`, {
    reason,
  });
  return res.data;
};

/**
 * Fetch beneficiaries for NGO (used in review dropdown)
 */
export const fetchNgoBeneficiaries = async () => {
  const res = await api.get("/ngo/beneficiaries", { params: { status: "ACTIVE" } });
  return res.data;
};

/**
 * Assign beneficiary to donation (mandatory before approve)
 */
export const assignBeneficiaryToDonation = async (
  donationId,
  beneficiaryId
) => {
  const res = await api.post(`/ngo/donations/${donationId}/assign`, { beneficiaryId });
  return res.data;
};