"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { createAuditLog } from "@/lib/audit/service";
import {
  MODULE_DEFINITIONS,
  canEnableModule,
  canDisableModule,
} from "@/lib/config/modules";
import { getEnabledModules } from "@/lib/auth/module-gate";

export async function toggleModuleAction(moduleId: string, enable: boolean) {
  const user = await requirePermission("settings", "EDIT");
  const module = MODULE_DEFINITIONS[moduleId];

  if (!module || module.isCore) {
    return { error: "Cannot toggle core modules" };
  }

  const enabledModules = new Set(await getEnabledModules(user.companyId));

  if (enable) {
    const { valid, missingDeps } = canEnableModule(moduleId, enabledModules);
    if (!valid) {
      const depNames = missingDeps.map((d) => MODULE_DEFINITIONS[d]?.name ?? d).join(", ");
      return { error: `Enable these modules first: ${depNames}` };
    }
  } else {
    const { valid, dependents } = canDisableModule(moduleId, enabledModules);
    if (!valid) {
      const depNames = dependents.map((d) => MODULE_DEFINITIONS[d]?.name ?? d).join(", ");
      return { error: `Disable these modules first: ${depNames}` };
    }
  }

  const key = `module.${moduleId}.enabled`;

  await prisma.systemConfig.upsert({
    where: { companyId_key: { companyId: user.companyId, key } },
    update: { value: enable ? "true" : "false" },
    create: { companyId: user.companyId, key, value: enable ? "true" : "false" },
  });

  await createAuditLog({
    companyId: user.companyId,
    userId: user.id,
    userEmail: user.email,
    action: "UPDATE",
    entityType: "ModuleConfig",
    entityId: moduleId,
    before: { enabled: !enable },
    after: { enabled: enable },
  });

  revalidatePath("/settings/modules");
  return { success: true };
}
