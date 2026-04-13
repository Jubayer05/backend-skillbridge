import { Router, type RequestHandler } from "express";

import { authenticate, authorize } from "../auth/auth.middleware.js";
import { deleteReviewAdmin } from "./review.controller.js";

const adminReviewRoutes: Router = Router();

adminReviewRoutes.delete(
  "/:id",
  authenticate as RequestHandler,
  authorize("ADMIN") as RequestHandler,
  deleteReviewAdmin as RequestHandler,
);

export default adminReviewRoutes;
