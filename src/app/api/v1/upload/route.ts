import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { saveFile } from "@/lib/storage/file-service";
import { createAuditLog } from "@/lib/audit/service";

/**
 * POST /api/v1/upload
 * Multipart form upload. Fields: file, entityType, entityId, documentType, loanApplicationId?
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string | null;
    const entityId = formData.get("entityId") as string | null;
    const documentType = formData.get("documentType") as string | null;
    const loanApplicationId = formData.get("loanApplicationId") as string | null;

    if (!file || !entityType || !entityId || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields: file, entityType, entityId, documentType" },
        { status: 400 }
      );
    }

    // Save file to storage
    const result = await saveFile({
      file,
      companyId: user.companyId,
      entityType,
      entityId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Create Document record in DB
    const document = await prisma.document.create({
      data: {
        companyId: user.companyId,
        entityType,
        entityId,
        loanApplicationId: loanApplicationId || null,
        documentType,
        fileName: result.fileName!,
        filePath: result.filePath!,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        status: "UPLOADED",
        createdBy: user.id,
      },
    });

    await createAuditLog({
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Document",
      entityId: document.id,
      after: {
        documentType,
        fileName: result.fileName,
        entityType,
        entityId,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        documentType: document.documentType,
        fileName: document.fileName,
        fileSize: document.fileSize,
        status: document.status,
      },
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
