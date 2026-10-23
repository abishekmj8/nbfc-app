"use server";

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/service";

const MFI_INCOME_LIMIT_PAISE = 300_000_00n; // Rs 3,00,000 annual — RBI MFI norm

/**
 * Validate household income for MFI loan eligibility.
 * RBI: Annual household income must be <= Rs 3,00,000 for NBFC-MFI loans.
 */
export function validateMfiEligibility(annualHouseholdIncomePaise: bigint): {
  eligible: boolean;
  error?: string;
} {
  if (annualHouseholdIncomePaise > MFI_INCOME_LIMIT_PAISE) {
    return {
      eligible: false,
      error: `Annual household income (₹${(Number(annualHouseholdIncomePaise) / 100).toLocaleString("en-IN")}) exceeds MFI limit of ₹3,00,000`,
    };
  }
  return { eligible: true };
}

/**
 * Create an MFI group (JLG or SHG).
 */
export async function createMfiGroup(params: {
  companyId: string;
  branchId?: string;
  groupName: string;
  groupCode: string;
  groupType: "JLG" | "SHG";
  fieldOfficerId?: string;
  userId: string;
  userEmail: string;
}) {
  const group = await prisma.mfiGroup.create({
    data: {
      companyId: params.companyId,
      branchId: params.branchId,
      groupName: params.groupName,
      groupCode: params.groupCode,
      groupType: params.groupType,
      fieldOfficerId: params.fieldOfficerId,
      formationDate: new Date(),
    },
  });

  await createAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    userEmail: params.userEmail,
    action: "CREATE",
    entityType: "MfiGroup",
    entityId: group.id,
    after: { groupName: params.groupName, type: params.groupType },
  });

  return group;
}

/**
 * Add a member to a group.
 */
export async function addGroupMember(params: {
  groupId: string;
  customerId: string;
  role: "LEADER" | "SECRETARY" | "MEMBER";
  companyId: string;
  userId: string;
  userEmail: string;
}) {
  const member = await prisma.mfiGroupMember.create({
    data: {
      groupId: params.groupId,
      customerId: params.customerId,
      role: params.role,
    },
  });

  // Update member count
  const count = await prisma.mfiGroupMember.count({
    where: { groupId: params.groupId, status: "ACTIVE" },
  });
  await prisma.mfiGroup.update({
    where: { id: params.groupId },
    data: { memberCount: count },
  });

  await createAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    userEmail: params.userEmail,
    action: "CREATE",
    entityType: "MfiGroupMember",
    entityId: member.id,
    after: { groupId: params.groupId, customerId: params.customerId, role: params.role },
  });

  return member;
}

/**
 * Schedule a group meeting.
 */
export async function scheduleMeeting(params: {
  groupId: string;
  meetingDate: Date;
  meetingType: "REGULAR" | "CGT" | "SPECIAL";
  companyId: string;
  userId: string;
  userEmail: string;
}) {
  const meeting = await prisma.mfiMeeting.create({
    data: {
      groupId: params.groupId,
      meetingDate: params.meetingDate,
      meetingType: params.meetingType,
      conductedBy: params.userId,
    },
  });

  return meeting;
}
