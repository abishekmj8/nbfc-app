"use client";

import { useActionState } from "react";
import { setupAction, type SetupState } from "@/lib/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: SetupState = {};

export default function SetupPage() {
  const [state, formAction, isPending] = useActionState(setupAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome to NBFC Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Let&apos;s set up your company and admin account
          </p>
        </div>

        {state.error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Your NBFC registration information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" name="companyName" required className="mt-1" placeholder="ABC Finance Pvt Ltd" />
                {state.fieldErrors?.companyName?.map((e) => <p key={e} className="text-xs text-red-500 mt-1">{e}</p>)}
              </div>
              <div>
                <Label htmlFor="rbiRegistrationNo">RBI Registration No.</Label>
                <Input id="rbiRegistrationNo" name="rbiRegistrationNo" className="mt-1" placeholder="N-00.00000 (optional)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="companyEmail">Email</Label><Input id="companyEmail" name="companyEmail" type="email" className="mt-1" /></div>
                <div><Label htmlFor="companyPhone">Phone</Label><Input id="companyPhone" name="companyPhone" className="mt-1" /></div>
              </div>
              <div><Label htmlFor="address">Address</Label><Input id="address" name="address" className="mt-1" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label htmlFor="city">City</Label><Input id="city" name="city" className="mt-1" /></div>
                <div><Label htmlFor="state">State</Label><Input id="state" name="state" className="mt-1" /></div>
                <div><Label htmlFor="pincode">Pincode</Label><Input id="pincode" name="pincode" className="mt-1" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Account</CardTitle>
              <CardDescription>Your first user account with full access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="adminFirstName">First Name *</Label>
                  <Input id="adminFirstName" name="adminFirstName" required className="mt-1" />
                  {state.fieldErrors?.adminFirstName?.map((e) => <p key={e} className="text-xs text-red-500 mt-1">{e}</p>)}
                </div>
                <div><Label htmlFor="adminLastName">Last Name</Label><Input id="adminLastName" name="adminLastName" className="mt-1" /></div>
              </div>
              <div>
                <Label htmlFor="adminEmail">Email *</Label>
                <Input id="adminEmail" name="adminEmail" type="email" required className="mt-1" />
                {state.fieldErrors?.adminEmail?.map((e) => <p key={e} className="text-xs text-red-500 mt-1">{e}</p>)}
              </div>
              <div>
                <Label htmlFor="adminPassword">Password *</Label>
                <Input id="adminPassword" name="adminPassword" type="password" required className="mt-1" placeholder="Minimum 8 characters" />
                {state.fieldErrors?.adminPassword?.map((e) => <p key={e} className="text-xs text-red-500 mt-1">{e}</p>)}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required className="mt-1" />
                {state.fieldErrors?.confirmPassword?.map((e) => <p key={e} className="text-xs text-red-500 mt-1">{e}</p>)}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Setting up..." : "Complete Setup"}
          </Button>
        </form>
      </div>
    </div>
  );
}
