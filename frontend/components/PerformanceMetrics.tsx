'use client'

import { PerformanceMetrics } from '@/lib/types'
import { formatPercent } from '@/lib/utils'
import { TrendingUp, Target, Award } from 'lucide-react'

interface PerformanceMetricsProps {
    data: PerformanceMetrics
}

function getRatioLevel(ratio: number): { label: string; color: string; bgColor: string } {
    if (ratio > 1.5) {
        return { label: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-50' }
    } else if (ratio > 1.0) {
        return { label: 'Good', color: 'text-blue-700', bgColor: 'bg-blue-50' }
    } else if (ratio > 0.5) {
        return { label: 'Fair', color: 'text-yellow-700', bgColor: 'bg-yellow-50' }
    } else {
        return { label: 'Poor', color: 'text-red-700', bgColor: 'bg-red-50' }
    }
}

export default function PerformanceMetricsComponent({ data }: PerformanceMetricsProps) {
    const sharpeLevel = getRatioLevel(data.sharpe_ratio)
    const sortinoLevel = getRatioLevel(data.sortino_ratio)

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk-Adjusted Performance</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Sharpe Ratio */}
                <div className={`rounded-lg p-3 border-2 ${sharpeLevel.bgColor} border-${sharpeLevel.color.split('-')[1]}-200`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Award className="h-4 w-4 text-white" />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${sharpeLevel.color} ${sharpeLevel.bgColor}`}>
                            {sharpeLevel.label}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-0.5">
                        {data.sharpe_ratio.toFixed(2)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mb-1 leading-tight">Sharpe Ratio</div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                        Return / Risk
                    </div>
                </div>

                {/* Sortino Ratio */}
                <div className={`rounded-lg p-3 border-2 ${sortinoLevel.bgColor} border-${sortinoLevel.color.split('-')[1]}-200`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Target className="h-4 w-4 text-white" />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${sortinoLevel.color} ${sortinoLevel.bgColor}`}>
                            {sortinoLevel.label}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-0.5">
                        {data.sortino_ratio.toFixed(2)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mb-1 leading-tight">Sortino Ratio</div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                        Return / Downside
                    </div>
                </div>

                {/* Annualized Return */}
                <div className={`rounded-lg p-3 border-2 ${data.annualized_return >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 bg-gradient-to-br ${data.annualized_return >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-lg flex items-center justify-center`}>
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold mb-0.5 ${data.annualized_return >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatPercent(data.annualized_return)}
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mb-1 leading-tight whitespace-nowrap">Annualized Return</div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                        Expected / Year
                    </div>
                </div>
            </div>

            {/* Explanation */}
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Understanding These Metrics</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                    <li>
                        <strong>Sharpe Ratio:</strong> Measures excess return per unit of total risk. Higher is better.
                        &gt;1.5 is excellent, &gt;1.0 is good.
                    </li>
                    <li>
                        <strong>Sortino Ratio:</strong> Similar to Sharpe but only considers downside volatility.
                        Better for portfolios with asymmetric returns.
                    </li>
                    <li>
                        <strong>Annualized Return:</strong> Expected return over one year based on historical performance.
                    </li>
                </ul>
                <div className="mt-2 text-xs text-slate-500">
                    Risk-free rate: {formatPercent(data.risk_free_rate)} (used in calculations)
                </div>
            </div>
        </div>
    )
}
