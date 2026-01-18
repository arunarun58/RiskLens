'use client'

import { RiskOutput } from '@/lib/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface RiskChartsProps {
    data: RiskOutput
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function RiskCharts({ data }: RiskChartsProps) {
    // Sort positions by weight for the pie chart
    const pieData = [...data.positions]
        .sort((a, b) => b.weight - a.weight)
        .map(pos => ({
            name: pos.ticker,
            value: pos.weight
        }))

    // Sort positions by risk contribution for the bar chart
    const riskData = [...data.positions]
        .sort((a, b) => b.risk_contribution_pct - a.risk_contribution_pct)
        .map(pos => ({
            name: pos.ticker,
            risk: pos.risk_contribution_pct
        }))

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Allocation */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Asset Allocation</h3>
                <div className="h-[300px]" style={{ color: '#0f172a' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number | undefined) => formatPercent(value ?? 0)}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Risk Contribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Risk Contribution</h3>
                <div className="h-[300px]" style={{ color: '#0f172a' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskData} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                            <YAxis dataKey="name" type="category" width={50} />
                            <Tooltip
                                formatter={(value: number | undefined) => formatPercent(value ?? 0)}
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            />
                            <Bar dataKey="risk" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
