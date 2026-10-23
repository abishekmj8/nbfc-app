import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";

export default async function ReportsPage() {
  const user = await requirePermission("reports", "VIEW");

  const [
    loansByStatus,
    loansByProduct,
    monthlyDisbursements,
    monthlyCollections,
  ] = await Promise.all([
    // Portfolio by status
    prisma.loanAccount.groupBy({
      by: ["status"],
      where: { companyId: user.companyId },
      _count: true,
      _sum: { outstandingPrincipal: true, principalAmount: true },
    }),
    // Portfolio by product
    prisma.loanAccount.groupBy({
      by: ["loanProductId"],
      where: { companyId: user.companyId },
      _count: true,
      _sum: { outstandingPrincipal: true },
    }),
    // Monthly disbursements (last 6 months)
    prisma.loanAccount.groupBy({
      by: ["status"],
      where: {
        companyId: user.companyId,
        disbursedAt: { gte: new Date(Date.now() - 180 * 86400000) },
      },
      _count: true,
      _sum: { principalAmount: true },
    }),
    // Monthly collections (last 6 months)
    prisma.payment.aggregate({
      where: {
        companyId: user.companyId,
        status: "ALLOCATED",
        receivedDate: { gte: new Date(Date.now() - 180 * 86400000) },
      },
      _sum: { amount: true, allocatedToPrincipal: true, allocatedToInterest: true },
      _count: true,
    }),
  ]);

  const totalOutstanding = loansByStatus.reduce(
    (sum, s) => sum + Number(s._sum.outstandingPrincipal ?? 0), 0
  );
  const totalDisbursed = loansByStatus.reduce(
    (sum, s) => sum + Number(s._sum.principalAmount ?? 0), 0
  );
  const totalCollected = Number(monthlyCollections._sum.amount ?? 0);
  const totalAccounts = loansByStatus.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <ReportCard label="Total AUM" value={formatMoney(BigInt(totalOutstanding))} />
        <ReportCard label="Total Disbursed" value={formatMoney(BigInt(totalDisbursed))} />
        <ReportCard label="Total Collected (6mo)" value={formatMoney(BigInt(totalCollected))} />
        <ReportCard label="Total Accounts" value={String(totalAccounts)} />
      </div>

      {/* Portfolio by Status */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Portfolio by Status
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">Accounts</th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">Outstanding</th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">Disbursed</th>
            </tr>
          </thead>
          <tbody>
            {loansByStatus.map((row) => (
              <tr key={row.status} className="border-b border-gray-100 dark:border-gray-800/50">
                <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">{row.status}</td>
                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">{row._count}</td>
                <td className="py-2 px-3 text-right font-mono text-gray-900 dark:text-gray-100">
                  {formatMoney(BigInt(Number(row._sum.outstandingPrincipal ?? 0)))}
                </td>
                <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                  {formatMoney(BigInt(Number(row._sum.principalAmount ?? 0)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loansByStatus.length === 0 && (
          <p className="text-center text-gray-500 py-8">No loan data yet</p>
        )}
      </div>

      {/* Collection Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Collection Summary (Last 6 Months)
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Collected</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatMoney(BigInt(totalCollected))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Principal Recovered</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatMoney(BigInt(Number(monthlyCollections._sum.allocatedToPrincipal ?? 0)))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Interest Collected</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatMoney(BigInt(Number(monthlyCollections._sum.allocatedToInterest ?? 0)))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Count</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
              {monthlyCollections._count}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );
}
