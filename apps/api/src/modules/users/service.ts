import { db } from "@db";
import { users } from "@schema/index";
import { and, eq } from "drizzle-orm";
import { ConflictError } from "@plugin";
import {
  type ArgsRegisterCashier,
  type ArgsUpdateCashier,
  type ArgsUpdateProfile,
} from "./schema";
import { RegisterError, SessionError } from "@plugin";
import { UserNotFoundError } from "./error";

export const registerCashier = async (
  tenantId: string,
  data: ArgsRegisterCashier,
) => {
  // Cek email (lintas tenant)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) throw new ConflictError("Email already registered!");

  // Hash password kasir
  const hashedPassword = await Bun.password.hash(data.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // Insert ke database
  const [newCashier] = await db
    .insert(users)
    .values({
      tenantId: tenantId,
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: "cashier",
      isActive: true,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
    });

  if (!newCashier) throw new RegisterError("Failed to register new cashier!");

  return newCashier;
};

export const getCashier = async (tenantId: string) => {
  const result = await db.query.users.findMany({
    where: and(
      eq(users.tenantId, tenantId),
      eq(users.role, "cashier"),
      eq(users.isActive, true),
    ),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
    },
  });

  return result;
};

export const getUser = async (userId: string) => {
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.isActive, true)),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      refreshToken: true,
    },
  });

  if (!user) throw new SessionError("User not found!");

  return user;
};

export const updateCashier = async (
  id: string,
  tenantId: string,
  data: ArgsUpdateCashier,
) => {
  let hashedPassword;

  // Jika admin mengubah passwordnya
  if (data.password) {
    hashedPassword = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      name: data.name,
      email: data.email,
      ...(hashedPassword && { passwordHash: hashedPassword }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, id),
        eq(users.tenantId, tenantId),
        eq(users.role, "cashier"),
      ),
    )
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
    });

  if (!updatedUser) throw new UserNotFoundError("Cashier not found!");

  return updatedUser;
};

export const deleteCashier = async (id: string, tenantId: string) => {
  // Soft dalete cashier
  const [deletedCashier] = await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, id),
        eq(users.tenantId, tenantId),
        eq(users.role, "cashier"),
      ),
    )
    .returning({
      id: users.id,
    });

  if (!deletedCashier) throw new UserNotFoundError("Cashier not found!");

  return deletedCashier;
};

export const updateOwnProfile = async (
  id: string,
  tenantId: string,
  data: ArgsUpdateProfile,
) => {
  let hashedPassword;

  // Cek perubahan password
  if (data.password) {
    hashedPassword = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });
  }

  const [updatedProfile] = await db
    .update(users)
    .set({
      name: data.name,
      ...(hashedPassword && { passwordHash: hashedPassword }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, id),
        eq(users.tenantId, tenantId),
        eq(users.role, "cashier"),
      ),
    )
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
    });

  if (!updatedProfile) throw new UserNotFoundError("Cashier not found!");

  return updatedProfile;
};
