import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireAuth();

  const [
    loanStats,
    applicationStats,
    leadStats,
    recentPayments,
  ] = await Promise.all([
    // Loan portfolio stats
    prisma.loanAccount.groupBy({
      by: ["status"],
      where: { companyId: user.companyId },
      _count: true,
      _sum: { outstandingPrincipal: true, principalAmount: true },
    }),
    // Application pipeline
    prisma.loanApplication.groupBy({
      by: ["status"],
      where: { companyId: user.companyId, deletedAt: null },
      _count: true,
    }),
    // Lead stats
    prisma.lead.groupBy({
      by: ["status"],
      where: { companyId: user.companyId, deletedAt: null },
      _count: true,
    }),
    // Recent payments
    prisma.payment.findMany({
      where: { companyId: user.companyId },
      orderBy: { receivedDate: "desc" },
      take: 5,
      include: { loanAccount: { select: { accountNumber: true } } },
    }),
  ]);

  const totalAum = loanStats.reduce((sum, s) => sum + Number(s._sum.outstandingPrincipal ?? 0), 0);
  const totalDisbursed = loanStats.reduce((sum, s) => sum + Number(s._sum.principalAmount ?? 0), 0);
  const activeLoans = loanStats.find((s) => s.status === "ACTIVE")?._count ?? 0;
  const overdueLoans = loanStats.find((s) => s.status === "OVERDUE")?._count ?? 0;
  const npaLoans = loanStats.find((s) => s.status === "NPA")?._count ?? 0;
  const totalLoans = loanStats.reduce((sum, s) => sum + s._count, 0);
  const npaPercent = totalLoans > 0 ? ((npaLoans / totalLoans) * 100).toFixed(1) : "0.0";

  const pendingApplications = applicationStats
    .filter((s) => ["SUBMITTED", "UNDER_REVIEW", "SANCTIONED"].includes(s.status))
    .reduce((sum, s) => sum + s._count, 0);

  const newLeads = leadStats.find((s) => s.status === "NEW")?._count ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Dashboard
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Welcome back, {user.firstName}
      </p>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="AUM (Outstanding)" value={formatMoney(BigInt(totalAum))} />
        <StatCard label="Total Disbursed" value={formatMoney(BigInt(totalDisbursed))} />
        <StatCard label="Active Loans" value={String(activeLoans)} color="text-green-600 dark:text-green-400" />
        <StatCard label="NPA %" value={`${npaPercent}%`} color={npaLoans > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Overdue Accounts" value={String(overdueLoans)} color="text-yellow-600" href="/collections" />
        <StatCard label="Pending Applications" value={String(pendingApplications)} color="text-blue-600" href="/loans/applications" />
        <StatCard label="New Leads" value={String(newLeads)} color="text-purple-600" href="/leads" />
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Payments</h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link href={`/loans/${p.loanAccountId}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {p.loanAccount.accountNumber}
                  </Link>
                  <p className="text-xs text-gray-500">{p.mode} · {new Date(p.receivedDate).toLocaleDateString("en-IN")}</p>
                </div>
                <span className={`text-sm font-mono font-medium ${p.isBounced ? "text-red-600 line-through" : "text-green-600 dark:text-green-400"}`}>
                  {formatMoney(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, href }: { label: string; value: string; color?: string; href?: string }) {
  const content = (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ?? "text-gray-900 dark:text-gray-100"}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
