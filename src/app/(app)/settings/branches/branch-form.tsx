"use client";

import { useActionState, useState } from "react";
import { createBranchAction, type BranchFormState } from "@/lib/company/actions";

const initialState: BranchFormState = {};

export function BranchForm() {
  const [state, formAction, isPending] = useActionState(createBranchAction, initialState);
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        Add Branch
      </button>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">New Branch</h3>

      {state.error && (
        <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="mb-3 p-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">
          Branch created successfully
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Branch Name *</label>
            <input id="name" name="name" required className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            {state.fieldErrors?.name?.map((e) => <p key={e} className="text-xs text-red-500 mt-1">{e}</p>)}
          </div>
          <div>
            <label htmlFor="code" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Code *</label>
            <input id="code" name="code" required maxLength={10} placeholder="e.g., MUM01" className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 uppercase" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input name="city" placeholder="City" className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          <input name="state" placeholder="State" className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          <input name="pincode" placeholder="Pincode" className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors"
          >
            {isPending ? "Creating..." : "Create Branch"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
