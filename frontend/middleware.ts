
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isPortfolioRoute = req.nextUrl.pathname.startsWith('/portfolio')
    const isHomeRoute = req.nextUrl.pathname === '/'

    // Redirect from Home to Portfolio if logged in
    if (isHomeRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/portfolio', req.nextUrl))
    }

    // Redirect to Home (Login) if accessing Portfolio while not logged in
    if (isPortfolioRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL('/', req.nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
