"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/utils/money";

interface Props {
  loanAccountId: string;
  status: string;
  outstandingPrincipal: bigint;
  interestRateBps: number;
}

export function LoanActions({ loanAccountId, status, outstandingPrincipal, interestRateBps }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        title={`Outstanding: ${formatMoney(outstandingPrincipal)} at ${(interestRateBps / 100).toFixed(2)}%`}
      >
        Foreclosure Quote
      </button>
    </div>
  );
}
