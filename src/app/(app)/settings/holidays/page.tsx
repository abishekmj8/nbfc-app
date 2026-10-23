import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HolidayForm } from "./holiday-form";

export default async function HolidaysPage() {
  const user = await requirePermission("holidays", "VIEW");

  const holidays = await prisma.holiday.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { date: "asc" },
  });

  const upcoming = holidays.filter((h) => h.date >= new Date());
  const past = holidays.filter((h) => h.date < new Date());

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Holidays</h1>

      <HolidayForm />

      {upcoming.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase text-gray-500 mb-3">Upcoming ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.map((h) => (
              <Card key={h.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{h.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(h.date)}</p>
                  </div>
                  <Badge variant="outline">{h.type}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase text-gray-500 mb-3">Past ({past.length})</h2>
          <div className="space-y-2 opacity-60">
            {past.map((h) => (
              <Card key={h.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{h.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(h.date)}</p>
                  </div>
                  <Badge variant="outline">{h.type}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {holidays.length === 0 && (
        <p className="text-center text-gray-500 py-12 mt-6">No holidays configured</p>
      )}
    </div>
  );
}
