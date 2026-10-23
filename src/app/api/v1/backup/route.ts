import { NextResponse } from "next/server";
import { createBackup, getBackupMetadata } from "@/lib/backup/service";

/**
 * POST /api/v1/backup — Create a backup.
 * Requires Bearer token authentication.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const metadata = await getBackupMetadata();
    const result = await createBackup("./backups");

    return NextResponse.json({
      success: result.success,
      backup: result.success ? {
        filePath: result.filePath,
        fileSize: result.fileSize,
        checksum: result.checksum,
        duration: `${result.duration}ms`,
        metadata,
      } : undefined,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json(
      { error: "Backup failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/backup — Get backup metadata (record counts, version).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metadata = await getBackupMetadata();
  return NextResponse.json({ success: true, metadata });
}
