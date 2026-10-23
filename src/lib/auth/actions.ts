"use server";

import { z } from "zod/v4";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "./password";
import { createSession, destroySession } from "./session";
import { createAuditLog } from "@/lib/audit/service";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email and password" };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { company: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? undefined;
  const ua = headersList.get("user-agent") ?? undefined;

  await createSession(user.id, ip, ua);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createAuditLog({
    companyId: user.companyId,
    userId: user.id,
    userEmail: user.email,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    ipAddress: ip,
    userAgent: ua,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
