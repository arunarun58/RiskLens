'use client'

import { useState } from 'react'
import { PortfolioPosition, RiskOutput } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

interface PortfolioFormProps {
    positions: PortfolioPosition[]
    onPositionsChange: (positions: PortfolioPosition[]) => void
    onAnalyze: () => void
    loading: boolean
    riskData: RiskOutput | null
}

export default function PortfolioForm({ positions, onPositionsChange, onAnalyze, loading, riskData }: PortfolioFormProps) {
    const [ticker, setTicker] = useState('')
    const [quantity, setQuantity] = useState('')
    const [assetClass, setAssetClass] = useState<'Equity' | 'Bond' | 'Cash'>('Equity')

    const [avgPrice, setAvgPrice] = useState('')
    const [purchaseDate, setPurchaseDate] = useState('')

    const [validationState, setValidationState] = useState<{
        isValid: boolean | null;
        name?: string;
        message?: string;
    }>({ isValid: null })
    const [isValidating, setIsValidating] = useState(false)

    const [editingIndex, setEditingIndex] = useState<number | null>(null)

    // Calculate summary metrics
    const totalInvestment = positions.reduce((sum, pos) => {
        return sum + (pos.quantity * (pos.avg_price || 0))
    }, 0)

    const riskPositionsMap = riskData?.positions ? new Map(riskData.positions.map(p => [p.ticker, p])) : null
    const currentPortfolioValue = riskData?.total_value || 0
    const netGain = currentPortfolioValue - totalInvestment
    const netGainPct = totalInvestment > 0 ? (netGain / totalInvestment) * 100 : 0

    const validateTicker = async () => {
        if (!ticker) {
            setValidationState({ isValid: null })
            return
        }

        setIsValidating(true)
        try {
            const response = await fetch(`http://localhost:8000/api/validate-ticker/${ticker.toUpperCase()}`)
            const data = await response.json()

            if (data.valid) {
                setValidationState({ isValid: true, name: data.name })
            } else {
                setValidationState({ isValid: false, message: 'Invalid Ticker' })
            }
        } catch (error) {
            console.error('Validation failed', error)
        } finally {
            setIsValidating(false)
        }
    }

    const handleEditPosition = (index: number) => {
        const position = positions[index]
        setTicker(position.ticker)
        setQuantity(position.quantity.toString())
        setAssetClass(position.asset_class)
        setAvgPrice(position.avg_price?.toString() || '')
        setPurchaseDate(position.purchase_date || '')
        setEditingIndex(index)
        // Reset validation since existing position is presumed valid or will be re-validated
        setValidationState({ isValid: true, name: '' })
    }

    const cancelEdit = () => {
        setTicker('')
        setQuantity('')
        setAvgPrice('')
        setPurchaseDate('')
        setEditingIndex(null)
        setValidationState({ isValid: null })
    }

    const handleAddPosition = () => {
        if (!ticker || !quantity) return
        if (validationState.isValid === false) return

        const newPosition: PortfolioPosition = {
            ticker: ticker.toUpperCase(),
            quantity: parseFloat(quantity),
            asset_class: assetClass,
            avg_price: avgPrice ? parseFloat(avgPrice) : undefined,
            purchase_date: purchaseDate || undefined
        }

        if (editingIndex !== null) {
            // Update existing position
            const updatedPositions = [...positions]
            updatedPositions[editingIndex] = newPosition
            onPositionsChange(updatedPositions)
            setEditingIndex(null)
        } else {
            // Add new position
            onPositionsChange([...positions, newPosition])
        }

        setTicker('')
        setQuantity('')
        setAvgPrice('')
        setPurchaseDate('')
        setValidationState({ isValid: null })
    }

    const handleRemovePosition = (index: number) => {
        onPositionsChange(positions.filter((_, i) => i !== index))
        if (editingIndex === index) {
            cancelEdit()
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddPosition()
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Form */}
            <div className="md:col-span-5 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <Plus className="h-5 w-5 mr-2 text-blue-600" />
                        {editingIndex !== null ? 'Edit Position' : 'Add Asset'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ticker Symbol</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={ticker}
                                    onChange={(e) => {
                                        setTicker(e.target.value)
                                        setValidationState({ isValid: null })
                                    }}
                                    onBlur={validateTicker}
                                    onKeyPress={handleKeyPress}
                                    placeholder="e.g., AAPL"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${validationState.isValid === false ? 'border-red-500 bg-red-50' :
                                        validationState.isValid === true ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                />
                                {isValidating && (
                                    <div className="absolute right-3 top-2.5">
                                        <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full block"></span>
                                    </div>
                                )}
                            </div>
                            {validationState.isValid === true && (
                                <p className="text-xs text-green-600 mt-1 flex items-center">
                                    <span className="mr-1">✓</span> {validationState.name}
                                </p>
                            )}
                            {validationState.isValid === false && (
                                <p className="text-xs text-red-600 mt-1">
                                    Invalid ticker symbol. Please check and try again.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="100"
                                    min="0"
                                    step="any"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Avg Price ($)</label>
                                <input
                                    type="number"
                                    value={avgPrice}
                                    onChange={(e) => setAvgPrice(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Optional"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Class</label>
                                <select
                                    value={assetClass}
                                    onChange={(e) => setAssetClass(e.target.value as 'Equity' | 'Bond' | 'Cash')}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all bg-white"
                                >
                                    <option value="Equity">Equity</option>
                                    <option value="Bond">Bond</option>
                                    <option value="Cash">Cash</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-300 transition-all text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex space-x-3">
                            <button
                                onClick={handleAddPosition}
                                disabled={!ticker || !quantity}
                                className={`flex-1 flex items-center justify-center px-4 py-2.5 text-white font-medium rounded-lg transition-all shadow-sm ${editingIndex !== null
                                    ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                                    : 'bg-slate-900 hover:bg-slate-800 hover:shadow-md'
                                    } disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none`}
                            >
                                {editingIndex !== null ? 'Update Position' : 'Add Position'}
                            </button>
                            {editingIndex !== null && (
                                <button
                                    onClick={cancelEdit}
                                    className="px-4 py-2.5 text-slate-600 bg-slate-100 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Analyze Button - Sticky on Mobile, Block on Desktop */}
                <button
                    onClick={onAnalyze}
                    disabled={positions.length === 0 || loading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"></span>
                            Analyzing Portfolio...
                        </span>
                    ) : (
                        'Run Risk Analysis'
                    )}
                </button>
            </div>

            {/* Right Column: List */}
            <div className="md:col-span-7">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[400px]">
                    {/* Summary Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Current Holdings</h2>
                            <span className="text-sm font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">{positions.length} Assets</span>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[140px] bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs font-medium text-slate-500 mb-1">Total Investment</div>
                                <div className="text-lg font-semibold text-slate-900 break-words">
                                    {totalInvestment > 0 ? `$${totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                </div>
                            </div>
                            <div className="flex-1 min-w-[140px] bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs font-medium text-slate-500 mb-1">Current Value</div>
                                <div className="text-lg font-semibold text-slate-900 break-words">
                                    {riskData ? `$${currentPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                </div>
                            </div>
                            <div className="flex-1 min-w-[140px] bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-xs font-medium text-slate-500 mb-1">Net Gain</div>
                                <div className={`text-lg font-semibold break-words ${riskData ? (netGain >= 0 ? 'text-green-600' : 'text-red-600') : 'text-slate-900'}`}>
                                    {riskData ? (
                                        <>
                                            {netGain >= 0 ? '+' : ''}{netGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <span className="text-xs ml-1 font-medium select-none">({netGainPct >= 0 ? '+' : ''}{netGainPct.toFixed(2)}%)</span>
                                        </>
                                    ) : '—'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {positions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Plus className="h-8 w-8 text-slate-300" />
                                </div>
                                <p className="text-lg font-medium text-slate-600 mb-1">No positions yet</p>
                                <p className="text-sm">Add assets on the left to build your portfolio</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {positions.map((position, index) => {
                                    const riskPos = riskPositionsMap?.get(position.ticker)
                                    const hasRiskData = !!riskPos

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => handleEditPosition(index)}
                                            className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${editingIndex === index
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${editingIndex === index ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                                                    }`}>
                                                    {position.ticker.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg">{position.ticker}</div>
                                                    <div className="text-sm text-slate-500 font-medium">
                                                        {position.asset_class}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-6">
                                                <div className="text-right">
                                                    <div className="font-bold text-slate-900">
                                                        {hasRiskData ? `$${riskPos.current_price.toFixed(2)}` : `${position.quantity} units`}
                                                    </div>
                                                    {hasRiskData && (
                                                        <div className={`text-sm font-medium ${riskPos.unrealized_pl && riskPos.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {riskPos.unrealized_pl ? (
                                                                <>
                                                                    {riskPos.unrealized_pl >= 0 ? '+' : ''}{riskPos.unrealized_pl.toFixed(2)}
                                                                </>
                                                            ) : '—'}
                                                        </div>
                                                    )}
                                                    {!hasRiskData && position.avg_price && (
                                                        <div className="text-sm text-slate-500">
                                                            @ ${position.avg_price.toFixed(2)}
                                                        </div>
                                                    )}
                                                    {!hasRiskData && !position.avg_price && (
                                                        <div className="text-sm text-slate-400 italic">No Data</div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemovePosition(index);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove position"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
