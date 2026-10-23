import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/money";
import Link from "next/link";

export default async function ApplicationsPage() {
  const user = await requirePermission("loans", "VIEW");

  const applications = await prisma.loanApplication.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    SANCTIONED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    DISBURSED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Loan Applications
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-3 font-medium text-gray-500">Application #</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Amount</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Tenure</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="py-3 px-3">
                  <Link href={`/loans/applications/${app.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {app.applicationNumber}
                  </Link>
                </td>
                <td className="py-3 px-3 text-gray-900 dark:text-gray-100">
                  {formatMoney(app.requestedAmount)}
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                  {app.tenureMonths} months
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[app.status] ?? ""}`}>
                    {app.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500">{formatDate(app.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            No loan applications yet. Convert a lead or create one directly.
          </p>
        )}
      </div>
    </div>
  );
}
