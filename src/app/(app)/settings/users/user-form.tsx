"use client";

import { useActionState, useState } from "react";
import { createUserAction, type UserFormState } from "@/lib/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface Props {
  roles: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; name: string }>;
}

const initial: UserFormState = {};

export function UserCreateForm({ roles, branches }: Props) {
  const [state, formAction, isPending] = useActionState(createUserAction, initial);
  const [show, setShow] = useState(false);

  if (!show) return <Button onClick={() => setShow(true)}>Add User</Button>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">New User</h3>
      {state.error && <div className="mb-3 p-2 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">{state.error}</div>}
      {state.success && <div className="mb-3 p-2 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm">User created</div>}

      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>First Name *</Label><Input name="firstName" required className="mt-1" /></div>
          <div><Label>Last Name</Label><Input name="lastName" className="mt-1" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Email *</Label><Input name="email" type="email" required className="mt-1" /></div>
          <div><Label>Password *</Label><Input name="password" type="password" required className="mt-1" placeholder="Min 8 chars, uppercase, digit" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Role *</Label>
            <Select name="roleId" required className="mt-1">
              <option value="">Select role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Branch</Label>
            <Select name="branchId" className="mt-1">
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create User"}</Button>
          <Button type="button" variant="ghost" onClick={() => setShow(false)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
