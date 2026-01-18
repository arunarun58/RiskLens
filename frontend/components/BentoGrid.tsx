'use client'

import React from 'react'
import { TrendingUp, Shield, BarChart3, Cloud, Lock, Zap } from 'lucide-react'

// Feature Data
const features = [
    {
        title: "Real-Time Market Data",
        description: "Powered by yfinance to deliver accurate, up-to-the-minute pricing for global equities and assets.",
        icon: TrendingUp,
        color: "blue",
        colSpan: 1,
    },
    {
        title: "Advanced Risk Metrics",
        description: "Go beyond simple volatility. Calculate Value at Risk (VaR), Expected Shortfall, and Sharpe Ratios effortlessly.",
        icon: Shield,
        color: "indigo",
        colSpan: 2,
    },
    {
        title: "Interactive Visualization",
        description: "Dynamic correlation heatmaps and efficient frontier charts help you spot diversification opportunities.",
        icon: BarChart3,
        color: "purple",
        colSpan: 1,
    },
    {
        title: "Cloud Persistence",
        description: "Save multiple portfolio iterations securely to the cloud and access them from any device.",
        icon: Cloud,
        color: "sky",
        colSpan: 1,
    },
    {
        title: "Institutional Security",
        description: "Your data is isolated and protected. We use OAuth for authentication and never share your portfolio details.",
        icon: Lock,
        color: "slate",
        colSpan: 1,
    },
]

export default function BentoGrid() {
    return (
        <section id="features" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className={`group relative p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 ${feature.colSpan === 2 ? 'md:col-span-2' : ''}`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-${feature.color}-50 text-${feature.color}-600`}>
                                <feature.icon className="h-6 w-6" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}

                    {/* Call to Action Card in Grid */}
                    <div className="relative p-8 rounded-2xl bg-blue-600 flex flex-col justify-center items-center text-center group overflow-hidden shadow-lg shadow-blue-200">
                        <div className="relative z-10">
                            <Zap className="h-10 w-10 text-yellow-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Ready to start?</h3>
                            <p className="text-blue-100 text-sm mb-4">No credit card required.</p>
                            <button className="px-6 py-2 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
