
import { Download } from 'lucide-react'
import { exportToPDF } from '@/lib/pdfExport'
import { RiskOutput } from '@/lib/types'
import { useState } from 'react'

interface ExportButtonProps {
    riskData: RiskOutput;
    portfolioName?: string;
}

export default function ExportButton({ riskData, portfolioName = 'My Portfolio' }: ExportButtonProps) {
    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
        setExporting(true)
        try {
            await exportToPDF(riskData, portfolioName)
        } catch (error) {
            console.error('Export failed', error)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={exporting}
            className={`
                inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white 
                bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500
                transition-all duration-200
                ${exporting ? 'opacity-75 cursor-wait' : ''}
            `}
        >
            <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? 'Generating Report...' : 'Export PDF Report'}
        </button>
    )
}
