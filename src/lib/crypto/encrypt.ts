import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, KEY_LENGTH);
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("NEXTAUTH_SECRET must be set and at least 16 characters for encryption");
  }
  return secret;
}

/**
 * Encrypt a string value using AES-256-GCM.
 * Returns: base64 string of salt:iv:tag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const secret = getSecret();
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt a value encrypted with encrypt().
 */
export function decrypt(encryptedBase64: string): string {
  const secret = getSecret();
  const combined = Buffer.from(encryptedBase64, "base64");

  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Mask a PAN number: ABCDE1234F → XXXXX1234F
 */
export function maskPan(pan: string): string {
  if (pan.length !== 10) return "XXXXXXXXXX";
  return "XXXXX" + pan.slice(5);
}

/**
 * Mask an Aadhaar number: 123456789012 → xxxx-xxxx-9012
 */
export function maskAadhaar(lastFour: string): string {
  return `xxxx-xxxx-${lastFour}`;
}

/**
 * Mask a bank account number: 12345678901234 → XXXXXXXXXX1234
 */
export function maskBankAccount(account: string): string {
  if (account.length <= 4) return account;
  return "X".repeat(account.length - 4) + account.slice(-4);
}

/**
 * Mask a phone number: 9876543210 → XXXXXX3210
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return phone;
  return "X".repeat(digits.length - 4) + digits.slice(-4);
}
