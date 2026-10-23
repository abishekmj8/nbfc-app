import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create company
  const company = await prisma.company.create({
    data: {
      name: "Demo NBFC Pvt Ltd",
      rbiRegistrationNo: "N-00.00000",
      address: "123 Finance Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      email: "admin@demo-nbfc.com",
    },
  });
  console.log("Created company:", company.name);

  // Create head office branch
  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: "Head Office",
      code: "HO",
      city: "Mumbai",
      state: "Maharashtra",
      isHeadOffice: true,
    },
  });
  console.log("Created branch:", branch.name);

  // Create admin role with all permissions
  const adminRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: "Admin",
      description: "Full system access",
      isSystem: true,
      permissions: {
        create: [
          // Core permissions
          { module: "settings", action: "VIEW" },
          { module: "settings", action: "CREATE" },
          { module: "settings", action: "EDIT" },
          { module: "settings", action: "DELETE" },
          { module: "users", action: "VIEW" },
          { module: "users", action: "CREATE" },
          { module: "users", action: "EDIT" },
          { module: "users", action: "DELETE" },
          { module: "audit", action: "VIEW" },
          { module: "audit", action: "EXPORT" },
        ],
      },
    },
  });
  console.log("Created role:", adminRole.name);

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      email: "admin@demo-nbfc.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  });
  console.log("Created admin user:", admin.email);

  // Enable some default modules
  const defaultModules = [
    "lead-management",
    "loan-origination",
    "loan-management",
    "collections",
    "accounting",
    "fee-charges",
    "compliance",
    "reports",
    "notifications",
    "documents",
    "task-workflow",
  ];

  for (const moduleId of defaultModules) {
    await prisma.systemConfig.create({
      data: {
        companyId: company.id,
        key: `module.${moduleId}.enabled`,
        value: "true",
      },
    });
  }
  console.log("Enabled default modules:", defaultModules.length);

  console.log("\n--- Seed complete ---");
  console.log("Login with: admin@demo-nbfc.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
