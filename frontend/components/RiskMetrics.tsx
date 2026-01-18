'use client'

import { RiskOutput } from '@/lib/types'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, ShieldCheck } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface RiskMetricsProps {
    data: RiskOutput
}

export default function RiskMetrics({ data }: RiskMetricsProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Key Risk Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Value */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Portfolio Value</span>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(data.total_value)}
                    </div>
                </div>

                {/* VaR (95%) */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-red-600">Value at Risk (95%)</span>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                        {formatCurrency(data.var_95)}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                        Expected max loss with 95% confidence
                    </div>
                </div>

                {/* Annualized Volatility */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-orange-600">Annual Volatility</span>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700">
                        {formatPercent(data.volatility_annualized)}
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                        Standard deviation of returns
                    </div>
                </div>

                {/* Sharpe Ratio */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600">Sharpe Ratio</span>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                        {data.performance.sharpe_ratio.toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                        Risk-adjusted return
                    </div>
                </div>
            </div>
        </div>
    )
}
