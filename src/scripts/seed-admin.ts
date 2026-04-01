/**
 * Seeds or updates the platform admin user from environment variables.
 *
 * Reads (in order of precedence for email):
 *   - ADMIN_EMAIL   (recommended)
 *   - ADMIN_EAMAIL  (typo alias — matches common .env mistake)
 *
 *   - ADMIN_PASSWORD (required)
 *
 * Optional:
 *   - ADMIN_NAME (defaults to "Admin")
 *
 * Idempotent: if the email already exists, promotes to ADMIN, verifies email,
 * and refreshes the credential password hash.
 */
import "dotenv/config";
import { hashPassword, generateRandomString } from "better-auth/crypto";
import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/index.js";

function getAdminEmail(): string {
  const raw =
    process.env.ADMIN_EMAIL?.trim() ??
    process.env.ADMIN_EAMAIL?.trim() ??
    "";
  return raw.toLowerCase();
}

async function main(): Promise<void> {
  const email = getAdminEmail();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email) {
    console.error(
      "Missing ADMIN_EMAIL (or ADMIN_EAMAIL). Set one of them in .env",
    );
    process.exitCode = 1;
    return;
  }
  if (!password) {
    console.error("Missing ADMIN_PASSWORD in .env");
    process.exitCode = 1;
    return;
  }

  const hashed = await hashPassword(password);

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: { where: { providerId: "credential" } } },
  });

  if (existing) {
    const cred = existing.accounts[0];
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.id },
        data: {
          role: Role.ADMIN,
          emailVerified: true,
          name: existing.name || name,
        },
      });
      if (cred) {
        await tx.account.update({
          where: { id: cred.id },
          data: { password: hashed },
        });
      } else {
        await tx.account.create({
          data: {
            id: generateRandomString(32),
            accountId: existing.id,
            providerId: "credential",
            userId: existing.id,
            password: hashed,
          },
        });
      }
    });
    console.log(`Admin seed: updated existing user ${email} (role ADMIN, password refreshed).`);
    return;
  }

  const userId = generateRandomString(32);
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        email,
        name,
        role: Role.ADMIN,
        emailVerified: true,
      },
    });
    await tx.account.create({
      data: {
        id: generateRandomString(32),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashed,
      },
    });
  });

  console.log(`Admin seed: created ${email} with role ADMIN.`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
