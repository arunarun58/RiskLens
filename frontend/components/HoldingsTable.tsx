'use client'

import { PositionDetail } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface HoldingsTableProps {
    positions: PositionDetail[]
}

export default function HoldingsTable({ positions }: HoldingsTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Ticker</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right">Avg Price</th>
                        <th className="px-4 py-3 text-right">Current Price</th>
                        <th className="px-4 py-3 text-right">Market Value</th>
                        <th className="px-4 py-3 text-right">Unrealized P/L</th>
                        <th className="px-4 py-3 text-right">Return %</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Weight</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {positions.map((pos) => {
                        const isProfit = pos.unrealized_pl ? pos.unrealized_pl > 0 : null
                        const hasCostBasis = pos.avg_price !== undefined && pos.avg_price !== null

                        return (
                            <tr key={pos.ticker} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                    {pos.ticker}
                                    {pos.purchase_date && (
                                        <div className="text-xs text-slate-400 font-normal">
                                            Bot {new Date(pos.purchase_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {pos.quantity}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {hasCostBasis ? formatCurrency(pos.avg_price!) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900 font-medium">
                                    {formatCurrency(pos.current_price)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900 font-bold">
                                    {formatCurrency(pos.value)}
                                </td>
                                <td className={`px-4 py-3 text-right font-medium ${isProfit === true ? 'text-green-600' : isProfit === false ? 'text-red-600' : 'text-slate-400'
                                    }`}>
                                    {hasCostBasis ? formatCurrency(pos.unrealized_pl!) : '—'}
                                </td>
                                <td className={`px-4 py-3 text-right font-medium ${isProfit === true ? 'text-green-600' : isProfit === false ? 'text-red-600' : 'text-slate-400'
                                    }`}>
                                    {hasCostBasis ? (
                                        <div className="flex items-center justify-end">
                                            {isProfit ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                            {formatPercent(pos.unrealized_pl_pct! / 100)}
                                        </div>
                                    ) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                    {formatPercent(pos.weight)}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
