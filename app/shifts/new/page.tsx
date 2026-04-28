import { Role } from "@prisma/client";
import HomeShell from "../../home-shell";
import { applyShiftDecisionsAction } from "../../admin-actions";
import { getAccessibleStores, pickSelectedStoreId, requireAdminOrOwner, requireCurrentStaff } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import prisma from "@/lib/prisma";
import ShiftApprovalGrid from "./shift-approval-grid";

type ShiftCreatePageProps = {
  searchParams: Promise<{ storeId?: string | string[] }>;
};

export default async function ShiftCreatePage({ searchParams }: ShiftCreatePageProps) {
  const actor = await requireCurrentStaff();
  requireAdminOrOwner(actor.role);

  const [{ storeId: requestedStoreId }, accessibleStores] = await Promise.all([
    searchParams,
    getAccessibleStores(actor.role, actor.storeId, actor.store.companyId),
  ]);

  const selectedStoreId = pickSelectedStoreId(
    requestedStoreId,
    accessibleStores.map((store) => store.id),
    actor.storeId
  );

  const staffs = await prisma.staff.findMany({
    where: {
      storeId: selectedStoreId,
      role: Role.STAFF,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
  });

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const pendingShifts = await prisma.shift.findMany({
    where: {
      staffId: { in: staffs.map((staff) => staff.id) },
      status: "PENDING",
      date: {
        gte: monthStart,
        lt: nextMonthStart,
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const visibleDates: { key: string; label: string; isoDate: string }[] = [];
  const cursor = new Date(monthStart);
  while (cursor < nextMonthStart) {
    const iso = `${cursor.getFullYear()}-${`${cursor.getMonth() + 1}`.padStart(2, "0")}-${`${cursor.getDate()}`.padStart(2, "0")}`;
    const weekday = cursor.toLocaleDateString("ja-JP", { weekday: "short" });
    visibleDates.push({
      key: iso,
      isoDate: iso,
      label: `${cursor.getMonth() + 1}/${cursor.getDate()} (${weekday})`,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const pendingMap = pendingShifts.reduce<Record<string, Record<string, { pendingText: string; pendingShiftIds: string[] }>>>(
    (acc, shift) => {
      const date = new Date(shift.date);
      const dateKey = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
      const timeText = `${new Date(shift.startTime).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${new Date(shift.endTime).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      const current = acc[dateKey]?.[shift.staffId];
      if (!acc[dateKey]) acc[dateKey] = {};
      if (!current) {
        acc[dateKey][shift.staffId] = { pendingText: timeText, pendingShiftIds: [shift.id] };
      } else {
        acc[dateKey][shift.staffId] = {
          pendingText: `${current.pendingText} / ${timeText}`,
          pendingShiftIds: [...current.pendingShiftIds, shift.id],
        };
      }
      return acc;
    },
    {}
  );

  return (
    <HomeShell
      staffName={actor.name}
      storeName={actor.store.name}
      navigationItems={getNavigationItems(actor.role)}
      currentPath="/shifts/new"
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-400">Shift Create</p>
          <h2 className="mt-3 text-3xl font-black text-stone-800">シフト作成</h2>
          <p className="mt-3 text-sm font-medium text-stone-500">
            当月の希望シフト（PENDING）を採用/却下して登録できます。
          </p>
        </div>

        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <form className="mb-6 flex flex-wrap items-center gap-3" method="get">
            <label htmlFor="storeId" className="text-sm font-bold text-stone-500">
              対象店舗
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
          </form>

          <ShiftApprovalGrid
            storeId={selectedStoreId}
            staffs={staffs.map((staff) => ({ id: staff.id, name: staff.name }))}
            visibleDates={visibleDates}
            pendingMap={pendingMap}
            applyAction={applyShiftDecisionsAction}
          />
        </div>
      </div>
    </HomeShell>
  );
}
