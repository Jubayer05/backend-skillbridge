import { Router } from "express";
import availabilityRoutes from "../modules/availability_slots/availability.route.js";
import { authRouter } from "../modules/auth/auth.route.js";
import categoryRoutes from "../modules/category/category.routes.js";
import subjectRoutes from "../modules/subject/subject.routes.js";
import profileRoutes from "../modules/profile/profile.route.js";
import tutorRoutes from "../modules/tutor/tutor.route.js";
import uploadRouter from "../modules/upload/upload.route.js";
import userRoutes from "../modules/user/user.route.js";

const router: Router = Router();

router.use("/auth", authRouter);
router.use("/categories", categoryRoutes);
router.use("/subjects", subjectRoutes);
router.use("/availability", availabilityRoutes);
router.use("/profile", profileRoutes);
router.use("/tutor", tutorRoutes);
router.use("/users", userRoutes);
router.use("/upload", uploadRouter);

export default router;
