import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route";
import userRoutes from "../modules/user/user.route";

const router: Router = Router();

router.use("/auth", authRouter);
router.use("/users", userRoutes);

export default router;
