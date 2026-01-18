'use client'

import { BenchmarkComparison as BenchmarkData } from '@/lib/types'
import { formatPercent } from '@/lib/utils'
import { TrendingUp, Target, Activity } from 'lucide-react'

interface BenchmarkComparisonProps {
    data: BenchmarkData
    portfolioReturn: number
    portfolioVolatility: number
    portfolioSharpe: number
}

export default function BenchmarkComparison({
    data,
    portfolioReturn,
    portfolioVolatility,
    portfolioSharpe
}: BenchmarkComparisonProps) {
    if (!data) return null

    const isOutperforming = data.alpha > 0
    const isLessVolatile = portfolioVolatility < data.benchmark_volatility

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Benchmark Comparison</h3>
                <p className="text-sm text-slate-600">
                    Performance vs {data.benchmark_ticker === '^GSPC' ? 'S&P 500' : data.benchmark_ticker}
                </p>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Your Portfolio */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-3">Your Portfolio</div>
                    <div className="space-y-2">
                        <div>
                            <div className="text-xs text-blue-700">Return</div>
                            <div className="text-2xl font-bold text-blue-900">
                                {formatPercent(portfolioReturn)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-blue-700">Volatility</div>
                            <div className="text-lg font-semibold text-blue-900">
                                {formatPercent(portfolioVolatility)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-blue-700">Sharpe Ratio</div>
                            <div className="text-lg font-semibold text-blue-900">
                                {portfolioSharpe.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benchmark */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-2 border-slate-200">
                    <div className="text-sm font-semibold text-slate-900 mb-3">
                        {data.benchmark_ticker === '^GSPC' ? 'S&P 500' : data.benchmark_ticker}
                    </div>
                    <div className="space-y-2">
                        <div>
                            <div className="text-xs text-slate-700">Return</div>
                            <div className="text-2xl font-bold text-slate-900">
                                {formatPercent(data.benchmark_return)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-700">Volatility</div>
                            <div className="text-lg font-semibold text-slate-900">
                                {formatPercent(data.benchmark_volatility)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-700">Sharpe Ratio</div>
                            <div className="text-lg font-semibold text-slate-900">
                                {data.benchmark_sharpe.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alpha, Beta, Correlation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Alpha */}
                <div className={`rounded-lg p-4 border-2 ${isOutperforming
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOutperforming ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className={`text-3xl font-bold mb-1 ${isOutperforming ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {data.alpha >= 0 ? '+' : ''}{formatPercent(data.alpha)}
                    </div>
                    <div className="text-sm text-slate-600 mb-1">Alpha</div>
                    <div className="text-xs text-slate-500">
                        {isOutperforming ? 'Outperforming' : 'Underperforming'} benchmark
                    </div>
                </div>

                {/* Beta */}
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <Target className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-700 mb-1">
                        {data.beta.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-600 mb-1">Beta</div>
                    <div className="text-xs text-slate-500">
                        {data.beta > 1 ? 'More volatile' : data.beta < 1 ? 'Less volatile' : 'Same volatility'} than market
                    </div>
                </div>

                {/* Correlation */}
                <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-amber-700 mb-1">
                        {data.correlation.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-600 mb-1">Correlation</div>
                    <div className="text-xs text-slate-500">
                        {Math.abs(data.correlation) > 0.7 ? 'High' : Math.abs(data.correlation) > 0.3 ? 'Moderate' : 'Low'} correlation
                    </div>
                </div>
            </div>

            {/* Explanation */}
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Understanding These Metrics</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                    <li>
                        <strong>Alpha:</strong> Excess return vs benchmark. Positive alpha means you're beating the market.
                    </li>
                    <li>
                        <strong>Beta:</strong> Market sensitivity. Beta &gt; 1 means more volatile than market, &lt; 1 means less volatile.
                    </li>
                    <li>
                        <strong>Correlation:</strong> How closely your portfolio moves with the benchmark. 1.0 = perfect correlation.
                    </li>
                </ul>
            </div>
        </div>
    )
}
