/**
 * System Roles Constants
 * Centralized role definitions to prevent typos and ensure consistency
 */

export const ROLES = {
  ADMIN: "ADMIN",
  GOVERNMENT: "GOVERNMENT",
  NGO: "NGO",
  DONOR: "DONOR",
  BENEFICIARY: "BENEFICIARY",
  MERCHANT: "MERCHANT",
};

export const VERIFICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    "manage_users",
    "approve_ngos",
    "approve_merchants",
    "approve_government",
    "view_all_data",
    "manage_system",
  ],
  [ROLES.GOVERNMENT]: [
    "view_all_campaigns",
    "view_all_donations",
    "view_fraud_alerts",
    "escalate_cases",
    "oversight",
  ],
  [ROLES.NGO]: [
    "create_campaign",
    "manage_campaign",
    "register_beneficiary",
    "approve_beneficiary",
    "view_donations",
  ],
  [ROLES.DONOR]: [
    "donate",
    "view_own_donations",
    "view_campaigns",
    "verify_proofs",
  ],
  [ROLES.BENEFICIARY]: ["view_wallet", "generate_qr", "view_transactions"],
  [ROLES.MERCHANT]: ["scan_qr", "process_payment", "view_settlements"],
};

// Roles that require admin approval
export const ROLES_REQUIRING_APPROVAL = [
  ROLES.NGO,
  ROLES.MERCHANT,
  ROLES.GOVERNMENT,
];

// Roles that can self-register
// BENEFICIARY is included because aid seekers can create their own account
// and self-apply to a campaign (see modules/beneficiary "apply" flow). This
// only creates the login account - the actual aid application still goes
// through AI eligibility scoring + NGO/Admin manual review before a wallet
// is issued, exactly like NGO-registered beneficiaries.
export const SELF_REGISTER_ROLES = [ROLES.DONOR, ROLES.BENEFICIARY];

// Role-based dashboard routes
export const ROLE_ROUTES = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.GOVERNMENT]: "/government",
  [ROLES.NGO]: "/ngo",
  [ROLES.DONOR]: "/donor",
  [ROLES.BENEFICIARY]: "/beneficiary",
  [ROLES.MERCHANT]: "/merchant",
};

// Helper functions
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

export const requiresApproval = (role) => {
  return ROLES_REQUIRING_APPROVAL.includes(role);
};

export const canSelfRegister = (role) => {
  return SELF_REGISTER_ROLES.includes(role);
};

export const getRoleDashboard = (role) => {
  return ROLE_ROUTES[role] || "/";
};
