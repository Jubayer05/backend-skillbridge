import type { RequestHandler } from "express";

import { authenticate, authorize } from "../auth/auth.middleware.js";

/** Admin-only chain: session required, role must be ADMIN. */
export const requireAdmin: RequestHandler[] = [
  authenticate as RequestHandler,
  authorize("ADMIN") as RequestHandler,
];
