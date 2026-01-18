'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'

// Let's stick to standard input + simple drag/drop div to avoid extra deps if possible, or just install react-dropzone. 
// User instruction said "papaparse" but didn't explicitly forbid others. I'll use standard input for now to be safe/fast.

import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react'
import { PortfolioPosition } from '@/lib/types'

interface ImportModalProps {
    isOpen: boolean
    onClose: () => void
    onImport: (positions: PortfolioPosition[]) => void
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview'>('upload')
    const [parsedData, setParsedData] = useState<any[]>([])
    const [mapping, setMapping] = useState({ ticker: '', quantity: '', type: 'Equity' })
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length) {
                    setError('Error parsing CSV')
                    return
                }
                const data = results.data as any[]
                setParsedData(data)

                // Auto-detect columns
                const headers = results.meta.fields || []
                const tickerCol = headers.find(h => ['ticker', 'symbol', 'asset', 'code'].includes(h.toLowerCase())) || ''
                const qtyCol = headers.find(h => ['quantity', 'qty', 'shares', 'units'].includes(h.toLowerCase())) || ''

                setMapping(prev => ({ ...prev, ticker: tickerCol, quantity: qtyCol }))
                setStep('preview')
                setError(null)
            },
            error: (error) => {
                setError('Failed to read file: ' + error.message)
            }
        })
    }

    const handleConfirm = () => {
        if (!mapping.ticker || !mapping.quantity) {
            setError('Please map Ticker and Quantity columns')
            return
        }

        const positions: PortfolioPosition[] = parsedData
            .map(row => {
                const ticker = row[mapping.ticker]?.toString().trim().toUpperCase()
                const quantity = parseFloat(row[mapping.quantity])

                if (!ticker || isNaN(quantity)) return null

                return {
                    ticker,
                    quantity,
                    asset_class: 'Equity' // Default to Equity
                }
            })
            .filter((p): p is PortfolioPosition => p !== null)

        if (positions.length === 0) {
            setError('No valid positions found')
            return
        }

        onImport(positions)
        handleClose()
    }

    const handleClose = () => {
        setStep('upload')
        setParsedData([])
        setError(null)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Import Portfolio</h3>
                    <button onClick={handleClose} className="p-1 hover:bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}

                {step === 'upload' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Click to Upload CSV</h4>
                        <p className="text-sm text-slate-500 mt-1">or drag and drop file here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="text-sm font-medium text-slate-700 mb-3">Map Columns</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Ticker Column</label>
                                    <select
                                        value={mapping.ticker}
                                        onChange={e => setMapping({ ...mapping, ticker: e.target.value })}
                                        className="w-full text-sm rounded-md border-slate-300"
                                    >
                                        <option value="">Select...</option>
                                        {Object.keys(parsedData[0] || {}).map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Quantity Column</label>
                                    <select
                                        value={mapping.quantity}
                                        onChange={e => setMapping({ ...mapping, quantity: e.target.value })}
                                        className="w-full text-sm rounded-md border-slate-300"
                                    >
                                        <option value="">Select...</option>
                                        {Object.keys(parsedData[0] || {}).map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {Object.keys(parsedData[0] || {}).map(h => (
                                            <th key={h} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {parsedData.slice(0, 5).map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((v: any, j) => (
                                                <td key={j} className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap">{v}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500 text-center">Showing first 5 rows</p>

                        <button
                            onClick={handleConfirm}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Import {parsedData.length} Positions
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
