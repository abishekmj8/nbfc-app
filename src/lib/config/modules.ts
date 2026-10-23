/**
 * Module registry — defines all 28 modules, their dependencies,
 * and whether they can be toggled off.
 */

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: "core" | "lending" | "finance" | "compliance" | "communication" | "documents" | "hr" | "integrations";
  isCore: boolean; // Core modules can't be disabled
  dependsOn: string[]; // Module IDs this depends on
  icon: string; // Lucide icon name
}

export const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  // ── Core (always on) ──────────────────────────────────────
  "user-management": {
    id: "user-management",
    name: "User & Access Management",
    description: "Users, roles, permissions, maker-checker workflows",
    category: "core",
    isCore: true,
    dependsOn: [],
    icon: "Users",
  },
  "company-setup": {
    id: "company-setup",
    name: "Company & Branch Setup",
    description: "Company profile, branches, financial year, holidays",
    category: "core",
    isCore: true,
    dependsOn: [],
    icon: "Building2",
  },
  "audit-trail": {
    id: "audit-trail",
    name: "Audit Trail",
    description: "Append-only log of every data change",
    category: "core",
    isCore: true,
    dependsOn: [],
    icon: "ScrollText",
  },
  settings: {
    id: "settings",
    name: "Settings & Configuration",
    description: "Module toggles, system settings, backup",
    category: "core",
    isCore: true,
    dependsOn: [],
    icon: "Settings",
  },

  // ── Lending ───────────────────────────────────────────────
  "lead-management": {
    id: "lead-management",
    name: "Lead & Enquiry Management",
    description: "Lead capture, assignment, DSA referrals, follow-ups",
    category: "lending",
    isCore: false,
    dependsOn: [],
    icon: "UserPlus",
  },
  "loan-origination": {
    id: "loan-origination",
    name: "Loan Origination (LOS)",
    description: "Application, KYC, appraisal, sanction, disbursement",
    category: "lending",
    isCore: false,
    dependsOn: ["lead-management"],
    icon: "FileText",
  },
  "loan-management": {
    id: "loan-management",
    name: "Loan Management (LMS)",
    description: "EMI schedules, repayments, interest accrual, NPA tracking",
    category: "lending",
    isCore: false,
    dependsOn: ["loan-origination"],
    icon: "Landmark",
  },
  collections: {
    id: "collections",
    name: "Collections & Recovery",
    description: "Overdue tracking, field collection, demand notices",
    category: "lending",
    isCore: false,
    dependsOn: ["loan-management"],
    icon: "Receipt",
  },
  "gold-loan-ops": {
    id: "gold-loan-ops",
    name: "Gold Loan Operations",
    description: "Gold appraisal, vault management, auctions",
    category: "lending",
    isCore: false,
    dependsOn: ["loan-management"],
    icon: "Gem",
  },
  "vehicle-loan-ops": {
    id: "vehicle-loan-ops",
    name: "Vehicle / Asset Loan Operations",
    description: "Hypothecation, insurance tracking, repossession",
    category: "lending",
    isCore: false,
    dependsOn: ["loan-management"],
    icon: "Car",
  },
  "microfinance-ops": {
    id: "microfinance-ops",
    name: "Microfinance Operations",
    description: "JLG/SHG groups, center meetings, group loans",
    category: "lending",
    isCore: false,
    dependsOn: ["loan-management"],
    icon: "Users",
  },

  // ── Finance & Accounting ──────────────────────────────────
  accounting: {
    id: "accounting",
    name: "Accounting & General Ledger",
    description: "Double-entry bookkeeping, trial balance, P&L, balance sheet",
    category: "finance",
    isCore: false,
    dependsOn: [],
    icon: "Calculator",
  },
  treasury: {
    id: "treasury",
    name: "Treasury & Fund Management",
    description: "Borrowings, investments, cash flow forecasting",
    category: "finance",
    isCore: false,
    dependsOn: ["accounting"],
    icon: "Vault",
  },
  "fee-charges": {
    id: "fee-charges",
    name: "Fee & Charges Management",
    description: "Processing fees, penalties, GST, waivers",
    category: "finance",
    isCore: false,
    dependsOn: ["accounting"],
    icon: "IndianRupee",
  },

  // ── Compliance & Reporting ────────────────────────────────
  compliance: {
    id: "compliance",
    name: "Regulatory Compliance",
    description: "CRILC, bureau reporting, KFS, cooling-off, PMLA",
    category: "compliance",
    isCore: false,
    dependsOn: ["loan-management"],
    icon: "ShieldCheck",
  },
  reports: {
    id: "reports",
    name: "Reports & Analytics",
    description: "Dashboards, portfolio reports, custom reports, exports",
    category: "compliance",
    isCore: false,
    dependsOn: [],
    icon: "BarChart3",
  },

  // ── Communication ─────────────────────────────────────────
  notifications: {
    id: "notifications",
    name: "Notifications & Communication",
    description: "SMS, email, WhatsApp, notification templates",
    category: "communication",
    isCore: false,
    dependsOn: [],
    icon: "Bell",
  },

  // ── Documents ─────────────────────────────────────────────
  documents: {
    id: "documents",
    name: "Document Management",
    description: "Upload, templates, versioning, expiry alerts",
    category: "documents",
    isCore: false,
    dependsOn: [],
    icon: "FolderOpen",
  },

  // ── HR & Internal ─────────────────────────────────────────
  hr: {
    id: "hr",
    name: "Employee & HR Management",
    description: "Staff register, attendance, targets, performance",
    category: "hr",
    isCore: false,
    dependsOn: [],
    icon: "BadgeCheck",
  },
  "task-workflow": {
    id: "task-workflow",
    name: "Task & Workflow Management",
    description: "Tasks, approvals, escalations, workflow templates",
    category: "hr",
    isCore: false,
    dependsOn: [],
    icon: "ListTodo",
  },

  // ── Integrations & Automation ─────────────────────────────
  "payment-automation": {
    id: "payment-automation",
    name: "Payment Automation (NACH/UPI)",
    description: "e-NACH mandates, UPI AutoPay, bounce handling",
    category: "integrations",
    isCore: false,
    dependsOn: ["loan-management"],
    icon: "CreditCard",
  },
  "account-aggregator": {
    id: "account-aggregator",
    name: "Account Aggregator",
    description: "Consent-based bank statement and financial data fetch",
    category: "integrations",
    isCore: false,
    dependsOn: ["loan-origination"],
    icon: "Link",
  },
  esign: {
    id: "esign",
    name: "eSign & Digital Signature",
    description: "Aadhaar eSign, DSC for loan agreements",
    category: "integrations",
    isCore: false,
    dependsOn: ["documents"],
    icon: "PenTool",
  },
  estamping: {
    id: "estamping",
    name: "e-Stamping",
    description: "Digital stamp duty via NeSL/SHCIL",
    category: "integrations",
    isCore: false,
    dependsOn: ["loan-origination"],
    icon: "Stamp",
  },
  "co-lending": {
    id: "co-lending",
    name: "Co-Lending & Loan Assignment",
    description: "Co-originate with banks, loan securitization",
    category: "integrations",
    isCore: false,
    dependsOn: ["loan-management", "accounting"],
    icon: "Handshake",
  },
  insurance: {
    id: "insurance",
    name: "Credit Life Insurance",
    description: "Policy tracking, premiums, claims",
    category: "integrations",
    isCore: false,
    dependsOn: ["loan-management"],
    icon: "Shield",
  },
  "dsa-partner": {
    id: "dsa-partner",
    name: "DSA / Partner Channel",
    description: "Agent management, commissions, partner API",
    category: "integrations",
    isCore: false,
    dependsOn: ["lead-management", "loan-origination"],
    icon: "Briefcase",
  },
  ews: {
    id: "ews",
    name: "Early Warning System",
    description: "Stress scoring, proactive alerts, continuous monitoring",
    category: "integrations",
    isCore: false,
    dependsOn: ["loan-management"],
    icon: "AlertTriangle",
  },
} as const;

export const MODULE_IDS = Object.keys(MODULE_DEFINITIONS);

/**
 * Check if enabling a module is valid (all dependencies are enabled).
 */
export function canEnableModule(
  moduleId: string,
  enabledModules: Set<string>
): { valid: boolean; missingDeps: string[] } {
  const module = MODULE_DEFINITIONS[moduleId];
  if (!module) return { valid: false, missingDeps: [] };

  const missingDeps = module.dependsOn.filter((dep) => !enabledModules.has(dep));
  return { valid: missingDeps.length === 0, missingDeps };
}

/**
 * Check if disabling a module is valid (no other enabled modules depend on it).
 */
export function canDisableModule(
  moduleId: string,
  enabledModules: Set<string>
): { valid: boolean; dependents: string[] } {
  const module = MODULE_DEFINITIONS[moduleId];
  if (!module || module.isCore) return { valid: false, dependents: [] };

  const dependents = MODULE_IDS.filter(
    (id) =>
      enabledModules.has(id) &&
      MODULE_DEFINITIONS[id].dependsOn.includes(moduleId)
  );
  return { valid: dependents.length === 0, dependents };
}
