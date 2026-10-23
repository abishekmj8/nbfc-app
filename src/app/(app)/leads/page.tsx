import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/money";
import { LeadCreateForm } from "./lead-form";
import { LeadActions } from "./lead-actions";

export default async function LeadsPage() {
  const user = await requirePermission("leads", "VIEW");

  const leads = await prisma.lead.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const products = await prisma.loanProduct.findMany({
    where: { companyId: user.companyId, isActive: true, deletedAt: null },
    select: { id: true, name: true, code: true },
  });

  const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    INTERESTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CONVERTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    LOST: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {leads.length} leads
          </p>
        </div>
      </div>

      <LeadCreateForm products={products} />

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-3 font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Phone</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Source</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Amount</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Created</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">
                  {lead.customerName}
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{lead.phone}</td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{lead.source}</td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                  {lead.requestedAmount ? formatMoney(lead.requestedAmount) : "—"}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status] ?? ""}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500">{formatDate(lead.createdAt)}</td>
                <td className="py-3 px-3">
                  <LeadActions
                    leadId={lead.id}
                    status={lead.status}
                    hasProduct={!!lead.loanProductId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <p className="text-center text-gray-500 py-12">No leads yet. Create your first lead above.</p>
        )}
      </div>
    </div>
  );
}
