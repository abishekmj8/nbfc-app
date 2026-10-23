"use client";

import { useActionState, useState } from "react";
import { recordPaymentAction, type PaymentFormState } from "@/lib/loan-management/payment-service";
import { formatMoney } from "@/lib/utils/money";

interface Props {
  loanAccountId: string;
  emiAmount: bigint;
}

const initialState: PaymentFormState = {};

export function PaymentForm({ loanAccountId, emiAmount }: Props) {
  const boundAction = recordPaymentAction.bind(null, loanAccountId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
        Record Payment
      </button>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 w-full max-w-md">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Record Payment</h3>
      <p className="text-xs text-gray-500 mb-3">EMI Amount: {formatMoney(emiAmount)}</p>

      {state.error && <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">{state.error}</div>}
      {state.success && <div className="mb-3 p-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">Payment recorded</div>}

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount (₹) *</label>
            <input name="amount" type="number" step="0.01" required
              defaultValue={(Number(emiAmount) / 100).toFixed(2)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mode *</label>
            <select name="mode" required className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="NEFT">NEFT</option>
              <option value="NACH">NACH</option>
              <option value="CHEQUE">Cheque</option>
              <option value="RTGS">RTGS</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date *</label>
            <input name="receivedDate" type="date" required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Reference</label>
            <input name="referenceNumber" placeholder="UTR / Cheque No." className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded">
            {isPending ? "Recording..." : "Record Payment"}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
