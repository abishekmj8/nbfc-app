import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CompanySettingsPage() {
  const user = await requirePermission("company", "VIEW");

  const company = await prisma.company.findFirst({
    where: { id: user.companyId },
  });

  if (!company) return <p className="p-8 text-red-500">Company not found</p>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Company Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Your company registration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Company Name" value={company.name} />
            <Row label="RBI Registration" value={company.rbiRegistrationNo ?? "Not set"} />
            <Row label="PAN" value={company.panNumber ?? "Not set"} />
            <Row label="GST" value={company.gstNumber ?? "Not set"} />
            <Row label="SBR Layer" value={company.sbrLayer} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Email" value={company.email ?? "Not set"} />
            <Row label="Phone" value={company.phone ?? "Not set"} />
            <Row label="Website" value={company.website ?? "Not set"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Address" value={company.address ?? "Not set"} />
            <Row label="City" value={company.city ?? "—"} />
            <Row label="State" value={company.state ?? "—"} />
            <Row label="Pincode" value={company.pincode ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="h-10 w-10 rounded" style={{ backgroundColor: company.primaryColor }} />
            <div className="h-10 w-10 rounded" style={{ backgroundColor: company.accentColor }} />
            <span className="text-sm text-gray-500">
              Primary: {company.primaryColor} · Accent: {company.accentColor}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Financial Year</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <Row label="FY Start Month" value={`Month ${company.financialYearStart} (${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][company.financialYearStart - 1]})`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
    </div>
  );
}
