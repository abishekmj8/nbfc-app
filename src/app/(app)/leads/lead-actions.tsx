"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatusAction, convertLeadAction } from "@/lib/leads/actions";

interface Props {
  leadId: string;
  status: string;
  hasProduct: boolean;
}

export function LeadActions({ leadId, status, hasProduct }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (status === "CONVERTED" || status === "LOST" || status === "REJECTED") {
    return null;
  }

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateLeadStatusAction(leadId, newStatus);
    });
  }

  function handleConvert() {
    startTransition(async () => {
      const result = await convertLeadAction(leadId);
      if (result.applicationId) {
        router.push(`/loans/applications/${result.applicationId}`);
      }
    });
  }

  return (
    <div className="flex gap-1">
      {status === "NEW" && (
        <button
          onClick={() => handleStatusChange("CONTACTED")}
          disabled={isPending}
          className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800"
        >
          Contacted
        </button>
      )}
      {(status === "CONTACTED" || status === "INTERESTED") && hasProduct && (
        <button
          onClick={handleConvert}
          disabled={isPending}
          className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800"
        >
          {isPending ? "..." : "Convert"}
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          onClick={() => handleStatusChange("REJECTED")}
          disabled={isPending}
          className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
        >
          Reject
        </button>
      )}
    </div>
  );
}
