'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface BacktestChartProps {
    data: {
        dates: string[]
        portfolio: number[]
        benchmark: number[]
    }
}

export default function BacktestChart({ data }: BacktestChartProps) {
    // Transform data for Recharts
    const chartData = data.dates.map((date, i) => ({
        date,
        Portfolio: data.portfolio[i],
        Benchmark: data.benchmark[i]
    }))

    // Calculate final return for label
    const finalPortfolio = data.portfolio[data.portfolio.length - 1]
    const finalBenchmark = data.benchmark[data.benchmark.length - 1]
    const portfolioReturn = ((finalPortfolio - 10000) / 10000) * 100
    const benchmarkReturn = ((finalBenchmark - 10000) / 10000) * 100

    return (
        <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Growth of $10,000</h3>
                    <p className="text-sm text-slate-500">Hypothetical historical performance</p>
                </div>
                <div className="text-right">
                    <div className={`text-xl font-bold ${portfolioReturn >= benchmarkReturn ? 'text-green-600' : 'text-slate-700'}`}>
                        {formatCurrency(finalPortfolio)}
                    </div>
                    <div className="text-xs text-slate-500">
                        Total Return: <span className={portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {portfolioReturn > 0 ? '+' : ''}{portfolioReturn.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2)}`;
                            }}
                            minTickGap={50}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Value']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="Portfolio"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="Benchmark"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
