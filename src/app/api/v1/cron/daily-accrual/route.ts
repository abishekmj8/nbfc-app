import { NextResponse } from "next/server";
import { runDailyAccrual } from "@/lib/loan-management/accrual-service";
import { markEmisDue } from "@/lib/loan-management/dpd-engine";

/**
 * Daily accrual cron job.
 * Should be called once per day (e.g., via external cron or scheduled task).
 * POST /api/v1/cron/daily-accrual
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const emisMarkedDue = await markEmisDue();
    const accrualResult = await runDailyAccrual();

    return NextResponse.json({
      success: true,
      emisMarkedDue,
      accrual: {
        processed: accrualResult.processed,
        totalInterestAccrued: accrualResult.totalInterestAccrued.toString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Daily accrual failed:", error);
    return NextResponse.json(
      { error: "Accrual job failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
