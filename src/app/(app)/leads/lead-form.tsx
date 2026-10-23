"use client";

import { useActionState, useState } from "react";
import { createLeadAction, type LeadFormState } from "@/lib/leads/actions";

interface Props {
  products: Array<{ id: string; name: string; code: string }>;
}

const initialState: LeadFormState = {};

export function LeadCreateForm({ products }: Props) {
  const [state, formAction, isPending] = useActionState(createLeadAction, initialState);
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
      >
        New Lead
      </button>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">New Lead</h3>

      {state.error && (
        <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">{state.error}</div>
      )}
      {state.success && (
        <div className="mb-3 p-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">Lead created</div>
      )}

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input name="customerName" placeholder="Customer Name *" required className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          <input name="phone" placeholder="Phone *" required className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          <input name="email" type="email" placeholder="Email" className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <select name="source" required className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option value="WALK_IN">Walk-in</option>
            <option value="PHONE">Phone</option>
            <option value="WEB">Web</option>
            <option value="DSA">DSA</option>
            <option value="REFERRAL">Referral</option>
          </select>
          <select name="loanProductId" className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
          <input name="requestedAmount" type="number" placeholder="Amount (₹)" className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
        <textarea name="notes" placeholder="Notes" rows={2} className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded">
            {isPending ? "Creating..." : "Create Lead"}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
