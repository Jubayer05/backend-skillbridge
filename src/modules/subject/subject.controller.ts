import type { Request, Response } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import {
  createSubjectBodySchema,
  listSubjectsQuerySchema,
  subjectIdParamSchema,
  updateSubjectBodySchema,
} from "./subject.schemas.js";
import {
  createSubjectService,
  deleteSubjectService,
  getSubjectByIdService,
  getTutorsBySubjectService,
  listSubjectsService,
  updateSubjectService,
} from "./subject.service.js";

function normalizeQuery(
  query: Request["query"],
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    const first = Array.isArray(value) ? value[0] : value;
    out[key] = typeof first === "string" ? first : undefined;
  }
  return out;
}

function handleSubjectError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  const message =
    error instanceof Error ? error.message : fallbackMessage;

  let statusCode = 500;
  if (message === "Category not found") {
    statusCode = 404;
  } else if (message === "Subject not found") {
    statusCode = 404;
  } else if (message === "Subject with this name already exists") {
    statusCode = 409;
  }

  const errorLabel =
    statusCode === 404
      ? "Not Found"
      : statusCode === 409
        ? "Conflict"
        : fallbackMessage;

  res.status(statusCode).json({
    error: errorLabel,
    message,
  });
}

export const createSubject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = createSubjectBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const { name, categoryId, description } = parsed.data;
    const result = await createSubjectService(name, categoryId, description);

    res.status(201).json({
      message: "Subject created successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Create subject error:", error);
    handleSubjectError(res, error, "Failed to create subject");
  }
};

export const listSubjects = async (req: Request, res: Response) => {
  try {
    const parsed = listSubjectsQuerySchema.safeParse(
      normalizeQuery(req.query),
    );
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const { categoryId } = parsed.data;
    const data = await listSubjectsService(categoryId);

    res.status(200).json({
      message: "Subjects fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("List subjects error:", error);
    handleSubjectError(res, error, "Failed to list subjects");
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const parsed = subjectIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await getSubjectByIdService(parsed.data.subjectId);

    if (!result) {
      res.status(404).json({
        error: "Not Found",
        message: "Subject not found",
      });
      return;
    }

    res.status(200).json({
      message: "Subject fetched successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Get subject error:", error);
    handleSubjectError(res, error, "Failed to fetch subject");
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const paramsParsed = subjectIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      sendZodError(res, paramsParsed.error);
      return;
    }

    const bodyParsed = updateSubjectBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendZodError(res, bodyParsed.error);
      return;
    }

    const result = await updateSubjectService(
      paramsParsed.data.subjectId,
      bodyParsed.data,
    );

    res.status(200).json({
      message: "Subject updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Update subject error:", error);
    handleSubjectError(res, error, "Failed to update subject");
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = subjectIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    await deleteSubjectService(parsed.data.subjectId);

    res.status(200).json({
      message: "Subject deleted successfully",
      data: null,
    });
  } catch (error: unknown) {
    console.error("Delete subject error:", error);
    handleSubjectError(res, error, "Failed to delete subject");
  }
};

export const getTutorsBySubject = async (req: Request, res: Response) => {
  try {
    const parsed = subjectIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await getTutorsBySubjectService(parsed.data.subjectId);

    res.status(200).json({
      message: "Tutors fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("Get tutors by subject error:", error);
    handleSubjectError(res, error, "Failed to fetch tutors for subject");
  }
};
