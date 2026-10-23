import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "nbfc_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, token, expiresAt, ipAddress, userAgent },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          role: { include: { permissions: true } },
          company: true,
          branch: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  if (session.user.status !== "ACTIVE") {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export async function cleanExpiredSessions() {
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
