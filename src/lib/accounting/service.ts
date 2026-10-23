"use server";

import { prisma } from "@/lib/db/prisma";

/**
 * Default Chart of Accounts for an NBFC.
 */
export const DEFAULT_COA = [
  // Assets
  { code: "1000", name: "Assets", type: "ASSET", level: 0 },
  { code: "1100", name: "Cash and Bank Balances", type: "ASSET", level: 1, parent: "1000" },
  { code: "1110", name: "Cash in Hand", type: "ASSET", level: 2, parent: "1100" },
  { code: "1120", name: "Bank Accounts", type: "ASSET", level: 2, parent: "1100" },
  { code: "1200", name: "Loan Portfolio", type: "ASSET", level: 1, parent: "1000" },
  { code: "1210", name: "Loans Outstanding - Standard", type: "ASSET", level: 2, parent: "1200" },
  { code: "1220", name: "Loans Outstanding - Sub-standard", type: "ASSET", level: 2, parent: "1200" },
  { code: "1230", name: "Loans Outstanding - Doubtful", type: "ASSET", level: 2, parent: "1200" },
  { code: "1300", name: "Interest Receivable", type: "ASSET", level: 1, parent: "1000" },
  { code: "1400", name: "Other Receivables", type: "ASSET", level: 1, parent: "1000" },
  { code: "1500", name: "Fixed Assets", type: "ASSET", level: 1, parent: "1000" },
  { code: "1600", name: "Investments", type: "ASSET", level: 1, parent: "1000" },
  // Liabilities
  { code: "2000", name: "Liabilities", type: "LIABILITY", level: 0 },
  { code: "2100", name: "Borrowings", type: "LIABILITY", level: 1, parent: "2000" },
  { code: "2110", name: "Bank Borrowings", type: "LIABILITY", level: 2, parent: "2100" },
  { code: "2120", name: "NCDs / Commercial Paper", type: "LIABILITY", level: 2, parent: "2100" },
  { code: "2200", name: "Interest Payable", type: "LIABILITY", level: 1, parent: "2000" },
  { code: "2300", name: "Other Payables", type: "LIABILITY", level: 1, parent: "2000" },
  { code: "2400", name: "Provisions for NPAs", type: "LIABILITY", level: 1, parent: "2000" },
  { code: "2500", name: "GST Payable", type: "LIABILITY", level: 1, parent: "2000" },
  // Equity
  { code: "3000", name: "Equity", type: "EQUITY", level: 0 },
  { code: "3100", name: "Share Capital", type: "EQUITY", level: 1, parent: "3000" },
  { code: "3200", name: "Reserves and Surplus", type: "EQUITY", level: 1, parent: "3000" },
  { code: "3300", name: "Retained Earnings", type: "EQUITY", level: 1, parent: "3000" },
  // Income
  { code: "4000", name: "Income", type: "INCOME", level: 0 },
  { code: "4100", name: "Interest Income on Loans", type: "INCOME", level: 1, parent: "4000" },
  { code: "4200", name: "Processing Fee Income", type: "INCOME", level: 1, parent: "4000" },
  { code: "4300", name: "Penal Charges Income", type: "INCOME", level: 1, parent: "4000" },
  { code: "4400", name: "Other Fee Income", type: "INCOME", level: 1, parent: "4000" },
  { code: "4500", name: "Investment Income", type: "INCOME", level: 1, parent: "4000" },
  // Expenses
  { code: "5000", name: "Expenses", type: "EXPENSE", level: 0 },
  { code: "5100", name: "Interest Expense on Borrowings", type: "EXPENSE", level: 1, parent: "5000" },
  { code: "5200", name: "Employee Costs", type: "EXPENSE", level: 1, parent: "5000" },
  { code: "5300", name: "Provisioning Expense", type: "EXPENSE", level: 1, parent: "5000" },
  { code: "5400", name: "Administrative Expenses", type: "EXPENSE", level: 1, parent: "5000" },
  { code: "5500", name: "Depreciation", type: "EXPENSE", level: 1, parent: "5000" },
  { code: "5600", name: "Bad Debts Written Off", type: "EXPENSE", level: 1, parent: "5000" },
] as const;

/**
 * Seed the default Chart of Accounts for a company.
 */
export async function seedChartOfAccounts(companyId: string) {
  const codeToId: Record<string, string> = {};

  for (const account of DEFAULT_COA) {
    const parentCode = "parent" in account ? (account as { parent: string }).parent : null;
    const parentId = parentCode ? codeToId[parentCode] : null;
    const created = await prisma.chartOfAccount.create({
      data: {
        companyId,
        code: account.code,
        name: account.name,
        accountType: account.type,
        level: account.level,
        parentId,
        isSystem: true,
      },
    });
    codeToId[account.code] = created.id;
  }

  return codeToId;
}

/**
 * Generate trial balance: sum of all debits and credits per account.
 */
export async function generateTrialBalance(companyId: string, asOfDate?: Date) {
  const dateFilter = asOfDate ? { lte: asOfDate } : undefined;

  const accounts = await prisma.chartOfAccount.findMany({
    where: { companyId, isActive: true },
    orderBy: { code: "asc" },
  });

  const balances: Array<{
    code: string;
    name: string;
    accountType: string;
    level: number;
    totalDebit: bigint;
    totalCredit: bigint;
    balance: bigint;
  }> = [];

  for (const account of accounts) {
    const aggregation = await prisma.journalEntryLine.aggregate({
      where: {
        accountId: account.id,
        journalEntry: {
          companyId,
          status: "POSTED",
          ...(dateFilter && { date: dateFilter }),
        },
      },
      _sum: { debitAmount: true, creditAmount: true },
    });

    const totalDebit = aggregation._sum.debitAmount ?? 0n;
    const totalCredit = aggregation._sum.creditAmount ?? 0n;

    // For assets/expenses: debit balance (debit - credit)
    // For liabilities/income/equity: credit balance (credit - debit)
    const isDebitNormal = ["ASSET", "EXPENSE"].includes(account.accountType);
    const balance = isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit;

    if (totalDebit !== 0n || totalCredit !== 0n) {
      balances.push({
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        level: account.level,
        totalDebit,
        totalCredit,
        balance,
      });
    }
  }

  const totalDebits = balances.reduce((s, b) => s + b.totalDebit, 0n);
  const totalCredits = balances.reduce((s, b) => s + b.totalCredit, 0n);
  const isBalanced = totalDebits === totalCredits;

  return { balances, totalDebits, totalCredits, isBalanced };
}

/**
 * Generate Profit & Loss statement.
 */
export async function generateProfitAndLoss(companyId: string, fromDate: Date, toDate: Date) {
  const accounts = await prisma.chartOfAccount.findMany({
    where: { companyId, isActive: true, accountType: { in: ["INCOME", "EXPENSE"] } },
    orderBy: { code: "asc" },
  });

  const items: Array<{
    code: string;
    name: string;
    accountType: string;
    amount: bigint;
  }> = [];

  let totalIncome = 0n;
  let totalExpense = 0n;

  for (const account of accounts) {
    const agg = await prisma.journalEntryLine.aggregate({
      where: {
        accountId: account.id,
        journalEntry: {
          companyId,
          status: "POSTED",
          date: { gte: fromDate, lte: toDate },
        },
      },
      _sum: { debitAmount: true, creditAmount: true },
    });

    const debit = agg._sum.debitAmount ?? 0n;
    const credit = agg._sum.creditAmount ?? 0n;
    const amount = account.accountType === "INCOME" ? credit - debit : debit - credit;

    if (amount !== 0n) {
      items.push({ code: account.code, name: account.name, accountType: account.accountType, amount });
      if (account.accountType === "INCOME") totalIncome += amount;
      else totalExpense += amount;
    }
  }

  return {
    items,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    period: { from: fromDate, to: toDate },
  };
}

/**
 * Generate Balance Sheet.
 */
export async function generateBalanceSheet(companyId: string, asOfDate: Date) {
  const accounts = await prisma.chartOfAccount.findMany({
    where: { companyId, isActive: true, accountType: { in: ["ASSET", "LIABILITY", "EQUITY"] } },
    orderBy: { code: "asc" },
  });

  const items: Array<{
    code: string;
    name: string;
    accountType: string;
    balance: bigint;
  }> = [];

  let totalAssets = 0n;
  let totalLiabilities = 0n;
  let totalEquity = 0n;

  for (const account of accounts) {
    const agg = await prisma.journalEntryLine.aggregate({
      where: {
        accountId: account.id,
        journalEntry: {
          companyId,
          status: "POSTED",
          date: { lte: asOfDate },
        },
      },
      _sum: { debitAmount: true, creditAmount: true },
    });

    const debit = agg._sum.debitAmount ?? 0n;
    const credit = agg._sum.creditAmount ?? 0n;
    const balance = account.accountType === "ASSET" ? debit - credit : credit - debit;

    if (balance !== 0n) {
      items.push({ code: account.code, name: account.name, accountType: account.accountType, balance });
      if (account.accountType === "ASSET") totalAssets += balance;
      else if (account.accountType === "LIABILITY") totalLiabilities += balance;
      else totalEquity += balance;
    }
  }

  return {
    items,
    totalAssets,
    totalLiabilities,
    totalEquity,
    liabilitiesPlusEquity: totalLiabilities + totalEquity,
    isBalanced: totalAssets === totalLiabilities + totalEquity,
    asOfDate,
  };
}
