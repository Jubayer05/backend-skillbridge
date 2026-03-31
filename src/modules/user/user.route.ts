import { type Router, Router as ExpressRouter } from "express";
import { userController } from "./user.controller.js";
import type { RequestHandler } from "express";

const userRoutes: Router = ExpressRouter();

userRoutes.post("/signup", userController.createUser as RequestHandler);
userRoutes.get("/get-users", userController.getUsers as RequestHandler);
userRoutes.get("/get-user/:id", userController.getUser as RequestHandler);
userRoutes.put("/update-user/:id", userController.updateUser as RequestHandler);
userRoutes.delete("/delete-user/:id", userController.deleteUser as RequestHandler);

export default userRoutes;