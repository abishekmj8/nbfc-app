/**
 * Session and password security configuration.
 * Per RBI Cybersecurity Directions 2026.
 */

export const SESSION_CONFIG = {
  /** Session duration in milliseconds (24 hours) */
  durationMs: 24 * 60 * 60 * 1000,

  /** Idle timeout in milliseconds (30 minutes) */
  idleTimeoutMs: 30 * 60 * 1000,

  /** Max concurrent sessions per user */
  maxConcurrentSessions: 3,

  /** Cookie name */
  cookieName: "nbfc_session",
} as const;

export const PASSWORD_POLICY = {
  /** Minimum password length */
  minLength: 8,

  /** Maximum password length */
  maxLength: 128,

  /** Require at least one uppercase letter */
  requireUppercase: true,

  /** Require at least one lowercase letter */
  requireLowercase: true,

  /** Require at least one digit */
  requireDigit: true,

  /** Require at least one special character */
  requireSpecial: false,

  /** Password history — prevent reuse of last N passwords */
  historyCount: 3,

  /** Max password age in days (0 = no expiry) */
  maxAgeDays: 90,
} as const;

/**
 * Validate a password against the policy.
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must be at most ${PASSWORD_POLICY.maxLength} characters`);
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (PASSWORD_POLICY.requireDigit && !/\d/.test(password)) {
    errors.push("Password must contain at least one digit");
  }
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
}
