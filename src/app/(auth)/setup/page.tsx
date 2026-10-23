"use client";

import { useActionState } from "react";
import { setupAction, type SetupState } from "@/lib/setup/actions";

const initialState: SetupState = {};

export default function SetupPage() {
  const [state, formAction, isPending] = useActionState(setupAction, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8">
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
            {/* Company Details */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Company Details
              </legend>
              <div className="space-y-3">
                <Field
                  name="companyName"
                  label="Company Name"
                  required
                  error={state.fieldErrors?.companyName}
                  placeholder="ABC Finance Pvt Ltd"
                />
                <Field
                  name="rbiRegistrationNo"
                  label="RBI Registration No."
                  placeholder="N-00.00000 (optional)"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field name="companyEmail" label="Email" type="email" placeholder="info@company.com" />
                  <Field name="companyPhone" label="Phone" placeholder="+91 98765 43210" />
                </div>
                <Field name="address" label="Address" placeholder="123 Finance Street" />
                <div className="grid grid-cols-3 gap-3">
                  <Field name="city" label="City" placeholder="Mumbai" />
                  <Field name="state" label="State" placeholder="Maharashtra" />
                  <Field name="pincode" label="Pincode" placeholder="400001" />
                </div>
              </div>
            </fieldset>

            {/* Admin Account */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Admin Account
              </legend>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    name="adminFirstName"
                    label="First Name"
                    required
                    error={state.fieldErrors?.adminFirstName}
                    placeholder="Rajesh"
                  />
                  <Field name="adminLastName" label="Last Name" placeholder="Sharma" />
                </div>
                <Field
                  name="adminEmail"
                  label="Email"
                  type="email"
                  required
                  error={state.fieldErrors?.adminEmail}
                  placeholder="admin@company.com"
                />
                <Field
                  name="adminPassword"
                  label="Password"
                  type="password"
                  required
                  error={state.fieldErrors?.adminPassword}
                  placeholder="Minimum 8 characters"
                />
                <Field
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  required
                  error={state.fieldErrors?.confirmPassword}
                  placeholder="Repeat password"
                />
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isPending ? "Setting up..." : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {error?.map((e) => (
        <p key={e} className="text-xs text-red-500 mt-1">{e}</p>
      ))}
    </div>
  );
}
