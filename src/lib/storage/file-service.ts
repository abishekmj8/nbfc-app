import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_BASE = process.env.FILE_STORAGE_PATH ?? "./uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "text/csv",
];

export interface UploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Save an uploaded file to local storage.
 * Path: {base}/{companyId}/{entityType}/{entityId}/{uniqueName}
 */
export async function saveFile(params: {
  file: File;
  companyId: string;
  entityType: string;
  entityId: string;
}): Promise<UploadResult> {
  const { file, companyId, entityType, entityId } = params;

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: `File type not allowed: ${file.type}. Allowed: PDF, JPG, PNG, WebP, XLSX, CSV` };
  }

  // Generate unique filename
  const ext = path.extname(file.name) || guessExtension(file.type);
  const uniqueName = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;

  // Create directory structure
  const dir = path.join(UPLOAD_BASE, companyId, entityType, entityId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, uniqueName);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);

    return {
      success: true,
      filePath: path.relative(UPLOAD_BASE, filePath), // Store relative path
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (e) {
    return { success: false, error: `Failed to save file: ${e instanceof Error ? e.message : "Unknown"}` };
  }
}

/**
 * Read a file from storage.
 */
export function readFile(relativePath: string): Buffer | null {
  const fullPath = path.join(UPLOAD_BASE, relativePath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath);
}

/**
 * Delete a file from storage.
 */
export function deleteFile(relativePath: string): boolean {
  const fullPath = path.join(UPLOAD_BASE, relativePath);
  if (!existsSync(fullPath)) return false;
  unlinkSync(fullPath);
  return true;
}

function guessExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "text/csv": ".csv",
  };
  return map[mimeType] ?? "";
}
