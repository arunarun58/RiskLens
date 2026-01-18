'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import { signIn } from 'next-auth/react'

export default function HeroSection() {
    return (
        <div className="relative overflow-hidden bg-white pt-16 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    Master Your <br className="hidden md:block" />
                    <span className="text-blue-600">Portfolio Risk</span>
                </h1>

                <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Professional-grade risk analysis for everyone. Visualize volatility, simulate market crashes, and optimize your holdings with institutional tools.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/portfolio' })}
                        className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 transition-all duration-300 flex items-center"
                    >
                        Start Analyzing Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </button>

                    <a
                        href="#features"
                        className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all duration-300 flex items-center"
                    >
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        See How It Works
                    </a>
                </div>


            </div>
        </div>
    )
}
