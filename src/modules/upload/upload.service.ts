import type { UploadApiResponse } from "cloudinary";
import multer from "multer";
import cloudinary from "../../lib/cloudinary.js";

// Store file in memory buffer, NOT on disk
export const upload = multer({ storage: multer.memoryStorage() });

// Helper: wraps upload_stream in a Promise
export const uploadToCloudinary = (
  buffer: Buffer,
  mimetype: string,
  folder: string = "linkx360/uploads",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer); // pipe the buffer into Cloudinary
  });
};
