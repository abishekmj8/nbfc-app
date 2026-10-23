import { requireAuth } from "@/lib/auth/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Building2, Users, Package, Puzzle, CalendarDays, ScrollText, Shield } from "lucide-react";

const settingsCards = [
  { title: "Company", description: "Company profile, registration, branding", href: "/settings/company", icon: Building2 },
  { title: "Branches", description: "Manage branch locations", href: "/settings/branches", icon: Building2 },
  { title: "Users & Roles", description: "User accounts, roles, permissions", href: "/settings/users", icon: Users },
  { title: "Loan Products", description: "Configure loan products and rates", href: "/settings/loan-products", icon: Package },
  { title: "Modules", description: "Enable or disable feature modules", href: "/settings/modules", icon: Puzzle },
  { title: "Holidays", description: "Holiday calendar for interest calculation", href: "/settings/holidays", icon: CalendarDays },
  { title: "Roles & Permissions", description: "Permission matrix per role", href: "/settings/roles", icon: Shield },
  { title: "Audit Log", description: "View all system changes", href: "/settings/audit-log", icon: ScrollText },
];

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>
      <div className="grid grid-cols-2 gap-4">
        {settingsCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer h-full">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <card.icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{card.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
