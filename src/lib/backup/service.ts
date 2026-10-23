import { prisma } from "@/lib/db/prisma";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { createCipheriv, randomBytes, createHash } from "crypto";

const execAsync = promisify(exec);

export interface BackupResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  error?: string;
  duration?: number;
}

export interface BackupMetadata {
  version: string;
  createdAt: string;
  databaseType: string;
  companyName?: string;
  recordCounts: Record<string, number>;
}

/**
 * Create a full database backup.
 * For SQLite: copies the .db file.
 * For PostgreSQL: runs pg_dump.
 */
export async function createBackup(outputDir: string): Promise<BackupResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dbUrl = process.env.DATABASE_URL ?? "";

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    if (dbUrl.startsWith("file:")) {
      return await backupSqlite(dbUrl, outputDir, timestamp, startTime);
    } else if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
      return await backupPostgres(dbUrl, outputDir, timestamp, startTime);
    } else {
      return { success: false, error: `Unsupported database: ${dbUrl.split("://")[0]}` };
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Backup failed" };
  }
}

async function backupSqlite(
  dbUrl: string,
  outputDir: string,
  timestamp: string,
  startTime: number
): Promise<BackupResult> {
  const dbPath = dbUrl.replace("file:", "").replace("./", "");
  const fullDbPath = path.resolve("prisma", dbPath);
  const outputFile = path.join(outputDir, `backup-${timestamp}.db`);

  if (!existsSync(fullDbPath)) {
    return { success: false, error: `Database file not found: ${fullDbPath}` };
  }

  // Use SQLite's backup command for consistency
  await execAsync(`sqlite3 "${fullDbPath}" ".backup '${outputFile}'"`).catch(async () => {
    // Fallback: file copy
    const { copyFileSync } = await import("fs");
    copyFileSync(fullDbPath, outputFile);
  });

  const { statSync } = await import("fs");
  const stats = statSync(outputFile);
  const checksum = await fileChecksum(outputFile);

  return {
    success: true,
    filePath: outputFile,
    fileSize: stats.size,
    checksum,
    duration: Date.now() - startTime,
  };
}

async function backupPostgres(
  dbUrl: string,
  outputDir: string,
  timestamp: string,
  startTime: number
): Promise<BackupResult> {
  const outputFile = path.join(outputDir, `backup-${timestamp}.sql`);

  await execAsync(`pg_dump "${dbUrl}" --no-owner --no-acl > "${outputFile}"`);

  const { statSync } = await import("fs");
  const stats = statSync(outputFile);
  const checksum = await fileChecksum(outputFile);

  return {
    success: true,
    filePath: outputFile,
    fileSize: stats.size,
    checksum,
    duration: Date.now() - startTime,
  };
}

async function fileChecksum(filePath: string): Promise<string> {
  const { readFileSync } = await import("fs");
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Get backup metadata (record counts for verification).
 */
export async function getBackupMetadata(): Promise<BackupMetadata> {
  const company = await prisma.company.findFirst();
  const dbUrl = process.env.DATABASE_URL ?? "";
  const dbType = dbUrl.startsWith("file:") ? "sqlite"
    : dbUrl.startsWith("postgresql://") ? "postgresql"
    : dbUrl.startsWith("mysql://") ? "mysql"
    : "unknown";

  const [
    customers, loans, payments, loanApplications, auditLogs,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.loanAccount.count(),
    prisma.payment.count(),
    prisma.loanApplication.count(),
    prisma.auditLog.count(),
  ]);

  return {
    version: "0.1.0",
    createdAt: new Date().toISOString(),
    databaseType: dbType,
    companyName: company?.name,
    recordCounts: {
      customers,
      loanAccounts: loans,
      payments,
      loanApplications,
      auditLogs,
    },
  };
}
