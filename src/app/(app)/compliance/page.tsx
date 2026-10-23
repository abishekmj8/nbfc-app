import { requirePermission } from "@/lib/auth/rbac";
import { getPortfolioComplianceStats } from "@/lib/compliance/checks";

export default async function CompliancePage() {
  const user = await requirePermission("compliance", "VIEW");
  const stats = await getPortfolioComplianceStats(user.companyId);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Compliance Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <ComplianceCard
          title="KFS Compliance"
          value={`${stats.kfsCompliance}%`}
          status={parseFloat(stats.kfsCompliance) >= 100 ? "pass" : "warning"}
          detail={stats.disbursedWithoutKfs > 0
            ? `${stats.disbursedWithoutKfs} loan(s) disbursed without KFS`
            : "All disbursed loans have KFS"}
        />
        <ComplianceCard
          title="NPA Ratio"
          value={`${stats.npaPercent}%`}
          status={parseFloat(stats.npaPercent) <= 5 ? "pass" : parseFloat(stats.npaPercent) <= 10 ? "warning" : "fail"}
          detail={`${stats.npaLoans} NPA account(s) out of ${stats.totalLoans}`}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Regulatory Checklist</h2>
        <div className="space-y-3">
          <ChecklistItem title="Fair Practices Code" status="active" detail="Board-approved FPC in place" />
          <ChecklistItem title="RBI Digital Lending Directions 2025" status="active" detail="KFS generation, cooling-off enforcement enabled" />
          <ChecklistItem title="KYC/AML Compliance" status="active" detail="Customer due diligence at onboarding" />
          <ChecklistItem title="Credit Bureau Reporting" status="pending" detail="Weekly reporting to 4 bureaus — configure in Settings > Integrations" />
          <ChecklistItem title="CRILC Reporting" status="pending" detail="Quarterly reporting for exposures >= Rs 5 crore" />
          <ChecklistItem title="PMLA CTR/STR" status="pending" detail="Cash Transaction Reports and Suspicious Transaction Reports" />
          <ChecklistItem title="CERSAI Registration" status="pending" detail="Charge registration for secured loans" />
          <ChecklistItem title="Data Protection (DPDP Act)" status="active" detail="PII encryption, consent management, audit trail enabled" />
        </div>
      </div>
    </div>
  );
}

function ComplianceCard({ title, value, status, detail }: {
  title: string; value: string; status: "pass" | "warning" | "fail"; detail: string;
}) {
  const borderColor = status === "pass" ? "border-green-200 dark:border-green-800"
    : status === "warning" ? "border-yellow-200 dark:border-yellow-800"
    : "border-red-200 dark:border-red-800";
  const valueColor = status === "pass" ? "text-green-600" : status === "warning" ? "text-yellow-600" : "text-red-600";

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border-2 ${borderColor} p-4`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-2">{detail}</p>
    </div>
  );
}

function ChecklistItem({ title, status, detail }: {
  title: string; status: "active" | "pending" | "issue"; detail: string;
}) {
  const icon = status === "active" ? "✓" : status === "pending" ? "○" : "✗";
  const iconColor = status === "active" ? "text-green-500" : status === "pending" ? "text-gray-400" : "text-red-500";

  return (
    <div className="flex items-start gap-3 p-3 rounded border border-gray-100 dark:border-gray-800">
      <span className={`text-lg ${iconColor}`}>{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
