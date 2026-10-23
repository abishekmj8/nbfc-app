import { requirePermission } from "@/lib/auth/rbac";
import { generateTrialBalance } from "@/lib/accounting/service";
import { formatMoney } from "@/lib/utils/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TrialBalancePage() {
  const user = await requirePermission("accounting", "VIEW");
  const tb = await generateTrialBalance(user.companyId);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trial Balance</h1>
        <Badge variant={tb.isBalanced ? "success" : "destructive"}>
          {tb.isBalanced ? "Balanced" : "NOT BALANCED"}
        </Badge>
      </div>

      {tb.balances.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No journal entries yet. Trial balance will appear after loan disbursements and payments.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tb.balances.map((b) => (
                  <TableRow key={b.code}>
                    <TableCell className="font-mono text-gray-500">{b.code}</TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell><Badge variant="outline">{b.accountType}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(b.totalDebit)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(b.totalCredit)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatMoney(b.balance < 0n ? -b.balance : b.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 dark:bg-gray-900 font-bold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(tb.totalDebits)}</TableCell>
                  <TableCell className="text-right font-mono">{formatMoney(tb.totalCredits)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
