import Link from "next/link";
import HomeShell from "../home-shell";
import { createStoreAction } from "../admin-actions";
import ModalPanel from "../ui/modal-panel";
import { requireCurrentStaff, requireOwner } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import prisma from "@/lib/prisma";

export default async function StoresPage() {
  const actor = await requireCurrentStaff();
  requireOwner(actor.role);

  const [stores, companies] = await Promise.all([
    prisma.store.findMany({
      where: { companyId: actor.store.companyId },
      include: { company: true, staffs: true },
      orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.company.findMany({ where: { id: actor.store.companyId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <HomeShell
      staffName={actor.name}
      storeName={actor.store.name}
      navigationItems={getNavigationItems(actor.role)}
      currentPath="/stores"
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-400">Store Management</p>
          <h2 className="mt-3 text-3xl font-black text-stone-800">店舗管理</h2>
          <p className="mt-3 text-sm font-medium text-stone-500">
            店舗の追加、削除、詳細確認ができます。詳細ページでは店舗ごとの情報を編集できます。
          </p>
        </div>

        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black text-stone-800">店舗一覧</h3>
            <ModalPanel buttonLabel="新規追加" title="店舗を追加">
              <form action={createStoreAction} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">会社</span>
                  <select name="companyId" className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">店舗名</span>
                  <input name="name" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">開店時刻</span>
                  <input type="time" name="openingTime" defaultValue="09:00" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">閉店時刻</span>
                  <input type="time" name="closingTime" defaultValue="18:00" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
                </label>
                <button className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600">
                  店舗を追加
                </button>
              </form>
            </ModalPanel>
          </div>

          <div className="space-y-3">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.id}`}
                className="flex items-center justify-between rounded-2xl border border-orange-100 px-5 py-4 hover:bg-orange-50/50"
              >
                <div>
                  <p className="font-black text-stone-800">{store.name}</p>
                  <p className="text-sm font-medium text-stone-500">
                    {store.company.name} / スタッフ {store.staffs.length}名
                  </p>
                </div>
                <span className="text-sm font-bold text-orange-500">詳細</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </HomeShell>
  );
}
