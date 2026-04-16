import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export default async function Home() {
  // 1. クッキーから直接スタッフIDを取得
  const cookieStore = await cookies();
  const staffId = cookieStore.get('staffId')?.value;

  // 未ログインならログイン画面へ
  if (!staffId) {
    redirect("/login");
  }

  // 2. データベースから情報を取得
  const staffInfo = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { store: true },
  });

  const storeId = staffInfo?.storeId;

  const staffList = await prisma.staff.findMany({
    where: { storeId: storeId },
  })

  const shifts = await prisma.Shift.findMany({
    where: {
      staff: {
        storeId: storeId, // ← ここ統一
      },
      status: "APPROVED",
    },
  })

  const days = ["月", "火", "水", "木", "金", "土", "日"]

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF5] text-stone-800 font-sans">
      {/* 優しいナビゲーション */}
      <nav className="border-b-2 border-orange-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-stone-800">シフト管理</span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm font-bold text-stone-400 hover:text-orange-600 transition-colors">
              ログアウト
            </button>
          </form>
        </div>
      </nav>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-12">
          {/* ウェルカムエリア */}
          <div className="mb-12 rounded-[32px] bg-white border-2 border-orange-50 p-8 shadow-xl shadow-orange-900/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-black text-stone-800">
                  こんにちは、
                  <span className="text-orange-500">
                    {staffInfo?.name || "ゲスト"}
                  </span>
                  さん！
                </h1>
                <p className="mt-2 font-medium text-stone-500">
                  {staffInfo?.store
                    ? `今日の「${staffInfo.store.name}」の予定を確認しましょう！`
                    : "所属店舗の情報を確認中です..."}
                </p>
              </div>
              <div className="inline-flex h-12 items-center rounded-2xl bg-orange-50 px-6 font-bold text-orange-600">
                お疲れ様です！
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl bg-white border-2 border-orange-50 shadow-md">
            <table className="min-w-full text-sm text-center border-collapse">
              <thead className="bg-orange-50">
                <tr>
                  <th className="p-3 border">日付</th>
                  {staffList.map((staff) => (
                    <th key={staff.id} className="p-3 border">
                      {staff.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {days.map((day) => (
                  <tr key={day} className="hover:bg-orange-50/50">
                    <td className="p-2 border font-bold">{day}</td>

                    {staffList.map((staff) => (
                      <td key={staff.id} className="p-2 border">
                        {shiftMap[staff.id]?.[day] || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center">
        <p className="text-sm font-bold text-stone-300">
          © {new Date().getFullYear()} シフト管理 . 毎日をかるく、たのしく
        </p>
      </footer>
    </div>
  );
}
