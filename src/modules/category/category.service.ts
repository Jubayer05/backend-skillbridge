import { prisma } from "../../lib/prisma.js";
import type { UpdateCategoryBody } from "./category.schemas.js";

/**
 * Distinct user IDs (tutorId on slots) for slots whose subject belongs to
 * `categoryId`. Uses subjectId IN (…) instead of nested relation filters on
 * groupBy, which is more reliable across Prisma versions.
 */
async function distinctTutorUserIdsForCategorySlots(
  categoryId: string,
): Promise<string[]> {
  const subjectRows = await prisma.subject.findMany({
    where: { categoryId },
    select: { id: true },
  });
  const subjectIds = subjectRows.map((s) => s.id);
  if (subjectIds.length === 0) {
    return [];
  }

  const slotRows = await prisma.availabilitySlot.findMany({
    where: { subjectId: { in: subjectIds } },
    select: { tutorId: true },
    distinct: ["tutorId"],
  });
  return slotRows.map((r) => r.tutorId);
}

/** Per category: count of distinct slot tutors (matches category detail list). */
async function distinctTutorCountByCategoryFromSlots(): Promise<
  Map<string, number>
> {
  const subjects = await prisma.subject.findMany({
    select: { id: true, categoryId: true },
  });
  if (subjects.length === 0) {
    return new Map();
  }
  const subjectToCategory = new Map(
    subjects.map((s) => [s.id, s.categoryId]),
  );

  const slots = await prisma.availabilitySlot.findMany({
    where: { subjectId: { not: null } },
    select: { tutorId: true, subjectId: true },
  });

  const sets = new Map<string, Set<string>>();
  for (const slot of slots) {
    if (!slot.subjectId) continue;
    const cid = subjectToCategory.get(slot.subjectId);
    if (!cid) continue;
    let set = sets.get(cid);
    if (!set) {
      set = new Set();
      sets.set(cid, set);
    }
    set.add(slot.tutorId);
  }

  const out = new Map<string, number>();
  for (const [cid, set] of sets) {
    out.set(cid, set.size);
  }
  return out;
}

export type CategoryApi = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListItemApi = CategoryApi & {
  _count: {
    tutorProfiles: number;
    subjects: number;
  };
  subjects: {
    id: string;
    name: string;
    availableSlotsCount: number;
    availableTutorsCount: number;
  }[];
};

export type CategoryDetailApi = CategoryApi & {
  subjects: { id: string; name: string }[];
  _count: {
    tutorProfiles: number;
  };
};

export type TutorProfileWithUserSnippetApi = {
  id: string;
  userId: string;
  headline: string;
  bio: string;
  hourlyRate: string;
  experience: number;
  education: string;
  languages: string[];
  rating: string | null;
  totalReviews: number;
  profileImageUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

function toApiCategory(row: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CategoryApi {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toApiTutorProfileWithUser(row: {
  id: string;
  userId: string;
  headline: string;
  bio: string;
  hourlyRate: { toString(): string };
  experience: number;
  education: string;
  languages: string[];
  rating: { toString(): string } | null;
  totalReviews: number;
  profileImageUrl: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}): TutorProfileWithUserSnippetApi {
  return {
    id: row.id,
    userId: row.userId,
    headline: row.headline,
    bio: row.bio,
    hourlyRate: row.hourlyRate.toString(),
    experience: row.experience,
    education: row.education,
    languages: row.languages,
    rating: row.rating === null ? null : row.rating.toString(),
    totalReviews: row.totalReviews,
    profileImageUrl: row.profileImageUrl,
    isVerified: row.isVerified,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: {
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      image: row.user.image,
    },
  };
}

function syntheticTutorSnippetFromUser(user: {
  id: string;
  name: string;
  email: string;
  image: string | null;
}): TutorProfileWithUserSnippetApi {
  const iso = new Date().toISOString();
  return {
    id: `synthetic-profile-${user.id}`,
    userId: user.id,
    headline: "Tutor",
    bio: "",
    hourlyRate: "0.00",
    experience: 0,
    education: "",
    languages: [],
    rating: null,
    totalReviews: 0,
    profileImageUrl: null,
    isVerified: false,
    createdAt: iso,
    updatedAt: iso,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
  };
}

export const createCategoryService = async (
  name: string,
  description?: string,
): Promise<CategoryApi> => {
  const trimmedName = name.trim();
  const existing = await prisma.category.findFirst({
    where: {
      name: { equals: trimmedName, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Category with this name already exists");
  }

  const row = await prisma.category.create({
    data: {
      name: trimmedName,
      description:
        description !== undefined && description.trim() !== ""
          ? description.trim()
          : null,
    },
  });

  return toApiCategory(row);
};

export const listCategoriesService = async (): Promise<CategoryListItemApi[]> => {
  const [rows, tutorCountByCategory, availableSlotsBySubject, availableTutorsBySubject] =
    await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        subjects: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
        _count: {
          select: { subjects: true },
        },
      },
    }),
    distinctTutorCountByCategoryFromSlots(),
    prisma.availabilitySlot
      .groupBy({
        by: ["subjectId"],
        where: { subjectId: { not: null }, status: "AVAILABLE" },
        _count: { _all: true },
      })
      .then((rows) => {
        const map = new Map<string, number>();
        for (const r of rows) {
          if (!r.subjectId) continue;
          map.set(r.subjectId, r._count._all);
        }
        return map;
      }),
    prisma.availabilitySlot
      .groupBy({
        by: ["subjectId", "tutorId"],
        where: { subjectId: { not: null }, status: "AVAILABLE" },
      })
      .then((rows) => {
        const map = new Map<string, number>();
        for (const r of rows) {
          if (!r.subjectId) continue;
          map.set(r.subjectId, (map.get(r.subjectId) ?? 0) + 1);
        }
        return map;
      }),
  ]);

  return rows.map((row) => ({
    ...toApiCategory(row),
    _count: {
      tutorProfiles: tutorCountByCategory.get(row.id) ?? 0,
      subjects: row._count.subjects,
    },
    subjects: row.subjects.map((s) => ({
      id: s.id,
      name: s.name,
      availableSlotsCount: availableSlotsBySubject.get(s.id) ?? 0,
      availableTutorsCount: availableTutorsBySubject.get(s.id) ?? 0,
    })),
  }));
};

export const getCategoryByIdService = async (
  categoryId: string,
): Promise<CategoryDetailApi | null> => {
  const row = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      subjects: {
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!row) {
    return null;
  }

  const tutorUserIds = await distinctTutorUserIdsForCategorySlots(
    categoryId,
  );

  return {
    ...toApiCategory(row),
    subjects: row.subjects,
    _count: { tutorProfiles: tutorUserIds.length },
  };
};

export const updateCategoryService = async (
  categoryId: string,
  input: UpdateCategoryBody,
): Promise<CategoryApi> => {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    throw new Error("Category not found");
  }

  const nextName =
    input.name !== undefined ? input.name.trim() : existing.name;

  if (nextName !== existing.name) {
    const dup = await prisma.category.findFirst({
      where: {
        name: { equals: nextName, mode: "insensitive" },
        NOT: { id: categoryId },
      },
      select: { id: true },
    });
    if (dup) {
      throw new Error("Category with this name already exists");
    }
  }

  let nextDescription: string | null = existing.description;
  if (input.description !== undefined) {
    nextDescription =
      input.description.trim() === "" ? null : input.description.trim();
  }

  const row = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: nextName,
      description: nextDescription,
    },
  });

  return toApiCategory(row);
};

export const deleteCategoryService = async (
  categoryId: string,
): Promise<void> => {
  const result = await prisma.category.deleteMany({
    where: { id: categoryId },
  });

  if (result.count === 0) {
    throw new Error("Category not found");
  }
};

export const getTutorsByCategoryService = async (
  categoryId: string,
): Promise<TutorProfileWithUserSnippetApi[]> => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const tutorUserIds = await distinctTutorUserIdsForCategorySlots(categoryId);
  if (tutorUserIds.length === 0) {
    return [];
  }

  const profiles = await prisma.tutorProfile.findMany({
    where: { userId: { in: tutorUserIds } },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  const profileByUserId = new Map(
    profiles.map((p) => [p.userId, p] as const),
  );
  const missingUserIds = tutorUserIds.filter((id) => !profileByUserId.has(id));

  const synthetics: TutorProfileWithUserSnippetApi[] =
    missingUserIds.length === 0
      ? []
      : (
          await prisma.user.findMany({
            where: { id: { in: missingUserIds } },
            select: { id: true, name: true, email: true, image: true },
          })
        ).map(syntheticTutorSnippetFromUser);

  const fromProfiles = profiles.map(toApiTutorProfileWithUser);
  const combined = [...fromProfiles, ...synthetics];
  combined.sort((a, b) => a.user.name.localeCompare(b.user.name));
  return combined;
};
