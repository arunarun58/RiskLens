'use client'

import { MonteCarloVaR as MonteCarloData } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingDown, AlertTriangle, Info } from 'lucide-react'

interface MonteCarloVaRProps {
    data: MonteCarloData
    parametricVaR: number
    portfolioValue: number
}

export default function MonteCarloVaR({ data, parametricVaR, portfolioValue }: MonteCarloVaRProps) {
    // Create histogram data from simulations
    const createHistogram = () => {
        const binCount = 50
        const min = data.distribution.min
        const max = data.distribution.max
        const binSize = (max - min) / binCount

        const bins: { value: number; count: number }[] = []
        for (let i = 0; i < binCount; i++) {
            bins.push({
                value: min + (i + 0.5) * binSize,
                count: 0
            })
        }

        // Count simulations in each bin
        data.simulations.forEach(sim => {
            const binIndex = Math.min(Math.floor((sim - min) / binSize), binCount - 1)
            if (binIndex >= 0 && binIndex < binCount) {
                bins[binIndex].count++
            }
        })

        return bins
    }

    const histogramData = createHistogram()
    const varThreshold = portfolioValue - data.mc_var_95

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2 text-purple-600" />
                    Monte Carlo Value at Risk
                </h3>
                <p className="text-sm text-slate-600">
                    {data.num_simulations.toLocaleString()} simulations • {(data.confidence_level * 100).toFixed(0)}% confidence
                </p>
            </div>

            {/* Key Metrics - Vertical Stack */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Monte Carlo VaR */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-sm text-slate-600 font-medium">Monte Carlo VaR</div>
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                        <div>
                            <div className="text-3xl font-bold text-purple-700 whitespace-nowrap">
                                {formatCurrency(data.mc_var_95)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                95% confidence, 1-day horizon
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conditional VaR (CVaR) */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-sm text-slate-600 font-medium">Expected Shortfall (CVaR)</div>
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                        <div>
                            <div className="text-3xl font-bold text-red-700 whitespace-nowrap">
                                {formatCurrency(data.mc_cvar_95)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Average loss beyond VaR
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comparison */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Info className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-sm text-slate-600 font-medium">Parametric VaR</div>
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                        <div>
                            <div className="text-3xl font-bold text-blue-700 whitespace-nowrap">
                                {formatCurrency(parametricVaR)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {data.mc_var_95 > parametricVaR ? 'MC is higher' : 'MC is lower'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Distribution Chart */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Portfolio Value Distribution</h4>
                <div style={{ color: '#0f172a' }}>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={histogramData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="value"
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                stroke="#64748b"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => [value ?? 0, 'Frequency']}
                                labelFormatter={(value) => `Value: ${formatCurrency(value)}`}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            />
                            <ReferenceLine
                                x={varThreshold}
                                stroke="#dc2626"
                                strokeDasharray="5 5"
                                label={{ value: 'VaR', position: 'top', fill: '#dc2626', fontSize: 12 }}
                            />
                            <ReferenceLine
                                x={portfolioValue}
                                stroke="#059669"
                                strokeDasharray="5 5"
                                label={{ value: 'Current', position: 'top', fill: '#059669', fontSize: 12 }}
                            />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribution Statistics */}
            <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Distribution Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-slate-600">Mean</div>
                        <div className="text-sm font-semibold text-slate-900">{formatCurrency(data.distribution.mean)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-600">Std Dev</div>
                        <div className="text-sm font-semibold text-slate-900">{formatCurrency(data.distribution.std)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-600">Min</div>
                        <div className="text-sm font-semibold text-red-700">{formatCurrency(data.distribution.min)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-600">Max</div>
                        <div className="text-sm font-semibold text-green-700">{formatCurrency(data.distribution.max)}</div>
                    </div>
                </div>
            </div>

            {/* Explanation */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Understanding Monte Carlo VaR</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                    <li>
                        <strong>Monte Carlo VaR:</strong> Maximum expected loss at 95% confidence based on {data.num_simulations.toLocaleString()} simulations
                    </li>
                    <li>
                        <strong>CVaR (Expected Shortfall):</strong> Average loss in the worst 5% of scenarios
                    </li>
                    <li>
                        <strong>Why it's better:</strong> More accurate for non-normal distributions and captures tail risk
                    </li>
                </ul>
            </div>
        </div>
    )
}
