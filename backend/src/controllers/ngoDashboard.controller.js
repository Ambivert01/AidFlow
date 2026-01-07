import { buildNgoDashboard } from "../services/ngoDashboard.service.js";

export const getNgoDashboard = async (req, res) => {
  try {
    const dashboard = await buildNgoDashboard(req.user.id);
    res.json(dashboard);
  } catch (err) {
    console.error("NGO DASHBOARD ERROR:", err);
    res.status(500).json({
      message: "Failed to load NGO dashboard"
    });
  }
};
