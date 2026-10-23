import { NextResponse } from "next/server";
import { runDpdCalculation } from "@/lib/loan-management/dpd-engine";

/**
 * DPD/NPA classification cron job.
 * Should be called once per day after accrual.
 * POST /api/v1/cron/dpd-calculation
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDpdCalculation();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DPD calculation failed:", error);
    return NextResponse.json(
      { error: "DPD job failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
