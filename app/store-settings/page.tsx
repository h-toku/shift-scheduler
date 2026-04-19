import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import HomeShell from "../home-shell";
import { updateStoreAction } from "../admin-actions";
import { canManageStore, getAccessibleStores, pickSelectedStoreId, requireAdminOrOwner, requireCurrentStaff } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import prisma from "@/lib/prisma";

type StoreSettingsPageProps = {
  searchParams: Promise<{ storeId?: string | string[] }>;
};

export default async function StoreSettingsPage({ searchParams }: StoreSettingsPageProps) {
  const actor = await requireCurrentStaff();
  requireAdminOrOwner(actor.role);

  const [{ storeId: requestedStoreId }, accessibleStores, companies] = await Promise.all([
    searchParams,
    getAccessibleStores(actor.role, actor.storeId, actor.store.companyId),
    actor.role === Role.OWNER
      ? prisma.company.findMany({ where: { id: actor.store.companyId }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  const selectedStoreId = pickSelectedStoreId(
    requestedStoreId,
    accessibleStores.map((store) => store.id),
    actor.storeId
  );
  const selectedStore = accessibleStores.find((store) => store.id === selectedStoreId);

  if (!selectedStore) {
    redirect("/");
  }

  const canEdit = canManageStore(actor.role, actor.storeId, actor.store.companyId, {
    id: selectedStoreId,
    companyId: selectedStore.companyId,
  });

  return (
    <HomeShell
      staffName={actor.name}
      storeName={actor.store.name}
      navigationItems={getNavigationItems(actor.role)}
      currentPath="/store-settings"
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-400">Store Settings</p>
          <h2 className="mt-3 text-3xl font-black text-stone-800">店舗設定</h2>
          <p className="mt-3 text-sm font-medium text-stone-500">
            {actor.role === Role.OWNER
              ? "編集したい店舗を選んで、営業時間や店舗名を更新できます。"
              : canEdit
                ? "所属店舗の営業時間や店舗名を更新できます。"
                : "他店舗の情報は閲覧できますが、編集はできません。"}
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

          <form action={updateStoreAction} className="grid gap-5 md:grid-cols-2">
            <input type="hidden" name="storeId" value={selectedStore.id} />

            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-600">店舗名</span>
              <input
                name="name"
                defaultValue={selectedStore.name}
                disabled={!canEdit}
                className="w-full rounded-2xl border border-orange-100 px-4 py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-600">会社</span>
              {actor.role === Role.OWNER ? (
                <select
                  name="companyId"
                  defaultValue={selectedStore.companyId}
                  disabled={!canEdit}
                  className="w-full rounded-2xl border border-orange-100 px-4 py-3"
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={selectedStore.company.name}
                  readOnly
                  className="w-full rounded-2xl border border-orange-100 bg-stone-50 px-4 py-3 text-stone-500"
                />
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-600">開店時刻</span>
              <input
                type="time"
                name="openingTime"
                defaultValue={selectedStore.openingTime}
                disabled={!canEdit}
                className="w-full rounded-2xl border border-orange-100 px-4 py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-stone-600">閉店時刻</span>
              <input
                type="time"
                name="closingTime"
                defaultValue={selectedStore.closingTime}
                disabled={!canEdit}
                className="w-full rounded-2xl border border-orange-100 px-4 py-3"
              />
            </label>

            <div className="md:col-span-2">
              {canEdit ? (
                <button className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600">
                  店舗情報を更新
                </button>
              ) : (
                <p className="text-sm font-bold text-stone-400">
                  この店舗は閲覧のみ可能です。
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </HomeShell>
  );
}
