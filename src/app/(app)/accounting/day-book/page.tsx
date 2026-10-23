import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DayBookPage({ searchParams }: PageProps) {
  const user = await requirePermission("accounting", "VIEW");
  const params = await searchParams;

  const selectedDate = params.date ? new Date(params.date) : new Date();
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const entries = await prisma.journalEntry.findMany({
    where: {
      companyId: user.companyId,
      date: { gte: dayStart, lte: dayEnd },
      status: "POSTED",
    },
    include: {
      lines: {
        include: {
          debitAccount: { select: { code: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalAmount = entries.reduce((s, e) => s + Number(e.totalAmount), 0);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Day Book</h1>
          <p className="text-sm text-gray-500 mt-1">{formatDate(selectedDate)}</p>
        </div>
        <form className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={selectedDate.toISOString().split("T")[0]}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Go</button>
        </form>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        {entries.length} entries · Total: {formatMoney(BigInt(totalAmount))}
      </div>

      {entries.length > 0 ? (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{entry.entryNumber}</CardTitle>
                    <Badge variant="outline">{entry.status}</Badge>
                  </div>
                  <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                    {formatMoney(entry.totalAmount)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{entry.narration}</p>
                {entry.reference && <p className="text-xs text-gray-400">Ref: {entry.reference}</p>}
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="text-sm">
                          <span className="text-gray-400 font-mono mr-2">{line.debitAccount.code}</span>
                          {line.debitAccount.name}
                          {line.narration && <span className="text-gray-400 ml-2">({line.narration})</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {line.debitAmount > 0n ? formatMoney(line.debitAmount) : ""}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {line.creditAmount > 0n ? formatMoney(line.creditAmount) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No journal entries for {formatDate(selectedDate)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
