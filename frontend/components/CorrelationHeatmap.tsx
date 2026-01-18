'use client'

import { CorrelationData } from '@/lib/types'

interface CorrelationHeatmapProps {
    data: CorrelationData
}

function getCorrelationColor(correlation: number): string {
    // Color scale for correlation values
    if (correlation > 0.7) return 'bg-red-500'      // High positive correlation
    if (correlation > 0.3) return 'bg-orange-400'   // Moderate positive
    if (correlation > 0) return 'bg-yellow-300'     // Low positive
    if (correlation > -0.3) return 'bg-blue-300'    // Low negative
    if (correlation > -0.7) return 'bg-blue-400'    // Moderate negative
    return 'bg-blue-500'                             // High negative correlation
}

function getTextColor(correlation: number): string {
    if (Math.abs(correlation) > 0.5) return 'text-white'
    return 'text-slate-900'
}

export default function CorrelationHeatmap({ data }: CorrelationHeatmapProps) {
    const { tickers, correlations } = data

    // Create a map for quick lookup
    const corrMap = new Map<string, number>()
    correlations.forEach(item => {
        corrMap.set(`${item.ticker1}-${item.ticker2}`, item.correlation)
    })

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Correlation Matrix</h3>
                <p className="text-sm text-slate-600">
                    Shows how assets move together. Red = high correlation, Blue = negative correlation
                </p>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    <table className="border-collapse">
                        <thead>
                            <tr className="h-24 align-bottom">
                                <th className="w-20"></th>
                                {tickers.map(ticker => (
                                    <th key={ticker} className="p-2 text-center align-bottom">
                                        <div className="w-16 text-xs font-semibold text-slate-700 transform -rotate-45 origin-bottom-left translate-x-4 mb-2">
                                            {ticker}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tickers.map((ticker1, i) => (
                                <tr key={ticker1}>
                                    <td className="p-2 text-xs font-semibold text-slate-700 text-right pr-3">
                                        {ticker1}
                                    </td>
                                    {tickers.map((ticker2, j) => {
                                        const correlation = corrMap.get(`${ticker1}-${ticker2}`) || 0
                                        const bgColor = getCorrelationColor(correlation)
                                        const textColor = getTextColor(correlation)

                                        return (
                                            <td key={ticker2} className="p-0">
                                                <div
                                                    className={`w-16 h-16 flex items-center justify-center ${bgColor} ${textColor} text-xs font-semibold border border-white hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all`}
                                                    title={`${ticker1} vs ${ticker2}: ${correlation.toFixed(3)}`}
                                                >
                                                    {correlation.toFixed(2)}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Understanding Correlation</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-slate-700">&gt; 0.7: High positive</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-400 rounded"></div>
                        <span className="text-slate-700">0.3 - 0.7: Moderate positive</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                        <span className="text-slate-700">0 - 0.3: Low positive</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-300 rounded"></div>
                        <span className="text-slate-700">-0.3 - 0: Low negative</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-400 rounded"></div>
                        <span className="text-slate-700">-0.7 - -0.3: Moderate negative</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-slate-700">&lt; -0.7: High negative</span>
                    </div>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                    <strong>Tip:</strong> High correlation (red) means assets move together.
                    Negative correlation (blue) means they move in opposite directions, providing better diversification.
                </p>
            </div>
        </div>
    )
}
