import api from "./api";

// Every authenticated role can call this - it's not NGO-specific despite
// previously only ever being wired into the NGO dashboard.
export const getMyNotifications = () => api.get("/notifications");

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);
