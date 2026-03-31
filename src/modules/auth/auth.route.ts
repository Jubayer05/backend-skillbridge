import { type Router, Router as ExpressRouter } from "express";
import {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  updatePassword,
  verifyEmail,
} from "./auth.controller";
import { authenticate } from "./auth.middleware";

const router: Router = ExpressRouter();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.post("/update-password", authenticate, updatePassword);
router.post("/logout", authenticate, logout);

export { router as authRouter };
