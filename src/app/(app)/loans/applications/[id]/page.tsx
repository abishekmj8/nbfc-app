import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { ApplicationActions } from "./application-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requirePermission("loans", "VIEW");

  const application = await prisma.loanApplication.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      sanctionConditions: { orderBy: { createdAt: "asc" } },
      approvalRequests: { orderBy: { requestedAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      disbursement: true,
    },
  });

  if (!application) notFound();

  const customer = await prisma.customer.findFirst({
    where: { id: application.customerId },
  });

  const product = await prisma.loanProduct.findFirst({
    where: { id: application.loanProductId },
  });

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {application.applicationNumber}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {customer?.firstName} {customer?.lastName} &middot; {product?.name}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card label="Requested Amount" value={formatMoney(application.requestedAmount)} />
        <Card label="Approved Amount" value={application.approvedAmount ? formatMoney(application.approvedAmount) : "—"} />
        <Card label="Interest Rate" value={application.interestRateBps ? `${(application.interestRateBps / 100).toFixed(2)}%` : `${((product?.defaultInterestRate ?? 0) / 100).toFixed(2)}%`} />
        <Card label="Tenure" value={`${application.tenureMonths} months`} />
      </div>

      {/* Actions */}
      <ApplicationActions
        applicationId={application.id}
        status={application.status}
        sanctionConditions={application.sanctionConditions.map((c) => ({
          id: c.id,
          condition: c.condition,
          isMandatory: c.isMandatory,
          isMet: c.isMet,
        }))}
      />

      {/* Timeline */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Timeline</h2>
        <div className="space-y-3">
          <TimelineItem label="Created" date={application.createdAt} />
          {application.sanctionedAt && <TimelineItem label="Sanctioned" date={application.sanctionedAt} />}
          {application.disbursedAt && <TimelineItem label="Disbursed" date={application.disbursedAt} />}
          {application.rejectedAt && <TimelineItem label="Rejected" date={application.rejectedAt} detail={application.rejectionReason ?? undefined} />}
        </div>
      </div>

      {/* Sanction Conditions */}
      {application.sanctionConditions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Pre-Disbursement Conditions
          </h2>
          <div className="space-y-2">
            {application.sanctionConditions.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded border border-gray-200 dark:border-gray-800">
                <span className={`text-lg ${c.isMet ? "text-green-500" : "text-gray-300 dark:text-gray-600"}`}>
                  {c.isMet ? "✓" : "○"}
                </span>
                <span className={`text-sm ${c.isMet ? "text-gray-500 line-through" : "text-gray-900 dark:text-gray-100"}`}>
                  {c.condition}
                </span>
                {c.isMandatory && !c.isMet && (
                  <span className="text-xs text-red-500">Required</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Documents ({application.documents.length})
        </h2>
        {application.documents.length > 0 ? (
          <div className="space-y-2">
            {application.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.documentType.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-500">{doc.fileName}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  doc.status === "VERIFIED" ? "bg-green-100 text-green-800" :
                  doc.status === "REJECTED" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    SANCTIONED: "bg-purple-100 text-purple-800",
    DISBURSED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );
}

function TimelineItem({ label, date, detail }: { label: string; date: Date; detail?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
      <div>
        <p className="text-sm text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500">{formatDateTime(date)}</p>
        {detail && <p className="text-xs text-gray-400 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}
