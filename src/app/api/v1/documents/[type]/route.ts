import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generatePdf, type DocumentType } from "@/lib/documents/generator";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import { moneyInWords } from "@/lib/documents/money-text";

interface RouteParams {
  params: Promise<{ type: string }>;
}

/**
 * GET /api/v1/documents/:type?loanId=xxx
 * Generates and streams a PDF document.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { type } = await params;
  const url = new URL(request.url);
  const loanId = url.searchParams.get("loanId");

  if (!loanId) {
    return NextResponse.json({ error: "loanId is required" }, { status: 400 });
  }

  const validTypes: DocumentType[] = ["kfs", "receipt", "emi-schedule", "noc"];
  if (!validTypes.includes(type as DocumentType)) {
    return NextResponse.json({ error: `Invalid type. Valid: ${validTypes.join(", ")}` }, { status: 400 });
  }

  try {
    const loan = await prisma.loanAccount.findFirst({
      where: { id: loanId },
      include: {
        emiSchedule: { orderBy: { installmentNumber: "asc" } },
        payments: { orderBy: { receivedDate: "desc" }, take: 1 },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const company = await prisma.company.findFirst({ where: { id: loan.companyId } });
    const customer = await prisma.customer.findFirst({ where: { id: loan.customerId } });
    const product = await prisma.loanProduct.findFirst({ where: { id: loan.loanProductId } });

    if (!company || !customer) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    const companyInfo = {
      name: company.name,
      rbiRegistration: company.rbiRegistrationNo ?? undefined,
      address: [company.address, company.city, company.state, company.pincode].filter(Boolean).join(", ") || undefined,
      phone: company.phone ?? undefined,
      email: company.email ?? undefined,
    };

    const borrowerName = `${customer.firstName} ${customer.lastName ?? ""}`.trim();
    let data: unknown;

    switch (type as DocumentType) {
      case "kfs": {
        const totalInterest = loan.emiSchedule.reduce((s, r) => s + r.interestComponent, 0n);
        const totalRepayment = loan.emiSchedule.reduce((s, r) => s + r.emiAmount, 0n);
        data = {
          company: companyInfo,
          applicationNumber: loan.accountNumber,
          borrowerName,
          loanProduct: product?.name ?? "—",
          loanAmount: formatMoney(loan.principalAmount),
          tenure: `${loan.tenureMonths} months`,
          interestRate: `${(loan.interestRateBps / 100).toFixed(2)}% p.a.`,
          interestType: loan.interestType,
          emiAmount: formatMoney(loan.emiAmount),
          totalInterest: formatMoney(totalInterest),
          totalRepayment: formatMoney(totalRepayment),
          apr: `${(loan.interestRateBps / 100).toFixed(2)}%`,
          processingFee: formatMoney(BigInt((product?.processingFeePercent ?? 0)) * loan.principalAmount / 10000n),
          stampDuty: "As applicable",
          netDisbursement: formatMoney(loan.principalAmount),
          coolingOffPeriod: "3 days from disbursement",
          penalChargesRate: `${((product?.penalRateAdditional ?? 200) / 100).toFixed(2)}% p.a. on overdue amount`,
          prepaymentConditions: loan.interestType === "FLOATING" ? "No prepayment penalty" : `${((product?.prepaymentFeePercent ?? 0) / 100).toFixed(2)}% of outstanding`,
          grievanceOfficer: "Nodal Officer",
          grievancePhone: company.phone ?? "—",
          date: formatDate(new Date()),
        };
        break;
      }
      case "receipt": {
        const payment = loan.payments[0];
        if (!payment) return NextResponse.json({ error: "No payments found" }, { status: 404 });
        data = {
          company: companyInfo,
          receiptNumber: payment.receiptNumber ?? `RCP-${payment.id.slice(0, 8)}`,
          date: formatDate(payment.receivedDate),
          borrowerName,
          loanAccountNumber: loan.accountNumber,
          paymentAmount: formatMoney(payment.amount),
          paymentMode: payment.mode,
          referenceNumber: payment.referenceNumber ?? undefined,
          allocatedToPrincipal: formatMoney(payment.allocatedToPrincipal),
          allocatedToInterest: formatMoney(payment.allocatedToInterest),
          allocatedToPenalty: formatMoney(payment.allocatedToPenalty),
          outstandingAfter: formatMoney(loan.outstandingPrincipal),
          amountInWords: moneyInWords(payment.amount),
        };
        break;
      }
      case "emi-schedule": {
        const totalInt = loan.emiSchedule.reduce((s, r) => s + r.interestComponent, 0n);
        const totalRep = loan.emiSchedule.reduce((s, r) => s + r.emiAmount, 0n);
        data = {
          company: companyInfo,
          loanAccountNumber: loan.accountNumber,
          borrowerName,
          principalAmount: formatMoney(loan.principalAmount),
          interestRate: `${(loan.interestRateBps / 100).toFixed(2)}% p.a.`,
          tenure: `${loan.tenureMonths} months`,
          monthlyEmi: formatMoney(loan.emiAmount),
          totalInterest: formatMoney(totalInt),
          totalRepayment: formatMoney(totalRep),
          rows: loan.emiSchedule.map((r) => ({
            number: r.installmentNumber,
            dueDate: formatDate(r.dueDate),
            emi: formatMoney(r.emiAmount),
            principal: formatMoney(r.principalComponent),
            interest: formatMoney(r.interestComponent),
            balance: formatMoney(r.closingBalance),
          })),
        };
        break;
      }
      case "noc": {
        data = {
          company: companyInfo,
          borrowerName,
          loanAccountNumber: loan.accountNumber,
          principalAmount: formatMoney(loan.principalAmount),
          disbursementDate: formatDate(loan.disbursedAt),
          closureDate: loan.closedAt ? formatDate(loan.closedAt) : formatDate(new Date()),
          closureType: loan.closureType ?? "NORMAL",
          date: formatDate(new Date()),
        };
        break;
      }
    }

    const pdfBuffer = await generatePdf(type as DocumentType, data as never);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${type}-${loan.accountNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
