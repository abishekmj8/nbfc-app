"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface CustomerRow {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  email: string | null;
  pan: string;
  kycStatus: string;
  createdAt: string;
}

const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: "customerCode",
    header: "Code",
    cell: ({ row }) => (
      <Link href={`/customers/${row.original.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
        {row.getValue("customerCode")}
      </Link>
    ),
  },
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <a href={`tel:${row.getValue("phone")}`} className="text-gray-600 dark:text-gray-400 hover:text-blue-600">
        {row.getValue("phone")}
      </a>
    ),
  },
  { accessorKey: "pan", header: "PAN", cell: ({ row }) => (
    <span className="font-mono text-gray-500">{row.getValue("pan")}</span>
  )},
  {
    accessorKey: "kycStatus",
    header: "KYC",
    cell: ({ row }) => {
      const status = row.getValue("kycStatus") as string;
      const variant = status === "VERIFIED" ? "success" : status === "PARTIAL" ? "warning" : status === "EXPIRED" ? "destructive" : "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString("en-IN"),
  },
];

export function CustomerTable({ data }: { data: CustomerRow[] }) {
  return <DataTable columns={columns} data={data} emptyMessage="No customers yet. Create your first customer." />;
}
