import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'pl']
const defaultLocale = 'en'

function getLocale(request: NextRequest): string {
  // Sprawdzenie flagi Vercel (Geolokalizacja po IP)
  const country = request.headers.get('x-vercel-ip-country')
  if (country === 'PL') return 'pl'
  
  // Jeśli na localhoscie lub brak geolokalizacji z Vercel, próbujemy ustawienia przeglądarki
  const acceptLang = request.headers.get('accept-language') || ''
  if (acceptLang.includes('pl')) return 'pl'

  // W innym wypadku, cały świat ładuje angielski
  return 'en'
}

export function middleware(request: NextRequest) {
  // Ignorowanie API i plików statycznych Next.js z routera
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return
  }

  // Sprawdzanie czy url juz ma locale (np. /pl/... alb /en/...)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // Złapanie języka
  const locale = getLocale(request)

  // Ukryte przekierowanie (Rewrite) do właściwego języka bez brudzenia paska adresu
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.rewrite(request.nextUrl)
}

export const config = {
  matcher: [
    // Pomiń wewnętrzne ścieżki (api i next cache)
    '/((?!api|_next/static|_next/image|favicon.ico|\\.png|\\.svg|\\.jpg).*)',
  ],
}
