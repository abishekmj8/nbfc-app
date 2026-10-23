import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          userName={`${user.firstName} ${user.lastName ?? ""}`.trim()}
          companyName={user.company.name}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
