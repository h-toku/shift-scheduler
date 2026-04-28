import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function requireCurrentStaff() {
  const cookieStore = await cookies();
  const staffId = cookieStore.get("staffId")?.value;

  if (!staffId) {
    redirect("/login");
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      store: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!staff) {
    redirect("/login");
  }

  return staff;
}

export function requireAdminOrOwner(role: Role | null | undefined) {
  if (role !== Role.ADMIN && role !== Role.OWNER) {
    redirect("/");
  }
}

export function requireOwner(role: Role | null | undefined) {
  if (role !== Role.OWNER) {
    redirect("/");
  }
}

export function isOwner(role: Role | null | undefined) {
  return role === Role.OWNER;
}

export function isAdminOrOwner(role: Role | null | undefined) {
  return role === Role.ADMIN || role === Role.OWNER;
}

export async function getAccessibleStores(role: Role | null | undefined, storeId: string, companyId: string) {
  if (role === Role.ADMIN || isOwner(role)) {
    return prisma.store.findMany({
      where: { companyId },
      include: { company: true },
      orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
    });
  }

  return prisma.store.findMany({
    where: { id: storeId },
    include: { company: true },
  });
}

export function pickSelectedStoreId(
  requestedStoreId: string | string[] | undefined,
  accessibleStoreIds: string[],
  fallbackStoreId: string
) {
  const storeId = Array.isArray(requestedStoreId) ? requestedStoreId[0] : requestedStoreId;
  if (storeId && accessibleStoreIds.includes(storeId)) {
    return storeId;
  }

  if (accessibleStoreIds.includes(fallbackStoreId)) {
    return fallbackStoreId;
  }

  return accessibleStoreIds[0] || fallbackStoreId;
}

export function canManageStore(
  role: Role | null | undefined,
  actorStoreId: string,
  actorCompanyId: string,
  target: { id: string; companyId: string }
) {
  if (target.companyId !== actorCompanyId) return false;
  return isOwner(role) || actorStoreId === target.id;
}

export function canManageStaff(
  role: Role | null | undefined,
  actorStoreId: string,
  actorCompanyId: string,
  target: { storeId: string; role: Role | null; companyId: string }
) {
  if (target.companyId !== actorCompanyId) return false;
  if (isOwner(role)) return true;
  return role === Role.ADMIN && actorStoreId === target.storeId && target.role === Role.STAFF;
}

export function getAllowedRoleOptions(role: Role | null | undefined) {
  return isOwner(role) ? [Role.OWNER, Role.ADMIN, Role.STAFF] : [Role.STAFF];
}
