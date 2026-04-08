import type { Request, Response } from "express";

import { sendZodError } from "../../lib/zod-response.js";
import {
  categoryIdParamSchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from "./category.schemas.js";
import {
  createCategoryService,
  deleteCategoryService,
  getCategoryByIdService,
  getTutorsByCategoryService,
  listCategoriesService,
  updateCategoryService,
} from "./category.service.js";

function handleCategoryError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  const message =
    error instanceof Error ? error.message : fallbackMessage;

  let statusCode = 500;
  if (message === "Category not found") {
    statusCode = 404;
  } else if (
    message === "Category with this name already exists"
  ) {
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

export const createCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = createCategoryBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const { name, description } = parsed.data;
    const result = await createCategoryService(
      name,
      description,
    );

    res.status(201).json({
      message: "Category created successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Create category error:", error);
    handleCategoryError(res, error, "Failed to create category");
  }
};

export const listCategories = async (_req: Request, res: Response) => {
  try {
    const data = await listCategoriesService();

    res.status(200).json({
      message: "Categories fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("List categories error:", error);
    handleCategoryError(res, error, "Failed to list categories");
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const parsed = categoryIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const result = await getCategoryByIdService(parsed.data.categoryId);

    if (!result) {
      res.status(404).json({
        error: "Not Found",
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      message: "Category fetched successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Get category error:", error);
    handleCategoryError(res, error, "Failed to fetch category");
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const paramsParsed = categoryIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      sendZodError(res, paramsParsed.error);
      return;
    }

    const bodyParsed = updateCategoryBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendZodError(res, bodyParsed.error);
      return;
    }

    const result = await updateCategoryService(
      paramsParsed.data.categoryId,
      bodyParsed.data,
    );

    res.status(200).json({
      message: "Category updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error("Update category error:", error);
    handleCategoryError(res, error, "Failed to update category");
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized", message: "Login required" });
      return;
    }

    const parsed = categoryIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    await deleteCategoryService(parsed.data.categoryId);

    res.status(200).json({
      message: "Category deleted successfully",
      data: null,
    });
  } catch (error: unknown) {
    console.error("Delete category error:", error);
    handleCategoryError(res, error, "Failed to delete category");
  }
};

export const getTutorsByCategory = async (req: Request, res: Response) => {
  try {
    const parsed = categoryIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendZodError(res, parsed.error);
      return;
    }

    const data = await getTutorsByCategoryService(parsed.data.categoryId);

    res.status(200).json({
      message: "Tutors fetched successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("Get tutors by category error:", error);
    handleCategoryError(res, error, "Failed to fetch tutors for category");
  }
};
