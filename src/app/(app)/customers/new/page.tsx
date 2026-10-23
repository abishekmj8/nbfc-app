"use client";

import { useActionState } from "react";
import { createCustomerAction, type CustomerFormState } from "@/lib/customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: CustomerFormState = {};

export default function NewCustomerPage() {
  const [state, formAction, isPending] = useActionState(createCustomerAction, initialState);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">New Customer</h1>

      {state.error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Basic information about the customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" name="firstName" required className="mt-1" />
                {state.fieldErrors?.firstName?.map((e) => <p key={e} className="text-xs text-red-500 mt-1">{e}</p>)}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" required className="mt-1" placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" name="dateOfBirth" type="date" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select id="gender" name="gender" className="mt-1">
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" name="occupation" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income (₹)</Label>
                <Input id="monthlyIncome" name="monthlyIncome" type="number" className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="addressLine1">Address</Label>
              <Input id="addressLine1" name="addressLine1" className="mt-1" placeholder="House/Flat No., Street" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" name="pincode" className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC */}
        <Card>
          <CardHeader>
            <CardTitle>Identity (KYC)</CardTitle>
            <CardDescription>PAN is encrypted at rest. Only masked value is displayed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input id="panNumber" name="panNumber" className="mt-1 uppercase" placeholder="ABCDE1234F" maxLength={10} />
            </div>
          </CardContent>
        </Card>

        {/* Bank Account */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Account</CardTitle>
            <CardDescription>Account number is encrypted at rest.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" name="bankName" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input id="ifscCode" name="ifscCode" className="mt-1 uppercase" />
              </div>
              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <Select id="accountType" name="accountType" className="mt-1">
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                  <option value="OVERDRAFT">Overdraft</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" name="accountNumber" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Customer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
