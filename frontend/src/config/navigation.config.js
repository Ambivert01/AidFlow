import { ROLES } from "../utils/constants";

export const NAVIGATION = {
  PUBLIC: [
    { label: "Home", path: "/" },
    { label: "How It Works", path: "/public/how-it-works" },
    { label: "Campaigns", path: "/public/campaigns" },
    { label: "Public Audit", path: "/public/audit" },
    { label: "Login", path: "/login" },
  ],

  [ROLES.DONOR]: [
    { label: "Dashboard", path: "/donor" },
    { label: "Verify Audit", path: "/public/audit" },
  ],

  [ROLES.NGO]: [
    { label: "Dashboard", path: "/ngo" },
    { label: "Reviews", path: "/ngo/reviews" },
  ],

  [ROLES.BENEFICIARY]: [{ label: "Dashboard", path: "/beneficiary" }],

  [ROLES.MERCHANT]: [
    { label: "Dashboard", path: "/merchant" },
    { label: "Scan Wallet", path: "/merchant/scan" },
    { label: "Transactions", path: "/merchant/transactions" },
  ],

  [ROLES.GOVERNMENT]: [{ label: "Dashboard", path: "/government" }],
};
