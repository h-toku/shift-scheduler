import { Role } from "@prisma/client";
import HomeShell from "../../home-shell";
import prisma from "@/lib/prisma";
import { getAccessibleStores, pickSelectedStoreId, requireCurrentStaff } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import { upsertPendingShiftRequestsAction } from "@/app/admin-actions";
import ShiftRequestGrid from "./shift-request-grid";

type PendingCell = {
  pendingText: string;
  startTime: string;
  endTime: string;
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShiftTime(date: Date) {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildNextMonthDates(baseDate: Date) {
  const nextMonthStart = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  const followingMonthStart = new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 1);
  const dates: { key: string; date: Date }[] = [];
  const cursor = new Date(nextMonthStart);
  while (cursor < followingMonthStart) {
    dates.push({ key: formatDateKey(cursor), date: new Date(cursor) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return { nextMonthStart, followingMonthStart, dates };
}

type ShiftRequestPageProps = {
  searchParams: Promise<{ storeId?: string | string[] }>;
};

export default async function ShiftRequestPage({ searchParams }: ShiftRequestPageProps) {
  const actor = await requireCurrentStaff();
  const [{ storeId: requestedStoreId }, accessibleStores] = await Promise.all([
    searchParams,
    getAccessibleStores(actor.role, actor.storeId, actor.store.companyId),
  ]);
  const selectedStoreId = pickSelectedStoreId(
    requestedStoreId,
    accessibleStores.map((store) => store.id),
    actor.storeId
  );
  const selectedStore = accessibleStores.find((store) => store.id === selectedStoreId) ?? actor.store;

  const storeStaffs = await prisma.staff.findMany({
    where: { storeId: selectedStoreId, deletedAt: null },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const { nextMonthStart, followingMonthStart, dates } = buildNextMonthDates(new Date());

  const pendingShifts = await prisma.shift.findMany({
    where: {
      staffId: { in: storeStaffs.map((staff) => staff.id) },
      status: "PENDING",
      date: {
        gte: nextMonthStart,
        lt: followingMonthStart,
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const pendingMap = pendingShifts.reduce<Record<string, Record<string, PendingCell>>>((acc, shift) => {
    const dateKey = formatDateKey(new Date(shift.date));
    const timeText = `${formatShiftTime(new Date(shift.startTime))} - ${formatShiftTime(new Date(shift.endTime))}`;
    acc[dateKey] ??= {};

    const current = acc[dateKey][shift.staffId];
    if (!current) {
      acc[dateKey][shift.staffId] = {
        pendingText: timeText,
        startTime: formatShiftTime(new Date(shift.startTime)),
        endTime: formatShiftTime(new Date(shift.endTime)),
      };
      return acc;
    }

    acc[dateKey][shift.staffId] = {
      pendingText: `${current.pendingText} / ${timeText}`,
      startTime: current.startTime,
      endTime: current.endTime,
    };
    return acc;
  }, {});

  const monthLabel = nextMonthStart.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });
  const editableStaffIds =
    actor.role === Role.OWNER
      ? storeStaffs.map((staff) => staff.id)
      : actor.role === Role.ADMIN && selectedStoreId === actor.storeId
        ? storeStaffs.map((staff) => staff.id)
        : storeStaffs.filter((staff) => staff.id === actor.id).map((staff) => staff.id);
  const description =
    actor.role === Role.OWNER
      ? "PENDINGのみ表示しています。全店舗・全スタッフを編集して登録できます。"
      : actor.role === Role.ADMIN
        ? "PENDINGのみ表示しています。他店舗は閲覧のみ、所属店舗のみ編集できます。"
        : "PENDINGのみ表示しています。自分の列だけ編集して登録してください。";

  return (
    <HomeShell
      staffName={actor.name}
      storeName={actor.store.name}
      navigationItems={getNavigationItems(actor.role)}
      currentPath="/shifts/request"
    >
      <div className="mb-8 rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-400">Shift Request</p>
        <h2 className="mt-3 text-3xl font-black text-stone-800">{monthLabel}のシフト希望提出</h2>
        <p className="mt-3 text-sm font-medium text-stone-500">{description}</p>
        <form className="mt-4 flex flex-wrap items-center gap-3" method="get">
          <label htmlFor="storeId" className="text-sm font-bold text-stone-500">
            表示店舗
          </label>
          <select
            id="storeId"
            name="storeId"
            defaultValue={selectedStoreId}
            className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-bold text-stone-700"
          >
            {accessibleStores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <button className="rounded-2xl border border-orange-100 px-4 py-3 text-sm font-bold text-stone-500 hover:text-orange-600">
            切り替え
          </button>
          <span className="text-xs font-bold text-stone-400">
            表示中: {selectedStore.name}
            {selectedStore.company ? ` / ${selectedStore.company.name}` : ""}
          </span>
        </form>
      </div>

      <ShiftRequestGrid
        editableStaffIds={editableStaffIds}
        staffs={storeStaffs.map((staff) => ({ id: staff.id, name: staff.name }))}
        visibleDates={dates.map((item) => ({ key: item.key, isoDate: item.key, date: item.date }))}
        pendingMap={pendingMap}
        submitAction={upsertPendingShiftRequestsAction}
      />
    </HomeShell>
  );
}
