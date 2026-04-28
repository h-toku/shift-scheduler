'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function login(formData: FormData) {
  const staffId = formData.get('staffId') as string
  const password = formData.get('password') as string

  let staff
  try {
    // DB接続エラーと認証失敗を分離して、切り分けしやすくする
    staff = await prisma.staff.findUnique({
      where: { id: staffId },
    })
  } catch (error) {
    console.error('Login failed while fetching staff:', error)
    redirect('/login?error=auth_unavailable')
  }

  if (!staff || staff.password !== password) {
    redirect('/login?error=invalid_credentials')
  }

  const cookieStore = await cookies()
  cookieStore.set('staffId', staffId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  void formData
  redirect('/login?message=signup_disabled')
}
