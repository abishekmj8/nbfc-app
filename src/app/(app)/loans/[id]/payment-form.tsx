"use client";

import { useActionState, useState } from "react";
import { recordPaymentAction, type PaymentFormState } from "@/lib/loan-management/payment-service";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";

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
    return <Button onClick={() => setShowForm(true)}><IndianRupee size={16} /> Record Payment</Button>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
        <CardDescription>EMI Amount: {formatMoney(emiAmount)}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.error && <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">{state.error}</div>}
        {state.success && <div className="mb-3 p-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">Payment recorded</div>}

        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (₹) *</Label><Input name="amount" type="number" step="0.01" required defaultValue={(Number(emiAmount) / 100).toFixed(2)} className="mt-1" /></div>
            <div>
              <Label>Mode *</Label>
              <Select name="mode" required className="mt-1">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="NACH">NACH</option>
                <option value="CHEQUE">Cheque</option>
                <option value="RTGS">RTGS</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date *</Label><Input name="receivedDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="mt-1" /></div>
            <div><Label>Reference</Label><Input name="referenceNumber" placeholder="UTR / Cheque No." className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>{isPending ? "Recording..." : "Record Payment"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
