"use client";

import { useState } from "react";
import Link from "next/link";

type NavigationItem = {
  label: string;
  href?: string;
};

type HomeShellProps = {
  staffName: string;
  storeName: string;
  navigationItems: NavigationItem[];
  currentPath: string;
  children: React.ReactNode;
};

export default function HomeShell({
  staffName,
  storeName,
  navigationItems,
  currentPath,
  children,
}: HomeShellProps) {
  // サイドバーの開閉だけはクリック操作が必要なので、Client Component にして state を持つ。
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF9F1] text-stone-800">
      {/* ヘッダー: 左にメニューボタン、中央にタイトル、右にユーザー情報 */}
      <nav className="sticky top-0 z-40 border-b-2 border-orange-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-stone-600 transition-colors hover:text-orange-600"
              aria-label={sidebarOpen ? "サイドバーを隠す" : "サイドバーを表示"}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>

          <div className="justify-self-center text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-400">Shift Scheduler</p>
            <h1 className="text-xl font-black tracking-tight text-stone-800">シフト管理</h1>
          </div>

          <div className="flex items-center gap-3 justify-self-end">
            <div className="text-right">
              <p className="text-sm font-black text-stone-700">{staffName}</p>
              <p className="text-xs font-bold text-stone-400">{storeName}</p>
            </div>
            <form action="/auth/signout" method="post">
              <button className="rounded-2xl border border-orange-100 px-4 py-2 text-sm font-bold text-stone-500 transition-colors hover:text-orange-600">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="flex w-full flex-1 gap-6 px-4 py-8 lg:px-6">
        {/* サイドバーは開いているときだけ描画する */}
        {sidebarOpen ? (
          <aside className="sticky top-24 w-full max-w-xs shrink-0 self-start">
            <div className="max-h-[calc(100vh-7.5rem)] overflow-auto rounded-[32px] border border-orange-100 bg-white shadow-xl shadow-orange-950/5">
              <div className="space-y-3 p-5">
                {navigationItems.map((item) =>
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`block rounded-2xl border px-4 py-4 text-sm font-bold transition-colors ${
                        currentPath === item.href
                          ? "border-orange-200 bg-orange-50 text-orange-700"
                          : "border-stone-100 bg-stone-50 text-stone-500 hover:text-orange-600"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-4 text-sm font-bold text-stone-400"
                    >
                      {item.label}
                    </div>
                  )
                )}
              </div>
            </div>
          </aside>
        ) : null}

        <section className="min-w-0 flex-1">
          {children}
        </section>
      </main>

      <footer className="py-8 text-center">
        <p className="text-sm font-bold text-stone-300">
          © {new Date().getFullYear()} シフト管理 . 毎日をかるく、たのしく
        </p>
      </footer>
    </div>
  );
}
