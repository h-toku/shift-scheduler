import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDF5] p-6 font-sans">
      <div className="w-full max-w-[400px] animate-in fade-in zoom-in duration-500">
        <div className="relative overflow-hidden rounded-[40px] border-4 border-orange-100 bg-white p-10 shadow-xl shadow-orange-900/5">
          {/* 装飾用の丸 */}
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-orange-50" />

          <div className="relative z-10 mb-8 text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-[32px] bg-orange-500 shadow-lg shadow-orange-500/20">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-800">
              シフト管理
            </h1>
            <p className="mt-2 text-sm font-medium text-stone-500">
              みんなの予定を、もっとかんたんに
            </p>
          </div>

          <form className="relative z-10 space-y-6">
            <div className="space-y-1.5">
              <label
                htmlFor="staffId"
                className="ml-1 text-sm font-bold text-stone-700"
              >
                スタッフID
              </label>
              <input
                id="staffId"
                name="staffId"
                type="text"
                required
                className="block w-full rounded-2xl border-2 border-orange-50 bg-orange-50/30 px-4 py-3.5 text-stone-800 placeholder:text-stone-300 transition-all focus:border-orange-500/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="ml-1 text-sm font-bold text-stone-700"
              >
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-2xl border-2 border-orange-50 bg-orange-50/30 px-4 py-3.5 text-stone-800 placeholder:text-stone-300 transition-all focus:border-orange-500/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-3 pt-6">
              <button
                formAction={login}
                className="w-full rounded-2xl bg-orange-500 px-6 py-4 text-center text-base font-black text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 hover:shadow-orange-500/30 active:scale-95"
              >
                ログインする
              </button>
            </div>
          </form>

          <footer className="relative z-10 mt-10 text-center">
            <p className="text-xs font-semibold text-stone-400">
              ※登録後はメールを確認してね！
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
