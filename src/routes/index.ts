import { Router } from "express";
import userRoutes from "../modules/user/user.route";

const router: Router = Router();

// Routes
router.use("/users", userRoutes);

export default router;