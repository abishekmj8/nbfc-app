import { requireAuth } from "@/lib/auth/rbac";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Dashboard
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Welcome back, {user.firstName}. You are logged in as{" "}
        <span className="font-medium">{user.role.name}</span> at{" "}
        <span className="font-medium">{user.company.name}</span>.
      </p>
    </div>
  );
}
