import { Router } from "express";
import { uploadFile } from "./upload.controller.js";
import { upload } from "./upload.service.js";

const router = Router();

router.post("/single", upload.single("file"), uploadFile);

export default router;
