import { Router, type RequestHandler } from "express";

import { requireAdmin } from "./admin.middleware.js";
import {
  getAdminStats,
  listAdminBookings,
  listAdminUsers,
  patchAdminUser,
} from "./admin.controller.js";

const adminRoutes: Router = Router();

adminRoutes.get("/users", ...requireAdmin, listAdminUsers as RequestHandler);
adminRoutes.patch(
  "/users/:id",
  ...requireAdmin,
  patchAdminUser as RequestHandler,
);
adminRoutes.get(
  "/bookings",
  ...requireAdmin,
  listAdminBookings as RequestHandler,
);
adminRoutes.get("/stats", ...requireAdmin, getAdminStats as RequestHandler);

export default adminRoutes;
