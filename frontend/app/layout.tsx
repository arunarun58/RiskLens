import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'RiskLens - Portfolio Risk Analysis',
  description: 'Professional portfolio risk analysis with real-time market data',
}

import { Providers } from "./providers"
import { auth, signIn, signOut } from "@/auth"

// ... existing imports ...

// Server Component
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {/* Enhanced Navigation */}
          <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-gradient">RiskLens</span>
                </Link>



                <div className="flex items-center space-x-6">
                  {!session && (
                    <form
                      action={async () => {
                        "use server"
                        await signIn("google", { redirectTo: "/portfolio" })
                      }}
                    >
                      <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors duration-200 shadow-sm">
                        Sign In
                      </button>
                    </form>
                  )}

                  {session && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {session.user?.image && (
                          <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="w-8 h-8 rounded-full border border-slate-200"
                          />
                        )}
                        <div className="hidden md:block text-sm text-right">
                          <div className="font-semibold text-slate-900">{session.user?.name}</div>
                          <div className="text-xs text-slate-500">{session.user?.email}</div>
                        </div>
                      </div>
                      <form
                        action={async () => {
                          "use server"
                          await signOut({ redirectTo: "/" })
                        }}
                      >
                        <button type="submit" className="btn-primary py-1.5 px-4 text-sm">
                          Sign Out
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="min-h-screen">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-slate-600 text-sm">
                <div className="flex justify-center space-x-6 mb-4 text-sm font-medium">
                  <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
                  <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                  <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
                </div>
                <p className="font-medium">© 2026 RiskLens. Professional Portfolio Risk Analysis.</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}

