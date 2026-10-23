"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  Building2,
  Users,
  CalendarDays,
  Puzzle,
  LogOut,
  UserPlus,
  FileText,
  Landmark,
  Receipt,
  ShieldCheck,
  BarChart3,
  Contact,
  Package,
  Calculator,
  AlertTriangle,
  ListTodo,
  Gem,
  Car,
  UsersRound,
  Handshake,
  Shield,
  Briefcase,
  Vault,
  BadgeCheck,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
];

const lendingItems: NavItem[] = [
  { label: "Customers", href: "/customers", icon: <Contact size={18} /> },
  { label: "Leads", href: "/leads", icon: <UserPlus size={18} /> },
  { label: "Applications", href: "/loans/applications", icon: <FileText size={18} /> },
  { label: "Loan Accounts", href: "/loans", icon: <Landmark size={18} /> },
  { label: "Collections", href: "/collections", icon: <Receipt size={18} /> },
];

const accountingItems: NavItem[] = [
  { label: "Chart of Accounts", href: "/accounting/chart-of-accounts", icon: <Calculator size={18} /> },
  { label: "Trial Balance", href: "/accounting/trial-balance", icon: <Calculator size={18} /> },
  { label: "Profit & Loss", href: "/accounting/profit-loss", icon: <Calculator size={18} /> },
  { label: "Balance Sheet", href: "/accounting/balance-sheet", icon: <Calculator size={18} /> },
  { label: "Treasury", href: "/treasury", icon: <Vault size={18} /> },
];

const moreItems: NavItem[] = [
  { label: "Gold Loans", href: "/gold-loans", icon: <Gem size={18} /> },
  { label: "Vehicle Loans", href: "/vehicle-loans", icon: <Car size={18} /> },
  { label: "Microfinance", href: "/microfinance", icon: <UsersRound size={18} /> },
  { label: "Co-Lending", href: "/co-lending", icon: <Handshake size={18} /> },
  { label: "Insurance", href: "/insurance", icon: <Shield size={18} /> },
  { label: "DSA Partners", href: "/dsa", icon: <Briefcase size={18} /> },
];

const analyticsItems: NavItem[] = [
  { label: "Reports", href: "/reports", icon: <BarChart3 size={18} /> },
  { label: "Compliance", href: "/compliance", icon: <ShieldCheck size={18} /> },
  { label: "Early Warning", href: "/ews", icon: <AlertTriangle size={18} /> },
  { label: "Tasks", href: "/tasks", icon: <ListTodo size={18} /> },
  { label: "HR", href: "/hr", icon: <BadgeCheck size={18} /> },
];

const settingsItems: NavItem[] = [
  { label: "Company", href: "/settings/company", icon: <Building2 size={18} /> },
  { label: "Branches", href: "/settings/branches", icon: <Building2 size={18} /> },
  { label: "Users", href: "/settings/users", icon: <Users size={18} /> },
  { label: "Loan Products", href: "/settings/loan-products", icon: <Package size={18} /> },
  { label: "Modules", href: "/settings/modules", icon: <Puzzle size={18} /> },
  { label: "Holidays", href: "/settings/holidays", icon: <CalendarDays size={18} /> },
  { label: "Audit Log", href: "/settings/audit-log", icon: <ScrollText size={18} /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
          NBFC Manager
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>

        <div className="mt-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Lending
          </p>
          <div className="space-y-1">
            {lendingItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Accounting
          </p>
          <div className="space-y-1">
            {accountingItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            More
          </p>
          <div className="space-y-1">
            {moreItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Analytics
          </p>
          <div className="space-y-1">
            {analyticsItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Settings
          </p>
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </div>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
        active
          ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}
