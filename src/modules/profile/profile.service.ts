import { prisma } from "../../lib/prisma.js";

const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  bio: true,
  image: true,
  role: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  tutorProfile: {
    select: {
      id: true,
      userId: true,
      headline: true,
      bio: true,
      hourlyRate: true,
      experience: true,
      education: true,
      languages: true,
      rating: true,
      totalReviews: true,
      profileImageUrl: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

export interface UpdateProfileInput {
  name?: string;
  phoneNumber?: string | null;
  bio?: string | null;
  image?: string | null;
}

export const getProfileService = (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: userProfileSelect,
  });

export const updateProfileService = (
  userId: string,
  data: UpdateProfileInput,
) =>
  prisma.user.update({
    where: { id: userId },
    data,
    select: userProfileSelect,
  });
