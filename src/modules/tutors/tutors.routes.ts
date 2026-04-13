import { Router, type RequestHandler } from "express";

import {
  getTutorPublicDetail,
  listTutorReviews,
  listTutors,
} from "./tutors.controller.js";

const tutorsRoutes: Router = Router();

tutorsRoutes.get("/", listTutors as RequestHandler);
tutorsRoutes.get("/:userId/reviews", listTutorReviews as RequestHandler);
tutorsRoutes.get("/:userId", getTutorPublicDetail as RequestHandler);

export default tutorsRoutes;
