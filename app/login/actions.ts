'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function login(formData: FormData) {
  const staffId = formData.get('staffId') as string
  const password = formData.get('password') as string

  // 1. Prisma でスタッフを探す
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
  })

  // 2. パスワードの検証
  if (!staff || staff.password !== password) {
    // 認証失敗時はエラーページ（またはログイン画面に戻す）
    // 本来は詳細なエラーメッセージを返すべきですが、まずはシンプルにリダイレクト
    redirect('/login?error=invalid_credentials')
  }

  // 3. セッションクッキーの発行
  const cookieStore = await cookies()
  cookieStore.set('staffId', staffId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1週間
    sameSite: 'lax',
  })

  // キャッシュを更新してトップページへ
  revalidatePath('/', 'layout')
  redirect('/')
}

// 独自認証への移行に伴い、セルフサインアップ（新規登録）は一旦無効化、または管理用のロジックに変更
export async function signup(formData: FormData) {
  // 必要に応じて将来的に実装可能ですが、現在はログインのみに集中します
  redirect('/login?message=signup_disabled')
}
