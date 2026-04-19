import { Gender, Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import HomeShell from "../../home-shell";
import { deleteStaffAction, updateStaffAction } from "../../admin-actions";
import { canManageStaff, getAccessibleStores, getAllowedRoleOptions, requireAdminOrOwner, requireCurrentStaff } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";
import prisma from "@/lib/prisma";

type StaffDetailPageProps = {
  params: Promise<{ staffId: string }>;
};

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const actor = await requireCurrentStaff();
  requireAdminOrOwner(actor.role);

  const { staffId } = await params;
  const [target, accessibleStores] = await Promise.all([
    prisma.staff.findUnique({
      where: { id: staffId },
      include: { store: { include: { company: true } } },
    }),
    getAccessibleStores(actor.role, actor.storeId, actor.store.companyId),
  ]);

  if (!target) notFound();
  if (target.store.companyId !== actor.store.companyId) {
    redirect("/staff");
  }
  const canEdit = canManageStaff(actor.role, actor.storeId, actor.store.companyId, {
    storeId: target.storeId,
    role: target.role ?? null,
    companyId: target.store.companyId,
  });

  return (
    <HomeShell
      staffName={actor.name}
      storeName={actor.store.name}
      navigationItems={getNavigationItems(actor.role)}
      currentPath="/staff"
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-400">Staff Detail</p>
          <h2 className="mt-3 text-3xl font-black text-stone-800">{target.name}</h2>
          <p className="mt-3 text-sm font-medium text-stone-500">
            {target.store.name} / {target.role}
          </p>
          {!canEdit ? (
            <p className="mt-2 text-sm font-bold text-stone-400">このスタッフは閲覧のみ可能です。</p>
          ) : null}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
            <h3 className="text-xl font-black text-stone-800">スタッフ情報を編集</h3>
            <form action={updateStaffAction} className="mt-6 grid gap-5 md:grid-cols-2">
              <input type="hidden" name="staffId" value={target.id} />
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">名前</span>
                <input name="name" defaultValue={target.name} disabled={!canEdit} className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">メール</span>
                <input name="email" type="email" defaultValue={target.email ?? ""} disabled={!canEdit} className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">パスワード</span>
                <input name="password" type="text" defaultValue={target.password ?? ""} disabled={!canEdit} className="w-full rounded-2xl border border-orange-100 px-4 py-3" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">誕生日</span>
                <input
                  type="date"
                  name="birthday"
                  defaultValue={target.birthday ? new Date(target.birthday).toISOString().slice(0, 10) : ""}
                  disabled={!canEdit}
                  className="w-full rounded-2xl border border-orange-100 px-4 py-3"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">性別</span>
                <select name="gender" defaultValue={target.gender ?? ""} disabled={!canEdit} className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                  <option value="">未設定</option>
                  {Object.values(Gender).map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-600">権限</span>
                <select name="role" defaultValue={target.role ?? Role.STAFF} disabled={!canEdit} className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                  {getAllowedRoleOptions(actor.role).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-bold text-stone-600">所属店舗</span>
                <select name="storeId" defaultValue={target.storeId} disabled={!canEdit} className="w-full rounded-2xl border border-orange-100 px-4 py-3">
                  {accessibleStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-2">
                {canEdit ? (
                  <button className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600">
                    保存
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          {canEdit ? (
            <div className="rounded-[32px] border border-rose-100 bg-white p-8 shadow-xl shadow-rose-950/5">
              <h3 className="text-xl font-black text-stone-800">スタッフを削除</h3>
              <p className="mt-3 text-sm font-medium text-stone-500">
                スタッフは削除されますが、シフト情報はそのまま残ります。
              </p>
              <form action={deleteStaffAction} className="mt-6">
                <input type="hidden" name="staffId" value={target.id} />
                <button className="rounded-2xl bg-rose-500 px-6 py-3 text-sm font-black text-white hover:bg-rose-600">
                  スタッフを削除
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </HomeShell>
  );
}
