import { getSession } from "./session";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/codes";

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];

/**
 * Get the current authenticated user or throw.
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) {
    throw new AppError(
      ErrorCodes.AUTH_SESSION_EXPIRED,
      "Please sign in to continue",
      401
    );
  }
  return session.user;
}

/**
 * Check if user has a specific permission.
 */
export function hasPermission(
  user: AuthUser,
  module: string,
  action: string
): boolean {
  return user.role.permissions.some(
    (p) => p.module === module && p.action === action
  );
}

/**
 * Require a specific permission or throw.
 */
export async function requirePermission(
  module: string,
  action: string
): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasPermission(user, module, action)) {
    throw new AppError(
      ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
      `You don't have permission to ${action.toLowerCase()} in ${module}`,
      403
    );
  }
  return user;
}
