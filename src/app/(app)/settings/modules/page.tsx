import { requirePermission } from "@/lib/auth/rbac";
import { getEnabledModules } from "@/lib/auth/module-gate";
import { MODULE_DEFINITIONS } from "@/lib/config/modules";
import { ModuleToggle } from "./module-toggle";

export default async function ModulesPage() {
  const user = await requirePermission("settings", "VIEW");
  const enabledModules = await getEnabledModules(user.companyId);
  const enabledSet = new Set(enabledModules);

  const categories = [
    { key: "core", label: "Core (Always On)" },
    { key: "lending", label: "Lending Operations" },
    { key: "finance", label: "Finance & Accounting" },
    { key: "compliance", label: "Compliance & Reporting" },
    { key: "communication", label: "Communication" },
    { key: "documents", label: "Documents" },
    { key: "hr", label: "HR & Internal" },
    { key: "integrations", label: "Integrations & Automation" },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Modules</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Enable or disable feature modules. Core modules cannot be turned off.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const modules = Object.values(MODULE_DEFINITIONS).filter(
            (m) => m.category === cat.key
          );
          if (modules.length === 0) return null;

          return (
            <section key={cat.key}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                {cat.label}
              </h2>
              <div className="space-y-2">
                {modules.map((module) => (
                  <ModuleToggle
                    key={module.id}
                    moduleId={module.id}
                    name={module.name}
                    description={module.description}
                    isCore={module.isCore}
                    isEnabled={enabledSet.has(module.id)}
                    dependencies={module.dependsOn.map(
                      (d) => MODULE_DEFINITIONS[d]?.name ?? d
                    )}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
