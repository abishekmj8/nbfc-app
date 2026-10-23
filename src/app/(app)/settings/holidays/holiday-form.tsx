"use client";

import { useActionState, useState } from "react";
import { createHolidayAction, type HolidayFormState } from "@/lib/company/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initial: HolidayFormState = {};

export function HolidayForm() {
  const [state, formAction, isPending] = useActionState(createHolidayAction, initial);
  const [show, setShow] = useState(false);

  if (!show) return <Button onClick={() => setShow(true)}>Add Holiday</Button>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      {state.error && <div className="mb-3 p-2 rounded bg-red-50 text-red-700 text-sm">{state.error}</div>}
      {state.success && <div className="mb-3 p-2 rounded bg-green-50 text-green-700 text-sm">Holiday added</div>}

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Holiday Name *</Label><Input name="name" required className="mt-1" /></div>
          <div><Label>Date *</Label><Input name="date" type="date" required className="mt-1" /></div>
          <div>
            <Label>Type</Label>
            <Select name="type" className="mt-1">
              <option value="CUSTOM">Custom</option>
              <option value="NATIONAL">National</option>
              <option value="STATE">State</option>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending} size="sm">{isPending ? "Adding..." : "Add Holiday"}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShow(false)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
