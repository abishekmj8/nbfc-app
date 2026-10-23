"use client";

import { useActionState } from "react";
import { createProductAction, type ProductFormState } from "@/lib/loan-products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initial: ProductFormState = {};

export default function NewLoanProductPage() {
  const [state, formAction, isPending] = useActionState(createProductAction, initial);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">New Loan Product</h1>

      {state.error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">{state.error}</div>
      )}

      <form action={formAction} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Product Name *</Label><Input name="name" required className="mt-1" placeholder="Personal Loan" /></div>
              <div><Label>Code *</Label><Input name="code" required className="mt-1 uppercase" placeholder="PL" maxLength={20} /></div>
            </div>
            <div><Label>Description</Label><Textarea name="description" className="mt-1" rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Product Type *</Label>
                <Select name="productType" required className="mt-1">
                  <option value="TERM_LOAN">Term Loan</option>
                  <option value="EMI">EMI</option>
                  <option value="BULLET">Bullet</option>
                  <option value="FLEXI">Flexi</option>
                  <option value="OVERDRAFT">Overdraft</option>
                </Select>
              </div>
              <div>
                <Label>Collateral</Label>
                <Select name="collateralType" className="mt-1">
                  <option value="NONE">None (Unsecured)</option>
                  <option value="GOLD">Gold</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="PROPERTY">Property</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div>
                <Label>EMI Rounding</Label>
                <Select name="emiRounding" className="mt-1">
                  <option value="ROUND_UP_RUPEE">Round up to rupee</option>
                  <option value="ROUND_NEAREST_PAISA">Nearest paisa</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Interest Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Interest Method *</Label>
                <Select name="interestMethod" required className="mt-1">
                  <option value="DAILY_REDUCING">Daily Reducing (RBI default)</option>
                  <option value="MONTHLY_REDUCING">Monthly Reducing</option>
                  <option value="FLAT_RATE">Flat Rate (legacy)</option>
                </Select>
              </div>
              <div>
                <Label>Day Count</Label>
                <Select name="dayCountConvention" className="mt-1">
                  <option value="ACTUAL_ACTUAL">Actual/Actual (RBI default)</option>
                  <option value="THIRTY_360">30/360</option>
                </Select>
              </div>
              <div>
                <Label>Interest Type</Label>
                <Select name="interestType" className="mt-1">
                  <option value="FIXED">Fixed</option>
                  <option value="FLOATING">Floating</option>
                  <option value="HYBRID">Hybrid</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Min Rate (% p.a.) *</Label><Input name="minInterestRate" type="number" step="0.01" required className="mt-1" placeholder="10.00" /></div>
              <div><Label>Max Rate (% p.a.) *</Label><Input name="maxInterestRate" type="number" step="0.01" required className="mt-1" placeholder="24.00" /></div>
              <div><Label>Default Rate (% p.a.) *</Label><Input name="defaultInterestRate" type="number" step="0.01" required className="mt-1" placeholder="12.00" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Limits & Fees</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min Tenure (months) *</Label><Input name="minTenureMonths" type="number" required className="mt-1" defaultValue="1" /></div>
              <div><Label>Max Tenure (months) *</Label><Input name="maxTenureMonths" type="number" required className="mt-1" defaultValue="60" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min Amount (₹) *</Label><Input name="minAmount" type="number" required className="mt-1" placeholder="10000" /></div>
              <div><Label>Max Amount (₹) *</Label><Input name="maxAmount" type="number" required className="mt-1" placeholder="1000000" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Penal Rate Additional (%)</Label><Input name="penalRateAdditional" type="number" step="0.01" className="mt-1" placeholder="2.00" /></div>
              <div><Label>Prepayment Fee (%)</Label><Input name="prepaymentFeePercent" type="number" step="0.01" className="mt-1" placeholder="0.00" /></div>
              <div><Label>Processing Fee (%)</Label><Input name="processingFeePercent" type="number" step="0.01" className="mt-1" placeholder="1.00" /></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Product"}</Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
