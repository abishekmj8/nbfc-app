import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils/date";
import { BranchForm } from "./branch-form";

export default async function BranchesPage() {
  const user = await requirePermission("branches", "VIEW");

  const branches = await prisma.branch.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: { where: { deletedAt: null } } } } },
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Branches</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your company branches and locations
          </p>
        </div>
      </div>

      <BranchForm />

      <div className="mt-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Code</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">City</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Users</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Created</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id} className="border-b border-gray-100 dark:border-gray-800/50">
                <td className="py-3 px-4 font-mono text-gray-900 dark:text-gray-100">{branch.code}</td>
                <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{branch.name}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{branch.city ?? "—"}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{branch._count.users}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(branch.createdAt)}</td>
                <td className="py-3 px-4">
                  {branch.isHeadOffice && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Head Office
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {branches.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No branches found</p>
        )}
      </div>
    </div>
  );
}
