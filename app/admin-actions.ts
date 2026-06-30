"use server";

import { Gender, Role, ShiftStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  canManageStaff,
  canManageStore,
  getAllowedRoleOptions,
  requireCurrentStaff,
} from "@/lib/auth";

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: FormDataEntryValue | null) {
  const text = asString(value).trim();
  return text ? text : null;
}

function toDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export async function updateStoreAction(formData: FormData) {
  const actor = await requireCurrentStaff();
  const storeId = asString(formData.get("storeId"));
  const targetStore = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, companyId: true },
  });
  if (!targetStore || !canManageStore(actor.role, actor.storeId, actor.store.companyId, targetStore)) {
    redirect("/");
  }

  const data = {
    name: asString(formData.get("name")),
    openingTime: asString(formData.get("openingTime")),
    closingTime: asString(formData.get("closingTime")),
  };

  const companyId = asOptionalString(formData.get("companyId"));

  await prisma.store.update({
    where: { id: storeId },
    data: {
      ...data,
      ...(actor.role === Role.OWNER && companyId === actor.store.companyId ? { companyId } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/store-settings");
  revalidatePath(`/stores/${storeId}`);
  redirect(`/store-settings?storeId=${storeId}`);
}

export async function createStoreAction(formData: FormData) {
  const actor = await requireCurrentStaff();
  if (actor.role !== Role.OWNER) {
    redirect("/");
  }

  const companyId = asString(formData.get("companyId"));
  if (companyId !== actor.store.companyId) {
    redirect("/stores");
  }
  const store = await prisma.store.create({
    data: {
      name: asString(formData.get("name")),
      companyId,
      openingTime: asString(formData.get("openingTime")),
      closingTime: asString(formData.get("closingTime")),
    },
  });

  revalidatePath("/stores");
  revalidatePath("/store-settings");
  redirect(`/stores/${store.id}`);
}

export async function deleteStoreAction(formData: FormData) {
  const actor = await requireCurrentStaff();
  if (actor.role !== Role.OWNER) {
    redirect("/");
  }

  const storeId = asString(formData.get("storeId"));

  const targetStore = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, companyId: true },
  });
  if (!targetStore || targetStore.companyId !== actor.store.companyId) {
    redirect("/stores");
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/stores");
  revalidatePath("/store-settings");
  revalidatePath("/shifts/history");
  redirect("/stores");
}

export async function createStaffAction(formData: FormData) {
  const actor = await requireCurrentStaff();
  const storeId = asString(formData.get("storeId"));

  const targetStore = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, companyId: true },
  });
  if (!targetStore || !canManageStore(actor.role, actor.storeId, actor.store.companyId, targetStore)) {
    redirect("/");
  }

  const allowedRoles = getAllowedRoleOptions(actor.role);
  const requestedRole = asString(formData.get("role")) as Role;
  const role = allowedRoles.includes(requestedRole) ? requestedRole : Role.STAFF;
  const birthday = asOptionalString(formData.get("birthday"));
  const genderValue = asOptionalString(formData.get("gender")) as Gender | null;

  const created = await prisma.staff.create({
    data: {
      id: asString(formData.get("id")),
      name: asString(formData.get("name")),
      email: asOptionalString(formData.get("email")),
      password: asOptionalString(formData.get("password")),
      birthday: birthday ? new Date(birthday) : null,
      gender: genderValue,
      role,
      storeId,
    },
  });

  revalidatePath("/staff");
  redirect(`/staff/${created.id}`);
}

export async function updateStaffAction(formData: FormData) {
  const actor = await requireCurrentStaff();
  const staffId = asString(formData.get("staffId"));
  const target = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { store: true },
  });

  if (
    !target ||
    !canManageStaff(actor.role, actor.storeId, actor.store.companyId, {
      storeId: target.storeId,
      role: target.role ?? null,
      companyId: target.store.companyId,
    })
  ) {
    redirect("/");
  }

  const allowedRoles = getAllowedRoleOptions(actor.role);
  const requestedRole = asString(formData.get("role")) as Role;
  const birthday = asOptionalString(formData.get("birthday"));
  const genderValue = asOptionalString(formData.get("gender")) as Gender | null;
  const nextStoreId = asString(formData.get("storeId"));

  const nextStore = await prisma.store.findUnique({
    where: { id: nextStoreId },
    select: { id: true, companyId: true },
  });
  if (!nextStore || !canManageStore(actor.role, actor.storeId, actor.store.companyId, nextStore)) {
    redirect("/");
  }

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      name: asString(formData.get("name")),
      email: asOptionalString(formData.get("email")),
      password: asOptionalString(formData.get("password")),
      birthday: birthday ? new Date(birthday) : null,
      gender: genderValue,
      storeId: nextStoreId,
      role: allowedRoles.includes(requestedRole) ? requestedRole : Role.STAFF,
    },
  });

  revalidatePath("/staff");
  redirect(`/staff/${staffId}`);
}

export async function deleteStaffAction(formData: FormData) {
  const actor = await requireCurrentStaff();
  const staffId = asString(formData.get("staffId"));
  const target = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { store: true },
  });

  if (
    !target ||
    !canManageStaff(actor.role, actor.storeId, actor.store.companyId, {
      storeId: target.storeId,
      role: target.role ?? null,
      companyId: target.store.companyId,
    })
  ) {
    redirect("/");
  }

  await prisma.staff.update({
    where: { id: staffId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/staff");
  revalidatePath("/shifts/history");
  redirect("/staff");
}

export async function createShiftAction(formData: FormData) {
  const actor = await requireCurrentStaff();
  const staffId = asString(formData.get("staffId"));
  const target = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { store: true },
  });

  if (
    !target ||
    !canManageStaff(actor.role, actor.storeId, actor.store.companyId, {
      storeId: target.storeId,
      role: target.role ?? null,
      companyId: target.store.companyId,
    })
  ) {
    redirect("/");
  }

  const date = asString(formData.get("date"));
  const startTime = asString(formData.get("startTime"));
  const endTime = asString(formData.get("endTime"));
  const status = (asString(formData.get("status")) as ShiftStatus) || ShiftStatus.APPROVED;

  await prisma.shift.create({
    data: {
      staffId,
      date: toDateTime(date, "00:00"),
      startTime: toDateTime(date, startTime),
      endTime: toDateTime(date, endTime),
      status,
    },
  });

  revalidatePath("/");
  revalidatePath("/shifts/new");
  redirect("/shifts/new");
}

type ShiftDecisionItem = {
  staffId: string;
  staffName: string;
  date: string;
  pendingShiftIds: string[];
  action: "approve" | "reject";
};

export type ApplyShiftDecisionsState = {
  ok: boolean;
  message: string | null;
  errors: string[];
};

export async function applyShiftDecisionsAction(
  _prevState: ApplyShiftDecisionsState,
  formData: FormData
): Promise<ApplyShiftDecisionsState> {
  const actor = await requireCurrentStaff();
  const storeId = asString(formData.get("storeId"));
  const rawDecisions = asString(formData.get("decisions"));

  if (!rawDecisions) {
    return { ok: false, message: null, errors: ["操作対象がありません。"] };
  }

  const targetStore = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, companyId: true },
  });
  if (!targetStore || !canManageStore(actor.role, actor.storeId, actor.store.companyId, targetStore)) {
    redirect("/");
  }

  let decisions: ShiftDecisionItem[];
  try {
    decisions = JSON.parse(rawDecisions) as ShiftDecisionItem[];
  } catch {
    return { ok: false, message: null, errors: ["登録データの形式が不正です。"] };
  }

  if (!Array.isArray(decisions) || decisions.length === 0) {
    return { ok: false, message: null, errors: ["操作対象がありません。"] };
  }

  const validationErrors: string[] = [];

  for (const item of decisions) {
    if (!item.staffId || !item.date || !Array.isArray(item.pendingShiftIds)) {
      validationErrors.push("登録データの項目が不足しています。");
      continue;
    }
    if (item.pendingShiftIds.length === 0) {
      validationErrors.push(
        `希望にないシフトを登録しようとしています（${item.staffName} / ${item.date}）`
      );
    }
  }

  if (validationErrors.length > 0) {
    return { ok: false, message: null, errors: validationErrors };
  }

  let approvedCount = 0;
  let rejectedCount = 0;

  for (const item of decisions) {
    const pendingShifts = await prisma.shift.findMany({
      where: {
        id: { in: item.pendingShiftIds },
        staffId: item.staffId,
        status: ShiftStatus.PENDING,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    if (pendingShifts.length === 0) {
      validationErrors.push(
        `希望にないシフトを登録しようとしています（${item.staffName} / ${item.date}）`
      );
      continue;
    }

    if (item.action === "approve") {
      for (const shift of pendingShifts) {
        const exists = await prisma.shift.findFirst({
          where: {
            staffId: shift.staffId,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            status: ShiftStatus.APPROVED,
          },
          select: { id: true },
        });
        if (!exists) {
          await prisma.shift.create({
            data: {
              staffId: shift.staffId,
              date: shift.date,
              startTime: shift.startTime,
              endTime: shift.endTime,
              status: ShiftStatus.APPROVED,
            },
          });
          approvedCount += 1;
        }
      }
      continue;
    }

    await prisma.shift.updateMany({
      where: {
        id: { in: pendingShifts.map((shift) => shift.id) },
        status: ShiftStatus.PENDING,
      },
      data: { status: ShiftStatus.REJECTED },
    });
    rejectedCount += pendingShifts.length;
  }

  if (validationErrors.length > 0) {
    return { ok: false, message: null, errors: validationErrors };
  }

  revalidatePath("/");
  revalidatePath("/shifts/new");
  revalidatePath("/shifts/history");

  return {
    ok: true,
    message: `登録完了: APPROVED ${approvedCount}件 / REJECTED ${rejectedCount}件`,
    errors: [],
  };
}

type ShiftRequestItem = {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type UpsertPendingShiftRequestsState = {
  ok: boolean;
  message: string | null;
  errors: string[];
};

function isValidTimeText(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isDateInNextMonth(dateText: string, now: Date) {
  const [year, month, day] = dateText.split("-").map((part) => Number(part));
  if (!year || !month || !day) return false;
  const date = new Date(year, month - 1, day);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const followingMonthStart = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  return date >= nextMonthStart && date < followingMonthStart;
}

export async function upsertPendingShiftRequestsAction(
  _prevState: UpsertPendingShiftRequestsState,
  formData: FormData
): Promise<UpsertPendingShiftRequestsState> {
  const actor = await requireCurrentStaff();
  const rawRequests = asString(formData.get("requests"));

  if (!rawRequests) {
    return { ok: false, message: null, errors: ["登録データがありません。"] };
  }

  let requests: ShiftRequestItem[];
  try {
    requests = JSON.parse(rawRequests) as ShiftRequestItem[];
  } catch {
    return { ok: false, message: null, errors: ["登録データの形式が不正です。"] };
  }

  if (!Array.isArray(requests) || requests.length === 0) {
    return { ok: false, message: null, errors: ["登録データがありません。"] };
  }

  const validationErrors: string[] = [];
  const normalizedRequests: ShiftRequestItem[] = [];
  const now = new Date();
  const targetStaffIds = Array.from(
    new Set(
      requests
        .map((item) => (typeof item?.staffId === "string" ? item.staffId : ""))
        .filter((id) => id.length > 0)
    )
  );

  const targetStaffs = await prisma.staff.findMany({
    where: { id: { in: targetStaffIds } },
    include: { store: true },
  });
  const targetStaffById = new Map(targetStaffs.map((staff) => [staff.id, staff]));

  for (const item of requests) {
    const staffId = typeof item?.staffId === "string" ? item.staffId : "";
    const date = typeof item?.date === "string" ? item.date : "";
    const startTime = typeof item?.startTime === "string" ? item.startTime : "";
    const endTime = typeof item?.endTime === "string" ? item.endTime : "";
    const targetStaff = targetStaffById.get(staffId);

    const hasStart = startTime.trim().length > 0;
    const hasEnd = endTime.trim().length > 0;
    if (!hasStart && !hasEnd) {
      continue;
    }
    if (!staffId || !targetStaff) {
      validationErrors.push(`対象スタッフが不正です（${date || "日付不明"}）。`);
      continue;
    }
    if (targetStaff.store.companyId !== actor.store.companyId) {
      validationErrors.push(`他社スタッフは編集できません（${targetStaff.name}）。`);
      continue;
    }
    if (actor.role === Role.ADMIN && targetStaff.storeId !== actor.storeId) {
      validationErrors.push(`所属店舗以外は編集できません（${targetStaff.name}）。`);
      continue;
    }
    if (actor.role !== Role.ADMIN && actor.role !== Role.OWNER && targetStaff.id !== actor.id) {
      validationErrors.push(`自分以外は編集できません（${targetStaff.name}）。`);
      continue;
    }
    if (!hasStart || !hasEnd) {
      validationErrors.push(`開始・終了時刻を両方入力してください（${date || "日付不明"}）。`);
      continue;
    }
    if (!isDateInNextMonth(date, now)) {
      validationErrors.push(`翌月以外の日付は登録できません（${date}）。`);
      continue;
    }
    if (!isValidTimeText(startTime) || !isValidTimeText(endTime)) {
      validationErrors.push(`時刻は HH:mm 形式で入力してください（${date}）。`);
      continue;
    }
    if (startTime >= endTime) {
      validationErrors.push(`開始時刻は終了時刻より前にしてください（${date}）。`);
      continue;
    }

    normalizedRequests.push({ staffId, date, startTime, endTime });
  }

  if (validationErrors.length > 0) {
    return { ok: false, message: null, errors: validationErrors };
  }
  if (normalizedRequests.length === 0) {
    return { ok: false, message: null, errors: ["登録対象がありません。"] };
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of normalizedRequests) {
    const dateAtMidnight = toDateTime(item.date, "00:00");
    const startAt = toDateTime(item.date, item.startTime);
    const endAt = toDateTime(item.date, item.endTime);

    const existing = await prisma.shift.findFirst({
      where: {
        staffId: item.staffId,
        date: dateAtMidnight,
        status: ShiftStatus.PENDING,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, startTime: true, endTime: true },
    });

    if (existing) {
      const changed =
        existing.startTime.getTime() !== startAt.getTime() || existing.endTime.getTime() !== endAt.getTime();
      if (changed) {
        await prisma.shift.update({
          where: { id: existing.id },
          data: { startTime: startAt, endTime: endAt },
        });
        updatedCount += 1;
      }
      continue;
    }

    await prisma.shift.create({
      data: {
        staffId: item.staffId,
        date: dateAtMidnight,
        startTime: startAt,
        endTime: endAt,
        status: ShiftStatus.PENDING,
      },
    });
    createdCount += 1;
  }

  revalidatePath("/shifts/request");
  revalidatePath("/shifts/new");
  revalidatePath("/");

  return {
    ok: true,
    message: `登録完了: 新規 ${createdCount}件 / 更新 ${updatedCount}件`,
    errors: [],
  };
}
