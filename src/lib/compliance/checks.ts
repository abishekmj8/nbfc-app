"use server";

import { prisma } from "@/lib/db/prisma";
import { daysBetween } from "@/lib/interest/day-count/actual-actual";

export interface ComplianceCheck {
  id: string;
  name: string;
  status: "PASS" | "FAIL" | "WARNING" | "NOT_APPLICABLE";
  message: string;
  entityId?: string;
}

/**
 * Run compliance checks for a loan application.
 */
export async function runApplicationComplianceChecks(
  applicationId: string
): Promise<ComplianceCheck[]> {
  const app = await prisma.loanApplication.findFirst({
    where: { id: applicationId },
    include: {
      documents: true,
      appraisal: true,
      sanctionConditions: true,
      disbursement: true,
    },
  });

  if (!app) return [];

  const checks: ComplianceCheck[] = [];

  // 1. KFS Generation Check (RBI Digital Lending 2025)
  const kfsDoc = app.documents.find((d) => d.documentType === "KFS");
  checks.push({
    id: "kfs_generated",
    name: "Key Fact Statement (KFS)",
    status: kfsDoc ? "PASS" : app.status === "DISBURSED" ? "FAIL" : "WARNING",
    message: kfsDoc
      ? "KFS generated and presented to borrower"
      : "KFS must be generated before disbursement (RBI Digital Lending Directions 2025)",
  });

  // 2. Loan Agreement Signed
  const agreement = app.documents.find((d) => d.documentType === "LOAN_AGREEMENT");
  checks.push({
    id: "agreement_signed",
    name: "Loan Agreement",
    status: agreement ? "PASS" : app.status === "DISBURSED" ? "FAIL" : "WARNING",
    message: agreement
      ? "Loan agreement executed"
      : "Loan agreement must be signed before disbursement",
  });

  // 3. Credit Appraisal Done
  checks.push({
    id: "credit_appraisal",
    name: "Credit Appraisal",
    status: app.appraisal ? "PASS" : "WARNING",
    message: app.appraisal
      ? `Appraised: ${app.appraisal.riskCategory} risk, score: ${app.appraisal.creditScore ?? "N/A"}`
      : "Credit appraisal not completed",
  });

  // 4. Rejection Reason (if rejected — must have reason per FPC)
  if (app.status === "REJECTED") {
    checks.push({
      id: "rejection_reason",
      name: "Rejection Reason (FPC)",
      status: app.rejectionReason ? "PASS" : "FAIL",
      message: app.rejectionReason
        ? `Reason: ${app.rejectionReason}`
        : "Rejection reason is mandatory per Fair Practices Code",
    });
  }

  // 5. Cooling-Off Period (if disbursed)
  if (app.disbursement && app.disbursedAt) {
    const daysSinceDisbursement = daysBetween(app.disbursedAt, new Date());
    const coolingOffDays = 3; // Digital loans = 3 days
    checks.push({
      id: "cooling_off",
      name: "Cooling-Off Period",
      status: daysSinceDisbursement <= coolingOffDays ? "WARNING" : "PASS",
      message: daysSinceDisbursement <= coolingOffDays
        ? `Cooling-off active: ${coolingOffDays - daysSinceDisbursement} day(s) remaining. Borrower can exit without penalty.`
        : "Cooling-off period completed",
    });
  }

  // 6. All Sanction Conditions Met (if disbursed)
  if (app.status === "DISBURSED") {
    const unmet = app.sanctionConditions.filter((c) => c.isMandatory && !c.isMet);
    checks.push({
      id: "sanction_conditions",
      name: "Pre-Disbursement Conditions",
      status: unmet.length === 0 ? "PASS" : "FAIL",
      message: unmet.length === 0
        ? "All mandatory conditions met"
        : `${unmet.length} mandatory condition(s) not met before disbursement`,
    });
  }

  return checks;
}

/**
 * Portfolio-level compliance summary.
 */
export async function getPortfolioComplianceStats(companyId: string) {
  const [totalLoans, npaLoans, disbursedWithoutKfs] = await Promise.all([
    prisma.loanAccount.count({ where: { companyId } }),
    prisma.loanAccount.count({ where: { companyId, status: "NPA" } }),
    // Loans disbursed without KFS document
    prisma.loanApplication.count({
      where: {
        companyId,
        status: "DISBURSED",
        documents: { none: { documentType: "KFS" } },
      },
    }),
  ]);

  return {
    totalLoans,
    npaLoans,
    npaPercent: totalLoans > 0 ? ((npaLoans / totalLoans) * 100).toFixed(1) : "0.0",
    disbursedWithoutKfs,
    kfsCompliance: totalLoans > 0
      ? (((totalLoans - disbursedWithoutKfs) / totalLoans) * 100).toFixed(1)
      : "100.0",
  };
}
