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
import { UserRole } from "@shared";

export const registerCashier = async (
  tenantId: string,
  data: ArgsRegisterCashier,
) => {
  // Cek email (lintas tenant)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existingUser) throw new ConflictError("Email sudah terdaftar!");

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

  if (!newCashier) throw new RegisterError("Gagal mendaftarkan kasir baru!");

  return {
    id: newCashier.id,
    name: newCashier.name || "",
    email: newCashier.email || "",
    role: (newCashier.role as UserRole) || UserRole.CASHIER,
    tenantId: newCashier.tenantId || "",
  };
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

  return result.map((u) => ({
    id: u.id,
    name: u.name || "",
    email: u.email || "",
    role: (u.role as UserRole) || UserRole.CASHIER,
    tenantId: u.tenantId || "",
  }));
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

  if (!user) throw new SessionError("Pengguna tidak ditemukan!");

  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    role: (user.role as UserRole) || UserRole.ADMIN,
    tenantId: user.tenantId || "",
    refreshToken: user.refreshToken,
  };
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

  if (!updatedUser) throw new UserNotFoundError("Kasir tidak ditemukan!");

  return {
    id: updatedUser.id,
    name: updatedUser.name || "",
    email: updatedUser.email || "",
    role: (updatedUser.role as UserRole) || UserRole.CASHIER,
    tenantId: updatedUser.tenantId || "",
  };
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

  if (!deletedCashier) throw new UserNotFoundError("Kasir tidak ditemukan!");

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

  if (!updatedProfile) throw new UserNotFoundError("Kasir tidak ditemukan!");

  return {
    id: updatedProfile.id,
    name: updatedProfile.name || "",
    email: updatedProfile.email || "",
    role: (updatedProfile.role as UserRole) || UserRole.CASHIER,
    tenantId: updatedProfile.tenantId || "",
  };
};
