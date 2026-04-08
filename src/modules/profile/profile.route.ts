import { type Router, Router as ExpressRouter } from "express";
import type { RequestHandler } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { getProfile, updateProfile } from "./profile.controller.js";

const profileRoutes: Router = ExpressRouter();

// GET /profile
profileRoutes.get("/", authenticate as RequestHandler, getProfile as RequestHandler);

// PUT /profile
profileRoutes.put("/", authenticate as RequestHandler, updateProfile as RequestHandler);

export default profileRoutes;
