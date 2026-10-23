import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload, DocumentList } from "@/components/shared/file-upload";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requirePermission("loans", "VIEW");

  const customer = await prisma.customer.findFirst({
    where: { id, companyId: user.companyId, deletedAt: null },
    include: {
      identities: true,
      addresses: true,
      bankAccounts: true,
    },
  });

  if (!customer) notFound();

  const [loans, documents] = await Promise.all([
    prisma.loanAccount.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.document.findMany({
      where: { entityType: "CUSTOMER", entityId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, documentType: true, fileName: true, status: true, createdAt: true },
    }),
  ]);

  const kycVariant = customer.kycStatus === "VERIFIED" ? "success"
    : customer.kycStatus === "PARTIAL" ? "warning"
    : customer.kycStatus === "EXPIRED" ? "destructive"
    : "outline";

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {customer.customerCode} &middot; {customer.phone}
            {customer.email && ` · ${customer.email}`}
          </p>
        </div>
        <Badge variant={kycVariant}>KYC: {customer.kycStatus}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Gender" value={customer.gender ?? "—"} />
            <InfoRow label="Date of Birth" value={customer.dateOfBirth ? formatDate(customer.dateOfBirth) : "—"} />
            <InfoRow label="Occupation" value={customer.occupation ?? "—"} />
            <InfoRow label="Monthly Income" value={customer.monthlyIncome ? formatMoney(customer.monthlyIncome) : "—"} />
            <InfoRow label="Risk Category" value={customer.riskCategory} />
          </CardContent>
        </Card>

        {/* Identity Documents */}
        <Card>
          <CardHeader><CardTitle>Identity Documents</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer.identities.length > 0 ? (
              customer.identities.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-1">
                  <span className="text-gray-600 dark:text-gray-400">{doc.documentType}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{doc.maskedNumber ?? "—"}</span>
                    <Badge variant={doc.isVerified ? "success" : "outline"} className="text-xs">
                      {doc.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No identity documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {customer.addresses.length > 0 ? (
              customer.addresses.map((addr) => (
                <div key={addr.id} className="mb-3">
                  <Badge variant="outline" className="mb-1 text-xs">{addr.type}</Badge>
                  <p className="text-gray-900 dark:text-gray-100">{addr.addressLine1}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No address on file</p>
            )}
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card>
          <CardHeader><CardTitle>Bank Accounts</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {customer.bankAccounts.length > 0 ? (
              customer.bankAccounts.map((bank) => (
                <div key={bank.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{bank.bankName}</p>
                    <p className="text-gray-500">IFSC: {bank.ifscCode} · {bank.accountType}</p>
                  </div>
                  <span className="font-mono text-gray-600 dark:text-gray-400">{bank.maskedAccount}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No bank accounts on file</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KYC Documents */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>KYC Documents ({documents.length})</CardTitle>
            <div className="flex gap-2">
              <FileUpload entityType="CUSTOMER" entityId={customer.id} documentType="PAN_CARD" label="Upload PAN" />
              <FileUpload entityType="CUSTOMER" entityId={customer.id} documentType="AADHAAR" label="Upload Aadhaar" />
              <FileUpload entityType="CUSTOMER" entityId={customer.id} documentType="ADDRESS_PROOF" label="Upload Address Proof" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DocumentList documents={documents.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() }))} />
        </CardContent>
      </Card>

      {/* Loans */}
      {loans.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Loan Accounts ({loans.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loans.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <Link href={`/loans/${loan.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {loan.accountNumber}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {formatMoney(loan.principalAmount)} · {loan.tenureMonths}mo · {(loan.interestRateBps / 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={loan.status === "ACTIVE" ? "success" : loan.status === "NPA" ? "destructive" : "outline"}>
                      {loan.status}
                    </Badge>
                    {loan.dpd > 0 && <p className="text-xs text-red-500 mt-1">DPD: {loan.dpd}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
