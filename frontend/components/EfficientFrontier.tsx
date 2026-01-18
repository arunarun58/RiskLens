'use client'

import { useState } from 'react'
import { Portfolio, OptimizationResponse } from '@/lib/types'
import { formatPercent, formatCurrency } from '@/lib/utils'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts'
import { TrendingUp, Target, Shield, Zap, Loader2 } from 'lucide-react'
import RebalancingTable from '@/components/RebalancingTable'

interface EfficientFrontierProps {
    portfolio: Portfolio
    currentReturn: number
    currentVolatility: number
    period: string
}

export default function EfficientFrontier({ portfolio, currentReturn, currentVolatility, period }: EfficientFrontierProps) {
    const [data, setData] = useState<OptimizationResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOptimize = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('http://localhost:8000/api/optimize?period=' + period, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(portfolio)
            })

            if (!response.ok) {
                throw new Error('Optimization failed')
            }

            const result = await response.json()
            setData(result)
        } catch (err) {
            setError('Failed to optimize portfolio. Ensure you have enough historical data.')
        } finally {
            setLoading(false)
        }
    }

    // Prepare chart data
    const chartData = data ? data.frontier.returns.map((ret, i) => ({
        x: data.frontier.volatility[i],
        y: ret,
        type: 'frontier'
    })) : []

    const maxSharpePoint = data ? [{
        x: data.max_sharpe_portfolio.volatility,
        y: data.max_sharpe_portfolio.return,
        name: 'Max Sharpe'
    }] : []

    const minVolPoint = data ? [{
        x: data.min_vol_portfolio.volatility,
        y: data.min_vol_portfolio.return,
        name: 'Min Volatility'
    }] : []

    const currentPoint = [{
        x: currentVolatility,
        y: currentReturn,
        name: 'Current Portfolio'
    }]

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-indigo-600" />
                        Efficient Frontier Optimization
                    </h3>
                    <p className="text-sm text-slate-600">
                        Find the optimal portfolio balance using Modern Portfolio Theory
                    </p>
                </div>

                {!data && !loading && (
                    <button
                        onClick={handleOptimize}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Zap className="h-4 w-4 mr-2" />
                        Optimize Portfolio
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-600">Calculating optimal portfolios...</p>
                    <p className="text-xs text-slate-500 mt-1">Running quadratic optimization</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {data && (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Chart */}
                        <div className="h-[400px] lg:col-span-2" style={{ color: '#0f172a' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="Volatility"
                                        unit=""
                                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                        label={{ value: 'Risk (Volatility)', position: 'bottom', offset: 0 }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Return"
                                        unit=""
                                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                        label={{ value: 'Annualized Return', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-2 border border-slate-200 shadow-sm rounded">
                                                        <p className="font-semibold">{data.name || 'Efficient Frontier'}</p>
                                                        <p className="text-sm">Return: {formatPercent(data.y)}</p>
                                                        <p className="text-sm">Risk: {formatPercent(data.x)}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {/* Frontier Line */}
                                    <Scatter name="Efficient Frontier" data={chartData} fill="#818cf8" line shape="circle" />

                                    {/* Points */}
                                    <Scatter name="Current" data={currentPoint} fill="#3b82f6" shape="diamond">
                                        <LabelList dataKey="name" position="top" />
                                    </Scatter>
                                    <Scatter name="Max Sharpe" data={maxSharpePoint} fill="#10b981" shape="star">
                                        <LabelList dataKey="name" position="top" />
                                    </Scatter>
                                    <Scatter name="Min Volatility" data={minVolPoint} fill="#f59e0b" shape="triangle">
                                        <LabelList dataKey="name" position="bottom" />
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Stats */}
                        <div className="space-y-4">
                            {/* Max Sharpe */}
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                <div className="flex items-center mb-2">
                                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                                    <h4 className="font-semibold text-green-900">Max Sharpe Ratio</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div className="bg-white/50 p-2 rounded-lg">
                                        <div className="text-xs text-green-700 font-medium">Return</div>
                                        <div className="text-lg font-bold text-green-900">
                                            {Number.isFinite(data.max_sharpe_portfolio.return)
                                                ? formatPercent(data.max_sharpe_portfolio.return)
                                                : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-white/50 p-2 rounded-lg">
                                        <div className="text-xs text-green-700 font-medium">Risk</div>
                                        <div className="text-lg font-bold text-green-900">
                                            {formatPercent(data.max_sharpe_portfolio.volatility)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-600">
                                    <strong>Allocation:</strong>
                                    <ul className="mt-1 space-y-1">
                                        {Object.entries(data.max_sharpe_portfolio.weights)
                                            .filter(([_, w]) => w > 0.01)
                                            .sort(([_, a], [__, b]) => b - a)
                                            .map(([ticker, weight]) => (
                                                <li key={ticker} className="flex justify-between">
                                                    <span>{ticker}</span>
                                                    <span>{formatPercent(weight)}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Min Volatility */}
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                <div className="flex items-center mb-2">
                                    <Shield className="h-5 w-5 text-orange-600 mr-2" />
                                    <h4 className="font-semibold text-orange-900">Min Volatility</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div className="bg-white/50 p-2 rounded-lg">
                                        <div className="text-xs text-orange-700 font-medium">Return</div>
                                        <div className="text-lg font-bold text-orange-900">
                                            {Number.isFinite(data.min_vol_portfolio.return)
                                                ? formatPercent(data.min_vol_portfolio.return)
                                                : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-white/50 p-2 rounded-lg">
                                        <div className="text-xs text-orange-700 font-medium">Risk</div>
                                        <div className="text-lg font-bold text-orange-900">
                                            {formatPercent(data.min_vol_portfolio.volatility)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rebalancing Trades */}
            {data && data.rebalancing_trades && (
                <RebalancingTable trades={data.rebalancing_trades} />
            )}
        </div>
    )
}
