'use client'

import { useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { formatPercent } from '@/lib/utils'

interface SectorBreakdownProps {
    data: {
        sectors: Record<string, number>
        countries: Record<string, number>
    }
}

const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#64748b'
]

export default function SectorBreakdown({ data }: SectorBreakdownProps) {
    const [view, setView] = useState<'sectors' | 'countries'>('sectors')

    // Transform data for Recharts
    const chartData = Object.entries(data[view])
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    return (
        <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Exposure Analysis</h3>
                    <p className="text-sm text-slate-500">Breakdown by {view === 'sectors' ? 'Sector' : 'Region'}</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setView('sectors')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'sectors' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Sector
                    </button>
                    <button
                        onClick={() => setView('countries')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === 'countries' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Region
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number | undefined) => formatPercent(value ?? 0)}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
