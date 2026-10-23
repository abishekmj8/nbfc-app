import { prisma } from "@/lib/db/prisma";
import { MODULE_DEFINITIONS } from "@/lib/config/modules";
import { AppError } from "@/lib/errors/app-error";
import { ErrorCodes } from "@/lib/errors/codes";

/**
 * Check if a module is enabled for the current company.
 * Core modules are always enabled.
 */
export async function isModuleEnabled(
  moduleId: string,
  companyId: string
): Promise<boolean> {
  const module = MODULE_DEFINITIONS[moduleId];
  if (!module) return false;
  if (module.isCore) return true;

  const config = await prisma.systemConfig.findUnique({
    where: { companyId_key: { companyId, key: `module.${moduleId}.enabled` } },
  });

  return config?.value === "true";
}

/**
 * Require a module to be enabled or throw.
 */
export async function requireModule(
  moduleId: string,
  companyId: string
): Promise<void> {
  const enabled = await isModuleEnabled(moduleId, companyId);
  if (!enabled) {
    const module = MODULE_DEFINITIONS[moduleId];
    throw new AppError(
      ErrorCodes.MODULE_DISABLED,
      `The ${module?.name ?? moduleId} module is not enabled`,
      403
    );
  }
}

/**
 * Get all enabled modules for a company.
 */
export async function getEnabledModules(
  companyId: string
): Promise<string[]> {
  const configs = await prisma.systemConfig.findMany({
    where: {
      companyId,
      key: { startsWith: "module." },
    },
  });

  const enabled = new Set<string>();

  // Core modules are always enabled
  for (const [id, def] of Object.entries(MODULE_DEFINITIONS)) {
    if (def.isCore) enabled.add(id);
  }

  // Add explicitly enabled modules
  for (const config of configs) {
    if (config.value === "true") {
      const moduleId = config.key.replace("module.", "").replace(".enabled", "");
      enabled.add(moduleId);
    }
  }

  return Array.from(enabled);
}
