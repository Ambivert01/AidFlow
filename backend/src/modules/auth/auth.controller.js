import * as authService from "./auth.service.js";

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};