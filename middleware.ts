import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 自前のクッキーからスタッフIDを取得
  const staffId = request.cookies.get('staffId')?.value
  const { pathname } = request.nextUrl

  // 1. ログインページへのアクセス
  if (pathname === '/login') {
    if (staffId) {
      // ログイン済みならトップページへ
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 2. 認証が必要なページへのアクセス（/auth 関連以外）
  if (!staffId && !pathname.startsWith('/auth')) {
    // 未ログインならログイン画面へ強制リダイレクト
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除外して全てのパスでミドルウェアを実行する:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - 画像ファイル (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
