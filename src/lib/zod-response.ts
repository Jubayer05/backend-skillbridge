import type { Response } from "express";
import type { ZodError } from "zod";

export function formatZodError(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export function sendZodError(res: Response, err: ZodError): void {
  res.status(400).json({
    error: "Validation Error",
    message: formatZodError(err),
    issues: err.issues,
  });
}
