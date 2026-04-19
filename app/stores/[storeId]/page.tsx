import { notFound, redirect } from "next/navigation";
import HomeShell from "../../home-shell";
import { deleteStoreAction, updateStoreAction } from "../../admin-actions";
import { requireCurrentStaff, requireOwner } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import prisma from "@/lib/prisma";

type StoreDetailPageProps = {
  params: Promise<{ storeId: string }>;
};

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const actor = await requireCurrentStaff();
  requireOwner(actor.role);

  const { storeId } = await params;
  const [store, companies, staffs] = await Promise.all([
    prisma.store.findUnique({
      where: { id: storeId },
      include: { company: true },
    }),
    prisma.company.findMany({ where: { id: actor.store.companyId }, orderBy: { name: "asc" } }),
    prisma.staff.findMany({
      where: { storeId },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!store) notFound();
  if (store.companyId !== actor.store.companyId) {
    redirect("/stores");
  }

  return (
    <HomeShell
      staffName={actor.name}
      storeName={actor.store.name}
      navigationItems={getNavigationItems(actor.role)}
      currentPath="/stores"
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-400">Store Detail</p>
          <h2 className="mt-3 text-3xl font-black text-stone-800">{store.name}</h2>
          <p className="mt-3 text-sm font-medium text-stone-500">
            {store.company.name} / スタッフ {staffs.length}名
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
            <h3 className="text-xl font-black text-stone-800">店舗情報を編集</h3>
            <form action={updateStoreAction} className="mt-6 grid gap-5 md:grid-cols-2">
              <input type="hidden" name="storeId" value={store.id} />
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">店舗名</span>
                <input name="name" defaultValue={store.name} className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">会社</span>
                <select name="companyId" defaultValue={store.companyId} className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">開店時刻</span>
                <input type="time" name="openingTime" defaultValue={store.openingTime} className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">閉店時刻</span>
                <input type="time" name="closingTime" defaultValue={store.closingTime} className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
              </label>
              <div className="md:col-span-2 flex items-center gap-3">
                <button className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600">
                  保存
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-8">
            <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
              <h3 className="text-xl font-black text-stone-800">所属スタッフ</h3>
              <div className="mt-6 space-y-3">
                {staffs.map((staff) => (
                  <div key={staff.id} className="rounded-2xl border border-orange-100 px-4 py-3">
                    <p className="font-black text-stone-800">{staff.name}</p>
                    <p className="text-sm font-medium text-stone-500">{staff.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-rose-100 bg-white p-8 shadow-xl shadow-rose-950/5">
              <h3 className="text-xl font-black text-stone-800">店舗を削除</h3>
              <p className="mt-3 text-sm font-medium text-stone-500">
                所属スタッフとシフトも一緒に削除されます。
              </p>
              <form action={deleteStoreAction} className="mt-6">
                <input type="hidden" name="storeId" value={store.id} />
                <button className="rounded-2xl bg-rose-500 px-6 py-3 text-sm font-black text-white hover:bg-rose-600">
                  店舗を削除
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </HomeShell>
  );
}
