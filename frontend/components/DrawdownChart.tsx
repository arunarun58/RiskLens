'use client'

import { DrawdownMetrics } from '@/lib/types'
import { formatPercent } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingDown, Calendar, Clock } from 'lucide-react'

interface DrawdownChartProps {
    data: DrawdownMetrics
}

export default function DrawdownChart({ data }: DrawdownChartProps) {
    const getSeverityColor = (drawdown: number) => {
        if (drawdown >= -0.05) return 'text-green-700'
        if (drawdown >= -0.10) return 'text-yellow-700'
        if (drawdown >= -0.20) return 'text-orange-700'
        return 'text-red-700'
    }

    const getSeverityLabel = (drawdown: number) => {
        if (drawdown >= -0.05) return 'Low'
        if (drawdown >= -0.10) return 'Moderate'
        if (drawdown >= -0.20) return 'High'
        return 'Severe'
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                    <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                    Maximum Drawdown Analysis
                </h3>
                <p className="text-sm text-slate-600">
                    Worst peak-to-trough decline in portfolio value
                </p>
            </div>

            {/* Key Metrics - Vertical Stack */}
            <div className="flex flex-col gap-4 mb-6">
                {/* Maximum Drawdown */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-sm text-slate-600 font-medium">Maximum Drawdown</div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white ${getSeverityColor(data.max_drawdown)}`}>
                            {getSeverityLabel(data.max_drawdown)}
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                        <div>
                            <div className="text-3xl font-bold text-red-700 mb-1">
                                {formatPercent(data.max_drawdown)}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {data.max_drawdown_date || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Drawdown */}
                <div className={`rounded-lg p-4 border-2 ${data.current_drawdown < -0.05
                    ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                    : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.current_drawdown < -0.05 ? 'bg-orange-500' : 'bg-green-500'
                                }`}>
                                <TrendingDown className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-sm text-slate-600 font-medium">Current Drawdown</div>
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                        <div>
                            <div className={`text-3xl font-bold mb-1 ${data.current_drawdown < -0.05 ? 'text-orange-700' : 'text-green-700'
                                }`}>
                                {formatPercent(data.current_drawdown)}
                            </div>
                            <div className="text-xs text-slate-500">
                                {data.current_drawdown === 0 ? 'At peak' : 'Below peak'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recovery Time */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-sm text-slate-600 font-medium">Recovery Time</div>
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-2">
                        <div>
                            <div className="text-3xl font-bold text-blue-700 mb-1">
                                {data.recovery_time_days}
                            </div>
                            <div className="text-xs text-slate-500">
                                {data.recovery_time_days > 0 ? 'Days to recover' : 'Not recovered yet'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drawdown Chart */}
            <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Drawdown Over Time</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.drawdown_series}>
                        <defs>
                            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return `${date.getMonth() + 1}/${date.getDate()}`
                            }}
                        />
                        <YAxis
                            stroke="#64748b"
                            style={{ fontSize: '12px' }}
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                            formatter={(value: number | undefined) => [`${formatPercent(value ?? 0)}`, 'Drawdown']}
                            labelFormatter={(label) => `Date: ${label}`}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="drawdown"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#drawdownGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Explanation */}
            <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Understanding Drawdown</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                    <li>
                        <strong>Maximum Drawdown:</strong> The largest peak-to-trough decline in your portfolio's history
                    </li>
                    <li>
                        <strong>Current Drawdown:</strong> How far below the peak your portfolio is right now
                    </li>
                    <li>
                        <strong>Recovery Time:</strong> How long it took to recover from the maximum drawdown
                    </li>
                    <li>
                        <strong>Lower is riskier:</strong> A -20% drawdown means you lost 20% from the peak
                    </li>
                </ul>
            </div>
        </div>
    )
}
