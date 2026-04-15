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

          {/* シンプルなメニュー */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "自分のシフト", desc: "今週の予定を確認する", color: "bg-orange-500" },
              { title: "みんなの予定", desc: "店舗全体の状況を見る", color: "bg-amber-400" },
              { title: "お休み申請", desc: "新しい希望を出す", color: "bg-orange-400" },
            ].map((item) => (
              <button 
                key={item.title} 
                className="group relative overflow-hidden rounded-3xl bg-white border-2 border-orange-50 p-6 text-left shadow-md transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.color} text-white`}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-stone-800 group-hover:text-orange-600 transition-colors">{item.title}</h3>
                <p className="mt-1 text-sm font-medium text-stone-400">{item.desc}</p>
              </button>
            ))}
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
