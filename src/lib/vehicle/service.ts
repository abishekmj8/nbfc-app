"use server";

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/service";

/**
 * Create a vehicle detail record for a loan.
 */
export async function createVehicleDetail(params: {
  companyId: string;
  loanApplicationId?: string;
  vehicleType: string;
  make: string;
  model: string;
  variant?: string;
  yearOfMfg: number;
  registrationNo?: string;
  engineNo?: string;
  chassisNo?: string;
  purchasePrice?: bigint;
  userId: string;
  userEmail: string;
}) {
  const vehicle = await prisma.vehicleDetail.create({
    data: {
      companyId: params.companyId,
      loanApplicationId: params.loanApplicationId,
      vehicleType: params.vehicleType,
      make: params.make,
      model: params.model,
      variant: params.variant,
      yearOfMfg: params.yearOfMfg,
      registrationNo: params.registrationNo,
      engineNo: params.engineNo,
      chassisNo: params.chassisNo,
      purchasePrice: params.purchasePrice,
    },
  });

  await createAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    userEmail: params.userEmail,
    action: "CREATE",
    entityType: "VehicleDetail",
    entityId: vehicle.id,
    after: { make: params.make, model: params.model, registration: params.registrationNo },
  });

  return vehicle;
}

/**
 * File hypothecation with RTO.
 */
export async function fileHypothecation(
  vehicleId: string,
  companyId: string,
  userId: string,
  userEmail: string
) {
  await prisma.vehicleDetail.update({
    where: { id: vehicleId },
    data: { hypothecationStatus: "FILED", hypothecationFiledAt: new Date() },
  });

  await createAuditLog({
    companyId, userId, userEmail,
    action: "UPDATE",
    entityType: "VehicleDetail",
    entityId: vehicleId,
    after: { hypothecationStatus: "FILED" },
  });
}

/**
 * Remove hypothecation on loan closure.
 */
export async function removeHypothecation(
  vehicleId: string,
  companyId: string,
  userId: string,
  userEmail: string
) {
  await prisma.vehicleDetail.update({
    where: { id: vehicleId },
    data: { hypothecationStatus: "REMOVED", hypothecationRemovedAt: new Date() },
  });

  await createAuditLog({
    companyId, userId, userEmail,
    action: "UPDATE",
    entityType: "VehicleDetail",
    entityId: vehicleId,
    after: { hypothecationStatus: "REMOVED" },
  });
}

/**
 * Mark vehicle as repossessed.
 */
export async function repossessVehicle(
  vehicleId: string,
  reason: string,
  companyId: string,
  userId: string,
  userEmail: string
) {
  await prisma.vehicleDetail.update({
    where: { id: vehicleId },
    data: { repossessed: true, repossessedAt: new Date(), repossessionReason: reason },
  });

  await createAuditLog({
    companyId, userId, userEmail,
    action: "UPDATE",
    entityType: "VehicleDetail",
    entityId: vehicleId,
    after: { repossessed: true, reason },
  });
}
