'use client'

import { useState, useEffect } from 'react'
import { PortfolioPosition, Portfolio, RiskOutput } from '@/lib/types'
import PortfolioForm from '@/components/PortfolioForm'
import RiskMetrics from '../../components/RiskMetrics'
import RiskCharts from '../../components/RiskCharts'
import PerformanceMetrics from '@/components/PerformanceMetrics'
import CorrelationHeatmap from '@/components/CorrelationHeatmap'
import ScenarioTester from '@/components/ScenarioTester'
import BenchmarkComparison from '@/components/BenchmarkComparison'
import MonteCarloVaR from '@/components/MonteCarloVaR'
import DrawdownChart from '@/components/DrawdownChart'
import EfficientFrontier from '@/components/EfficientFrontier'
import BacktestChart from '@/components/BacktestChart'
import SectorBreakdown from '@/components/SectorBreakdown'
import HoldingsTable from '@/components/HoldingsTable'
import { Loader2, TrendingUp, PieChart, BarChart3, Activity, Calendar, PlayCircle, Upload, AlertTriangle, Cloud, Save } from 'lucide-react'

import ExportButton from '@/components/ExportButton'
import ImportModal from '@/components/ImportModal'
import SavePortfolioModal from '@/components/SavePortfolioModal'
import CloudLoadModal from '@/components/CloudLoadModal'
import { savePortfolio } from '@/lib/api'
import { useSession } from 'next-auth/react'


const periods = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'YTD']

export default function PortfolioAnalysis() {
    const { data: session } = useSession()
    const [positions, setPositions] = useState<PortfolioPosition[]>([])
    const [riskData, setRiskData] = useState<RiskOutput | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPeriod, setSelectedPeriod] = useState('1Y')
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [isSaveOpen, setIsSaveOpen] = useState(false)
    const [isCloudLoadOpen, setIsCloudLoadOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'manage' | 'analytics'>('manage')
    const [activePortfolioId, setActivePortfolioId] = useState<number | null>(null)
    const [currentPortfolioName, setCurrentPortfolioName] = useState<string | null>(null)

    // Auto-refresh when period changes if we already have data
    useEffect(() => {
        if (positions.length > 0 && riskData) {
            analyzePortfolio()
        }
    }, [selectedPeriod])

    const handleCloudLoad = (data: any) => {
        setPositions(data.positions)
        setRiskData(null)
        setActivePortfolioId(data.id)
        setCurrentPortfolioName(data.name)
    }

    // "Save As" - Creates New
    const handleSaveNew = async (name: string, description: string) => {
        // @ts-ignore
        const token = session?.id_token
        if (!token) {
            alert("You must be logged in to save portfolios.")
            return
        }

        const saved = await savePortfolio({
            name,
            description,
            positions
        }, token)

        // Switch context to the new portfolio
        setActivePortfolioId(saved.id)
        setCurrentPortfolioName(saved.name)
        setIsSaveOpen(false)
    }

    // "Save" - Updates Existing
    const handleUpdate = async () => {
        // @ts-ignore
        const token = session?.id_token
        if (!token || !activePortfolioId) {
            alert("You must be logged in and have an active portfolio to update.")
            return
        }

        try {
            // Import updatePortfolio first (assumed added to api.ts)
            const { updatePortfolio } = await import('@/lib/api')
            await updatePortfolio(activePortfolioId, {
                // Keep existing name/desc for now? Ideally we'd have them in state. 
                // For simplicity, we assume user just wants to save positions.
                name: currentPortfolioName || "Untitled Portfolio",
                positions
            }, token)
            alert("Portfolio updated successfully!")
        } catch (e) {
            console.error(e)
            alert("Failed to update portfolio")
        }
    }

    const removePosition = (index: number) => {
        setPositions(positions.filter((_, i) => i !== index))
    }

    const handleImport = (importedPositions: PortfolioPosition[]) => {
        setPositions(prev => [...prev, ...importedPositions])
        setIsImportOpen(false)
        // Importing creates a modified state, so we might want to reset active ID 
        // OR keep it but implies "dirty" state. Let's keep ID so they can Update.
    }

    const analyzePortfolio = async () => {
        if (positions.length === 0) {
            setError('Please add at least one position')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const url = `http://localhost:8000/api/analyze?period=${selectedPeriod}`
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolio: {
                        positions: positions.map(p => ({
                            ticker: p.ticker,
                            quantity: p.quantity,
                            asset_class: p.asset_class,
                            avg_price: p.avg_price,
                            purchase_date: p.purchase_date
                        }))
                    }
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                let errorMessage = 'Failed to analyze portfolio'

                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map((e: any) => e.msg).join(', ')
                    } else if (typeof errorData.detail === 'object') {
                        errorMessage = JSON.stringify(errorData.detail)
                    } else {
                        errorMessage = errorData.detail
                    }
                }
                throw new Error(errorMessage)
            }

            const data = await response.json()
            setRiskData(data)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    // Switch to analytics tab on successful analysis
    const handleAnalyze = async () => {
        await analyzePortfolio()
        setActiveTab('analytics')
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header / Navigation */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-30 transition-all duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14 items-center relative">
                        <div className="hidden md:block w-[200px]">
                            {/* Show Current Portfolio Name if active */}
                            {currentPortfolioName && (
                                <div className="text-sm font-medium text-slate-600 flex items-center">
                                    <Cloud className="h-4 w-4 mr-2 text-blue-500" />
                                    {currentPortfolioName}
                                </div>
                            )}
                        </div>

                        {/* Tabs - Centered */}
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <nav className="flex space-x-1 p-1 bg-slate-100 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('manage')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'manage'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    Manage Portfolio
                                </button>
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'analytics'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    Analytics Dashboard
                                </button>
                            </nav>
                        </div>

                        <div className="flex items-center justify-end w-[200px]">
                            {riskData && <ExportButton riskData={riskData} portfolioName={currentPortfolioName || "My Portfolio"} />}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {activeTab === 'manage' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Portfolio Positions</h2>
                                    <p className="text-sm text-slate-500">Add assets to analyze or load a saved portfolio.</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setIsCloudLoadOpen(true)}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <Cloud className="h-4 w-4 mr-2 text-blue-600" />
                                        Load
                                    </button>

                                    <button
                                        onClick={() => setIsImportOpen(true)}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import
                                    </button>

                                    {positions.length > 0 && (
                                        <>
                                            {/* Save (Update) - Only if active portfolio exists */}
                                            {activePortfolioId && (
                                                <button
                                                    onClick={handleUpdate}
                                                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                    title="Overwrite current cloud portfolio"
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save
                                                </button>
                                            )}

                                            {/* Save As (New) */}
                                            <button
                                                onClick={() => setIsSaveOpen(true)}
                                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors border shadow-sm ${activePortfolioId
                                                        ? "text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
                                                        : "text-white bg-green-600 border-green-600 hover:bg-green-700"
                                                    }`}
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                {activePortfolioId ? "Save As..." : "Save to Cloud"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <PortfolioForm
                                positions={positions}
                                onPositionsChange={setPositions}
                                onAnalyze={handleAnalyze}
                                loading={loading}
                                riskData={riskData}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Period Selector & Controls */}
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-lg font-semibold text-slate-900">Risk Analysis</h2>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                                    Run Analysis
                                </button>
                            </div>
                            <div className="flex space-x-2">
                                {periods.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setSelectedPeriod(p)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${selectedPeriod === p
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
                                <Activity className="h-5 w-5 mr-2" />
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl border border-slate-200">
                                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                                <p className="text-slate-500 font-medium">Running Monte Carlo Simulations...</p>
                            </div>
                        ) : riskData ? (
                            <div className="space-y-8">
                                {/* Holdings Table */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="font-semibold text-slate-900">Portfolio Holdings</h3>
                                    </div>
                                    <HoldingsTable positions={riskData.positions} />
                                </div>

                                <div id="risk-metrics-section">
                                    <RiskMetrics data={riskData} />
                                </div>

                                <div className="space-y-6">
                                    {riskData.benchmark && (
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-900 mb-4">Benchmark Comparison</h3>
                                            <BenchmarkComparison
                                                data={riskData.benchmark}
                                                portfolioReturn={riskData.performance.annualized_return}
                                                portfolioVolatility={riskData.volatility_annualized}
                                                portfolioSharpe={riskData.performance.sharpe_ratio}
                                            />
                                        </div>
                                    )}
                                    <div id="portfolio-composition-section" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Portfolio composition</h3>
                                        <RiskCharts data={riskData} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {riskData.monte_carlo && (
                                        <div id="monte-carlo-section" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-900 mb-4">Value at Risk (VaR)</h3>
                                            <MonteCarloVaR
                                                data={riskData.monte_carlo}
                                                parametricVaR={riskData.var_95}
                                                portfolioValue={riskData.total_value}
                                            />
                                        </div>
                                    )}
                                    {riskData.drawdown && (
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-900 mb-4">Drawdown Analysis</h3>
                                            <DrawdownChart data={riskData.drawdown} />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {riskData.backtest && (
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-900 mb-4">Backtest (Growth of $10k)</h3>
                                            <BacktestChart data={riskData.backtest} />
                                        </div>
                                    )}
                                    {riskData.sector_breakdown && (
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-900 mb-4">Sector Exposure</h3>
                                            <SectorBreakdown data={riskData.sector_breakdown} />
                                        </div>
                                    )}
                                </div>

                                <div id="efficient-frontier-section" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Efficient Frontier Optimization</h3>
                                    <EfficientFrontier
                                        portfolio={{ positions }}
                                        currentReturn={riskData.performance.annualized_return}
                                        currentVolatility={riskData.volatility_annualized}
                                        period={selectedPeriod}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div id="risk-correlation-section" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Correlation Matrix</h3>
                                        <CorrelationHeatmap data={riskData.correlation_matrix} />
                                    </div>
                                    <div id="scenario-section" className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl text-white shadow-lg">
                                        <h3 className="text-lg font-bold mb-2">Scenario Stress Testing</h3>
                                        <p className="text-slate-400 mb-6 text-sm">Simulate market crash scenarios to test portfolio resilience.</p>
                                        <ScenarioTester portfolioValue={riskData.total_value} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-white rounded-xl border border-dashed border-slate-300">
                                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-medium text-slate-900 mb-2">Ready to Analyze</h3>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">Your portfolio is set up. Switch to the Manage tab to add positions, or click Analyze below if you already have them.</p>
                                <button
                                    onClick={() => setActiveTab('manage')}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                                >
                                    Go to Portfolio Manager
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <ImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImport={handleImport}
            />
            <SavePortfolioModal
                isOpen={isSaveOpen}
                onClose={() => setIsSaveOpen(false)}
                onSave={handleSaveNew}
            />
            <CloudLoadModal
                isOpen={isCloudLoadOpen}
                onClose={() => setIsCloudLoadOpen(false)}
                // @ts-ignore
                token={session?.id_token}
                onLoad={handleCloudLoad}
            />
        </div>
    )
}
