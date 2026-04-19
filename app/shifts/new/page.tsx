import { Role, ShiftStatus } from "@prisma/client";
import HomeShell from "../../home-shell";
import { createShiftAction } from "../../admin-actions";
import { getAccessibleStores, pickSelectedStoreId, requireAdminOrOwner, requireCurrentStaff } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import prisma from "@/lib/prisma";

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
            STAFF のシフトを日付ごとに登録できます。
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

          <form action={createShiftAction} className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-600">スタッフ</span>
              <select name="staffId" className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                {staffs.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-600">日付</span>
              <input type="date" name="date" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-600">開始時刻</span>
              <input type="time" name="startTime" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-600">終了時刻</span>
              <input type="time" name="endTime" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-stone-600">状態</span>
              <select name="status" defaultValue={ShiftStatus.APPROVED} className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                {Object.values(ShiftStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2">
              <button className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600">
                シフトを登録
              </button>
            </div>
          </form>
        </div>
      </div>
    </HomeShell>
  );
}
