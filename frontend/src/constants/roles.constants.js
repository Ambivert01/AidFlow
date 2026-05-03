/**
 * Frontend Role Constants
 * Must match backend roles exactly
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

// Role display names
export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrator",
  [ROLES.GOVERNMENT]: "Government Authority",
  [ROLES.NGO]: "NGO",
  [ROLES.DONOR]: "Donor",
  [ROLES.BENEFICIARY]: "Beneficiary",
  [ROLES.MERCHANT]: "Merchant",
};

// Role-based dashboard routes
export const ROLE_ROUTES = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.GOVERNMENT]: "/government",
  [ROLES.NGO]: "/ngo",
  [ROLES.DONOR]: "/donor",
  [ROLES.BENEFICIARY]: "/beneficiary",
  [ROLES.MERCHANT]: "/merchant",
};

// Role icons/emojis
export const ROLE_ICONS = {
  [ROLES.ADMIN]: "👑",
  [ROLES.GOVERNMENT]: "🏛️",
  [ROLES.NGO]: "🤝",
  [ROLES.DONOR]: "💝",
  [ROLES.BENEFICIARY]: "🙏",
  [ROLES.MERCHANT]: "🏪",
};

// Helper functions
export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role;
};

export const getRoleRoute = (role) => {
  return ROLE_ROUTES[role] || "/";
};

export const getRoleIcon = (role) => {
  return ROLE_ICONS[role] || "👤";
};

export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

// Password validation
export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
  message:
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
};

export const validatePassword = (password) => {
  if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    };
  }
  if (!PASSWORD_REQUIREMENTS.pattern.test(password)) {
    return { valid: false, message: PASSWORD_REQUIREMENTS.message };
  }
  return { valid: true, message: "" };
};
