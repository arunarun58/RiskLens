import { useState, useEffect } from 'react'
import { Loader2, Cloud, Download, Trash2, Calendar, Folder } from 'lucide-react'
import { listPortfolios, getPortfolio, deletePortfolio } from '@/lib/api'
import { PortfolioSummary, Portfolio } from '@/lib/types'

interface CloudLoadModalProps {
    isOpen: boolean
    onClose: () => void
    token: string | null
    onLoad: (portfolio: any) => void
}

export default function CloudLoadModal({ isOpen, onClose, token, onLoad }: CloudLoadModalProps) {
    const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Fetch list on open
    useEffect(() => {
        if (isOpen && token) {
            fetchList()
        }
    }, [isOpen, token])

    const fetchList = async () => {
        if (!token) return
        try {
            setLoading(true)
            const list = await listPortfolios(token)
            setPortfolios(list)
        } catch (err) {
            setError('Failed to load your portfolios')
        } finally {
            setLoading(false)
        }
    }

    const handleLoad = async (id: number) => {
        if (!token) return
        try {
            setLoadingId(id)
            const detailed = await getPortfolio(id, token)
            onLoad(detailed) // Pass full details back
            onClose()
        } catch (err) {
            setError('Failed to load portfolio details')
        } finally {
            setLoadingId(null)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation() // Prevent loading when clicking delete
        if (!token || !confirm('Are you sure you want to delete this portfolio?')) return

        try {
            await deletePortfolio(id, token)
            // Remove from list immediately
            setPortfolios(prev => prev.filter(p => p.id !== id))
        } catch (err) {
            alert('Failed to delete portfolio')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center">
                        <Cloud className="h-5 w-5 mr-2 text-blue-600" />
                        My Cloud Portfolios
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="p-3 mb-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
                            <p className="text-slate-500">Loading your portfolios...</p>
                        </div>
                    ) : portfolios.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <Folder className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No saved portfolios yet.</p>
                            <p className="text-slate-400 text-sm mt-1">Save a portfolio to see it here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {portfolios.map((p) => (
                                <div
                                    key={p.id}
                                    className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => handleLoad(p.id)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center mb-1">
                                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {p.name}
                                            </h3>
                                        </div>
                                        {p.description && (
                                            <p className="text-slate-500 text-sm line-clamp-1 mb-2">{p.description}</p>
                                        )}
                                        <div className="flex items-center text-xs text-slate-400">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Updated {new Date(p.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(e, p.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Portfolio"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleLoad(p.id)
                                            }}
                                            disabled={loadingId === p.id}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Load Portfolio"
                                        >
                                            {loadingId === p.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Download className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
