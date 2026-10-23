"use client";

import { useActionState, useState } from "react";
import { createLeadAction, type LeadFormState } from "@/lib/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

interface Props {
  products: Array<{ id: string; name: string; code: string }>;
}

const initialState: LeadFormState = {};

export function LeadCreateForm({ products }: Props) {
  const [state, formAction, isPending] = useActionState(createLeadAction, initialState);
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return <Button onClick={() => setShowForm(true)}><UserPlus size={16} /> New Lead</Button>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>New Lead</CardTitle></CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">{state.error}</div>
        )}
        {state.success && (
          <div className="mb-3 p-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">Lead created</div>
        )}

        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Customer Name *</Label><Input name="customerName" required className="mt-1" /></div>
            <div><Label>Phone *</Label><Input name="phone" required className="mt-1" /></div>
            <div><Label>Email</Label><Input name="email" type="email" className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Source</Label>
              <Select name="source" required className="mt-1">
                <option value="WALK_IN">Walk-in</option>
                <option value="PHONE">Phone</option>
                <option value="WEB">Web</option>
                <option value="DSA">DSA</option>
                <option value="REFERRAL">Referral</option>
              </Select>
            </div>
            <div>
              <Label>Product</Label>
              <Select name="loanProductId" className="mt-1">
                <option value="">Select Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
              </Select>
            </div>
            <div><Label>Amount (₹)</Label><Input name="requestedAmount" type="number" className="mt-1" /></div>
          </div>
          <div><Label>Notes</Label><Textarea name="notes" rows={2} className="mt-1" /></div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Lead"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
