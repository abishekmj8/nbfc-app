"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitApplicationAction,
  approveApplicationAction,
  rejectApplicationAction,
  disburseAction,
  meetConditionAction,
} from "@/lib/loan-origination/actions";

interface Props {
  applicationId: string;
  status: string;
  sanctionConditions: Array<{
    id: string;
    condition: string;
    isMandatory: boolean;
    isMet: boolean;
  }>;
}

export function ApplicationActions({ applicationId, status, sanctionConditions }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitApplicationAction(applicationId);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleApprove() {
    const remarks = prompt("Approval remarks (optional):");
    startTransition(async () => {
      const result = await approveApplicationAction(applicationId, remarks ?? undefined);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleReject() {
    const reason = prompt("Rejection reason (required):");
    if (!reason) return;
    startTransition(async () => {
      const result = await rejectApplicationAction(applicationId, reason, "MANUAL_REJECTION");
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleDisburse() {
    if (!confirm("Are you sure you want to disburse this loan?")) return;
    startTransition(async () => {
      const result = await disburseAction(applicationId, "NEFT");
      if (result.error) alert(result.error);
      else if (result.loanAccountId) {
        router.push(`/loans/${result.loanAccountId}`);
      }
    });
  }

  function handleMeetCondition(conditionId: string) {
    startTransition(async () => {
      await meetConditionAction(conditionId);
      router.refresh();
    });
  }

  const allConditionsMet = sanctionConditions
    .filter((c) => c.isMandatory)
    .every((c) => c.isMet);

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && (
        <button onClick={handleSubmit} disabled={isPending}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md">
          {isPending ? "Submitting..." : "Submit for Review"}
        </button>
      )}

      {(status === "SUBMITTED" || status === "UNDER_REVIEW") && (
        <>
          <button onClick={handleApprove} disabled={isPending}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md">
            Approve & Sanction
          </button>
          <button onClick={handleReject} disabled={isPending}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md">
            Reject
          </button>
        </>
      )}

      {status === "SANCTIONED" && (
        <>
          {/* Condition meet buttons */}
          {sanctionConditions.filter((c) => !c.isMet).map((c) => (
            <button key={c.id} onClick={() => handleMeetCondition(c.id)} disabled={isPending}
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
              Mark: {c.condition.substring(0, 30)}...
            </button>
          ))}

          <button onClick={handleDisburse} disabled={isPending || !allConditionsMet}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-md"
            title={!allConditionsMet ? "Meet all mandatory conditions first" : "Disburse loan"}>
            {isPending ? "Disbursing..." : "Disburse"}
          </button>
        </>
      )}

      {status === "DISBURSED" && (
        <span className="px-4 py-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 rounded-md">
          Loan disbursed successfully
        </span>
      )}

      {status === "REJECTED" && (
        <span className="px-4 py-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 rounded-md">
          Application rejected
        </span>
      )}
    </div>
  );
}
