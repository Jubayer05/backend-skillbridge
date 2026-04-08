import type { Request, Response } from "express";
import { uploadToCloudinary } from "./upload.service.js";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
    );

    return res.status(200).json({
      message: "Upload successful",
      url: result.secure_url, // always use secure_url (HTTPS)
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    return res.status(500).json({ message: "Upload failed", error });
  }
};
