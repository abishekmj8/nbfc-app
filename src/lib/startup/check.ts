import { prisma } from "@/lib/db/prisma";

const APP_VERSION = "0.1.0";

/**
 * Run startup checks before the app accepts requests.
 * Per ADR-014: check DB version, refuse if DB is newer than code.
 */
export async function runStartupChecks(): Promise<{
  ok: boolean;
  dbVersion?: string;
  appVersion: string;
  error?: string;
}> {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check app version in DB
    const versionConfig = await prisma.systemConfig.findFirst({
      where: { key: "app.version" },
    });

    const dbVersion = versionConfig?.value ?? "0.0.0";

    // Compare versions
    if (compareVersions(dbVersion, APP_VERSION) > 0) {
      return {
        ok: false,
        dbVersion,
        appVersion: APP_VERSION,
        error: `Database schema (v${dbVersion}) is newer than application (v${APP_VERSION}). Please upgrade the application.`,
      };
    }

    // Update version if app is newer
    if (compareVersions(APP_VERSION, dbVersion) > 0 && versionConfig) {
      await prisma.systemConfig.update({
        where: { id: versionConfig.id },
        data: { value: APP_VERSION },
      });
    }

    return { ok: true, dbVersion, appVersion: APP_VERSION };
  } catch (e) {
    return {
      ok: false,
      appVersion: APP_VERSION,
      error: `Database connection failed: ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }
}

/**
 * Compare semantic versions. Returns:
 *  -1 if a < b
 *   0 if a === b
 *   1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const va = partsA[i] ?? 0;
    const vb = partsB[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}
