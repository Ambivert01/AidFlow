import { ROLES } from "../utils/constants";

export const NAVIGATION = {
  PUBLIC: [
    { label: "Public Audit", path: "/public" },
    { label: "Login", path: "/login" },
  ],

  [ROLES.DONOR]: [
    { label: "Dashboard", path: "/donor" },
  ],

  [ROLES.NGO]: [
    { label: "Dashboard", path: "/ngo" },
    { label: "Reviews", path: "/ngo/reviews" },
  ],

  [ROLES.BENEFICIARY]: [
    { label: "Dashboard", path: "/beneficiary" },
  ],

  [ROLES.MERCHANT]: [
    { label: "Dashboard", path: "/merchant" },
  ],

  [ROLES.GOVERNMENT]: [
    { label: "Dashboard", path: "/government" },
  ],
};
