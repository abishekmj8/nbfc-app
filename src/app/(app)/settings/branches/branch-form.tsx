"use client";

import { useActionState, useState } from "react";
import { createBranchAction, type BranchFormState } from "@/lib/company/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const initialState: BranchFormState = {};

export function BranchForm() {
  const [state, formAction, isPending] = useActionState(createBranchAction, initialState);
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Branch</Button>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>New Branch</CardTitle></CardHeader>
      <CardContent>
        {state.error && <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">{state.error}</div>}
        {state.success && <div className="mb-3 p-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">Branch created</div>}

        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Branch Name *</Label><Input name="name" required className="mt-1" /></div>
            <div><Label>Code *</Label><Input name="code" required maxLength={10} placeholder="e.g., MUM01" className="mt-1 uppercase" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>City</Label><Input name="city" className="mt-1" /></div>
            <div><Label>State</Label><Input name="state" className="mt-1" /></div>
            <div><Label>Pincode</Label><Input name="pincode" className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Branch"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
