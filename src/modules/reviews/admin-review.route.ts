import { Router, type RequestHandler } from "express";

import { requireAdmin } from "../admin/admin.middleware.js";
import { deleteReviewAdmin } from "./review.controller.js";

const adminReviewRoutes: Router = Router();

adminReviewRoutes.delete(
  "/:id",
  ...requireAdmin,
  deleteReviewAdmin as RequestHandler,
);

export default adminReviewRoutes;
