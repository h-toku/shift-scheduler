import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // セッション用クッキーを削除
  const cookieStore = await cookies()
  cookieStore.delete('staffId')

  // キャッシュを更新してログイン画面へ
  revalidatePath('/', 'layout')
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}
