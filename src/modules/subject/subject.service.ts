import { prisma } from "../../lib/prisma.js";
import type { UpdateSubjectBody } from "./subject.schemas.js";

/** Distinct tutor user IDs with ≥1 slot for each subjectId. */
async function distinctTutorCountBySubjectFromSlots(): Promise<
  Map<string, number>
> {
  const rows = await prisma.availabilitySlot.findMany({
    where: { subjectId: { not: null } },
    select: { tutorId: true, subjectId: true },
  });
  const sets = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.subjectId) continue;
    let set = sets.get(r.subjectId);
    if (!set) {
      set = new Set();
      sets.set(r.subjectId, set);
    }
    set.add(r.tutorId);
  }
  const out = new Map<string, number>();
  for (const [sid, set] of sets) {
    out.set(sid, set.size);
  }
  return out;
}

/**
 * Distinct slot tutor user IDs for this subject (explicit subjectId filter;
 * same approach as category tutors-from-slots).
 */
async function distinctTutorUserIdsForSubjectSlots(
  subjectId: string,
): Promise<string[]> {
  const slotRows = await prisma.availabilitySlot.findMany({
    where: { subjectId },
    select: { tutorId: true },
    distinct: ["tutorId"],
  });
  return slotRows.map((r) => r.tutorId);
}

export type SubjectApi = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

export type SubjectWithCategoryApi = SubjectApi & {
  category: { id: string; name: string };
  _count: { tutorProfiles: number };
};

export type SubjectDetailApi = SubjectApi & {
  category: { id: string; name: string };
  _count: { tutorProfiles: number };
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

function toApiSubject(row: {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}): SubjectApi {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.categoryId,
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

export const createSubjectService = async (
  name: string,
  categoryId: string,
  description?: string,
): Promise<SubjectApi> => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const trimmedName = name.trim();
  const dup = await prisma.subject.findFirst({
    where: {
      name: { equals: trimmedName, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (dup) {
    throw new Error("Subject with this name already exists");
  }

  const row = await prisma.subject.create({
    data: {
      name: trimmedName,
      categoryId,
      description:
        description !== undefined && description.trim() !== ""
          ? description.trim()
          : null,
    },
  });

  return toApiSubject(row);
};

export const listSubjectsService = async (
  categoryId?: string,
): Promise<SubjectWithCategoryApi[]> => {
  const hasCategoryFilter =
    categoryId !== undefined && categoryId !== "";

  const [rows, tutorCountBySubject] = await Promise.all([
    prisma.subject.findMany({
      ...(hasCategoryFilter ? { where: { categoryId } } : {}),
      orderBy: { name: "asc" },
      include: {
        category: { select: { id: true, name: true } },
      },
    }),
    distinctTutorCountBySubjectFromSlots(),
  ]);

  return rows.map((row) => ({
    ...toApiSubject(row),
    category: row.category,
    _count: { tutorProfiles: tutorCountBySubject.get(row.id) ?? 0 },
  }));
};

export const getSubjectByIdService = async (
  subjectId: string,
): Promise<SubjectDetailApi | null> => {
  const row = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  if (!row) {
    return null;
  }

  const tutorUserIds = await distinctTutorUserIdsForSubjectSlots(subjectId);

  return {
    ...toApiSubject(row),
    category: row.category,
    _count: { tutorProfiles: tutorUserIds.length },
  };
};

export const updateSubjectService = async (
  subjectId: string,
  input: UpdateSubjectBody,
): Promise<SubjectApi> => {
  const existing = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!existing) {
    throw new Error("Subject not found");
  }

  const nextCategoryId =
    input.categoryId !== undefined ? input.categoryId : existing.categoryId;

  if (nextCategoryId !== existing.categoryId) {
    const cat = await prisma.category.findUnique({
      where: { id: nextCategoryId },
      select: { id: true },
    });
    if (!cat) {
      throw new Error("Category not found");
    }
  }

  const nextName =
    input.name !== undefined ? input.name.trim() : existing.name;

  if (nextName !== existing.name || nextCategoryId !== existing.categoryId) {
    const dup = await prisma.subject.findFirst({
      where: {
        name: { equals: nextName, mode: "insensitive" },
        NOT: { id: subjectId },
      },
      select: { id: true },
    });
    if (dup) {
      throw new Error("Subject with this name already exists");
    }
  }

  let nextDescription: string | null = existing.description;
  if (input.description !== undefined) {
    nextDescription =
      input.description.trim() === "" ? null : input.description.trim();
  }

  const row = await prisma.subject.update({
    where: { id: subjectId },
    data: {
      name: nextName,
      categoryId: nextCategoryId,
      description: nextDescription,
    },
  });

  return toApiSubject(row);
};

export const deleteSubjectService = async (
  subjectId: string,
): Promise<void> => {
  const result = await prisma.subject.deleteMany({
    where: { id: subjectId },
  });

  if (result.count === 0) {
    throw new Error("Subject not found");
  }
};

export const getTutorsBySubjectService = async (
  subjectId: string,
): Promise<TutorProfileWithUserSnippetApi[]> => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!subject) {
    throw new Error("Subject not found");
  }

  const tutorUserIds = await distinctTutorUserIdsForSubjectSlots(subjectId);
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
