import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import { PaymentForm } from "./payment-form";
import { LoanActions } from "./loan-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LoanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requirePermission("loans", "VIEW");

  const loan = await prisma.loanAccount.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      emiSchedule: { orderBy: { installmentNumber: "asc" } },
      payments: { orderBy: { receivedDate: "desc" }, take: 20 },
    },
  });

  if (!loan) notFound();

  const customer = await prisma.customer.findFirst({
    where: { id: loan.customerId },
  });

  const paidEmis = loan.emiSchedule.filter((e) => e.status === "PAID").length;
  const overdueEmis = loan.emiSchedule.filter((e) => e.status === "OVERDUE").length;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {loan.accountNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {customer?.firstName} {customer?.lastName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DpdBadge dpd={loan.dpd} />
          <StatusBadge status={loan.status} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <Card label="Principal" value={formatMoney(loan.principalAmount)} />
        <Card label="Outstanding" value={formatMoney(loan.outstandingPrincipal)} />
        <Card label="EMI" value={formatMoney(loan.emiAmount)} />
        <Card label="Rate" value={`${(loan.interestRateBps / 100).toFixed(2)}% p.a.`} />
        <Card label="Progress" value={`${paidEmis}/${loan.tenureMonths} EMIs`} />
      </div>

      {/* Actions */}
      {loan.status === "ACTIVE" || loan.status === "OVERDUE" ? (
        <div className="mb-6 flex gap-3">
          <PaymentForm loanAccountId={loan.id} emiAmount={loan.emiAmount} />
          <LoanActions loanAccountId={loan.id} status={loan.status} outstandingPrincipal={loan.outstandingPrincipal} interestRateBps={loan.interestRateBps} />
        </div>
      ) : null}

      {/* EMI Schedule */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          EMI Schedule ({overdueEmis > 0 ? `${overdueEmis} overdue` : "on track"})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-2 px-3 font-medium text-gray-500">#</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Due Date</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">EMI</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Principal</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Interest</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Balance</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loan.emiSchedule.map((row) => (
                <tr key={row.id} className={`border-b border-gray-100 dark:border-gray-800/50 ${
                  row.status === "OVERDUE" ? "bg-red-50/50 dark:bg-red-950/20" : ""
                }`}>
                  <td className="py-2 px-3 text-gray-500">{row.installmentNumber}</td>
                  <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{formatDate(row.dueDate)}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-900 dark:text-gray-100">{formatMoney(row.emiAmount)}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">{formatMoney(row.principalComponent)}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">{formatMoney(row.interestComponent)}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">{formatMoney(row.closingBalance)}</td>
                  <td className="py-2 px-3">
                    <EmiStatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      {loan.payments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Payments
          </h2>
          <div className="space-y-2">
            {loan.payments.map((p) => (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded border ${
                p.isBounced ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" : "border-gray-200 dark:border-gray-800"
              }`}>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatMoney(p.amount)} via {p.mode}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(p.receivedDate)}
                    {p.referenceNumber && ` · Ref: ${p.referenceNumber}`}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>P: {formatMoney(p.allocatedToPrincipal)} · I: {formatMoney(p.allocatedToInterest)}</p>
                  {p.isBounced && <p className="text-red-500 font-medium">BOUNCED: {p.bounceReason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    OVERDUE: "bg-yellow-100 text-yellow-800",
    NPA: "bg-red-100 text-red-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function DpdBadge({ dpd }: { dpd: number }) {
  if (dpd === 0) return null;
  const color = dpd > 90 ? "text-red-600" : dpd > 30 ? "text-yellow-600" : "text-orange-500";
  return <span className={`text-sm font-bold ${color}`}>DPD: {dpd}</span>;
}

function EmiStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    DUE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    PARTIALLY_PAID: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    UPCOMING: "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? ""}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
    </div>
  );
}
