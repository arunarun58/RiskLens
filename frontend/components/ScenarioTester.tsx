'use client'

import { useState, useEffect } from 'react'
import { Zap, TrendingDown, Calendar, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Scenario {
    id: string
    name: string
    description: string
    severity: string
    icon: string
}

interface ScenarioImpact {
    scenario_name: string
    description: string
    date_range: [string, string]
    duration_days: number
    severity: string
    icon: string
    market_shock_pct: number
    original_value: number
    projected_value: number
    projected_loss: number
    loss_pct: number
}

interface ScenarioTesterProps {
    portfolioValue: number
}

export default function ScenarioTester({ portfolioValue }: ScenarioTesterProps) {
    const [scenarios, setScenarios] = useState<Scenario[]>([])
    const [selectedScenario, setSelectedScenario] = useState<string>('')
    const [impact, setImpact] = useState<ScenarioImpact | null>(null)
    const [loading, setLoading] = useState(false)

    // Fetch available scenarios on mount
    useEffect(() => {
        fetch('http://localhost:8000/api/scenarios')
            .then(res => res.json())
            .then(data => {
                setScenarios(data)
                if (data.length > 0) {
                    setSelectedScenario(data[0].id)
                }
            })
            .catch(err => console.error('Failed to load scenarios:', err))
    }, [])

    // Test scenario when selected or portfolio value changes
    useEffect(() => {
        if (selectedScenario && portfolioValue > 0) {
            testScenario(selectedScenario)
        }
    }, [selectedScenario, portfolioValue])

    const testScenario = async (scenarioId: string) => {
        setLoading(true)
        try {
            const response = await fetch(
                `http://localhost:8000/api/scenarios/${scenarioId}/test?portfolio_value=${portfolioValue}`,
                { method: 'POST' }
            )
            const data = await response.json()
            setImpact(data)
        } catch (err) {
            console.error('Failed to test scenario:', err)
        } finally {
            setLoading(false)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'extreme': return 'bg-red-100 text-red-800 border-red-300'
            case 'severe': return 'bg-orange-100 text-orange-800 border-orange-300'
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-300'
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-orange-600" />
                    Historical Stress Testing
                </h3>
                <p className="text-sm text-slate-600">
                    See how your portfolio would perform during major market crises
                </p>
            </div>

            {/* Scenario Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {scenarios.map(scenario => (
                    <button
                        key={scenario.id}
                        onClick={() => setSelectedScenario(scenario.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedScenario === scenario.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        <span className="mr-2">{scenario.icon}</span>
                        {scenario.name}
                    </button>
                ))}
            </div>

            {/* Impact Display */}
            {loading && (
                <div className="text-center py-8 text-slate-600">
                    Calculating impact...
                </div>
            )}

            {!loading && impact && (
                <div className="space-y-4">
                    {/* Scenario Info */}
                    <div className={`p-4 rounded-lg border-2 ${getSeverityColor(impact.severity)}`}>
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h4 className="font-semibold text-lg flex items-center">
                                    <span className="text-2xl mr-2">{impact.icon}</span>
                                    {impact.scenario_name}
                                </h4>
                                <p className="text-sm mt-1">{impact.description}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase">
                                {impact.severity}
                            </span>
                        </div>
                        <div className="flex items-center text-sm mt-3 space-x-4">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {impact.date_range[0]} to {impact.date_range[1]}
                            </div>
                            <div>
                                Duration: {impact.duration_days} days
                            </div>
                        </div>
                    </div>

                    {/* Impact Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="text-sm text-slate-600 mb-1">Original Value</div>
                            <div className="text-2xl font-bold text-slate-900">
                                {formatCurrency(impact.original_value)}
                            </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                            <div className="text-sm text-red-600 mb-1 flex items-center">
                                <TrendingDown className="h-4 w-4 mr-1" />
                                Projected Loss
                            </div>
                            <div className="text-2xl font-bold text-red-700">
                                {formatCurrency(impact.projected_loss)}
                            </div>
                            <div className="text-sm text-red-600 mt-1">
                                {formatPercent(impact.loss_pct / 100)} decline
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4">
                            <div className="text-sm text-slate-600 mb-1">Projected Value</div>
                            <div className="text-2xl font-bold text-slate-900">
                                {formatCurrency(impact.projected_value)}
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <strong>Historical simulation:</strong> This shows how your portfolio value would change if it experienced the same market shock as this historical event. Actual results may vary based on your specific holdings and market conditions.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
