import { Gender, Role } from "@prisma/client";
import Link from "next/link";
import HomeShell from "../home-shell";
import { createStaffAction } from "../admin-actions";
import ModalPanel from "../ui/modal-panel";
import {
  getAccessibleStores,
  getAllowedRoleOptions,
  pickSelectedStoreId,
  requireAdminOrOwner,
  requireCurrentStaff,
} from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import prisma from "@/lib/prisma";

type StaffPageProps = {
  searchParams: Promise<{ storeId?: string | string[] }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
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
      deletedAt: null,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { store: true },
  });
  const creatableStores = actor.role === Role.ADMIN
    ? accessibleStores.filter((store) => store.id === actor.storeId)
    : accessibleStores;

  return (
    <HomeShell
      staffName={actor.name}
      storeName={actor.store.name}
      navigationItems={getNavigationItems(actor.role)}
      currentPath="/staff"
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-400">Staff Management</p>
          <h2 className="mt-3 text-3xl font-black text-stone-800">スタッフ管理</h2>
          <p className="mt-3 text-sm font-medium text-stone-500">
            スタッフの追加、編集、削除ができます。クリックすると詳細ページへ移動します。
          </p>
        </div>

        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black text-stone-800">スタッフ一覧</h3>
            <ModalPanel buttonLabel="新規追加" title="スタッフを追加">
              <form action={createStaffAction} className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">スタッフID</span>
                  <input name="id" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">名前</span>
                  <input name="name" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">メール</span>
                  <input name="email" type="email" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">パスワード</span>
                  <input name="password" type="text" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">所属店舗</span>
                  <select name="storeId" defaultValue={actor.storeId} className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                    {creatableStores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">権限</span>
                  <select name="role" defaultValue={Role.STAFF} className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                    {getAllowedRoleOptions(actor.role).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">性別</span>
                  <select name="gender" defaultValue="" className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                    <option value="">未設定</option>
                    {Object.values(Gender).map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-stone-600">誕生日</span>
                  <input type="date" name="birthday" className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
                </label>
                <div className="md:col-span-2">
                  <button className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600">
                    スタッフを追加
                  </button>
                </div>
              </form>
            </ModalPanel>
          </div>

          <form className="mb-6 flex flex-wrap items-center gap-3" method="get">
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
          </form>

          <div className="space-y-3">
            {staffs.map((staff) => (
              <Link
                key={staff.id}
                href={`/staff/${staff.id}`}
                className="flex items-center justify-between rounded-2xl border border-orange-100 px-5 py-4 hover:bg-orange-50/50"
              >
                <div>
                  <p className="font-black text-stone-800">{staff.name}</p>
                  <p className="text-sm font-medium text-stone-500">
                    {staff.store.name} / {staff.role}
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
