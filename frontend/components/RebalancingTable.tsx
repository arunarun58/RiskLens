'use client'

import { TradeRecommendation } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

interface RebalancingTableProps {
    trades: TradeRecommendation[]
}

export default function RebalancingTable({ trades }: RebalancingTableProps) {
    if (!trades || trades.length === 0) return null

    return (
        <div className="mt-8 animate-fade-in">
            <h4 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                Rebalancing Recommendations
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                    Target: Max Sharpe Ratio
                </span>
            </h4>

            <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Shares</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Value</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight Adjustment</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {trades.map((trade) => (
                            <tr key={trade.ticker} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                    {trade.ticker}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trade.action === 'BUY'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {trade.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 font-mono">
                                    {trade.shares}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 font-medium font-mono">
                                    {formatCurrency(trade.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xs">{formatPercent(trade.current_weight)}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs font-medium text-slate-900">{formatPercent(trade.target_weight)}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center italic">
                *Approximation based on last known price. Verify live prices before execution.
            </p>
        </div>
    )
}
