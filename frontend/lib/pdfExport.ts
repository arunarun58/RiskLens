
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toJpeg } from 'html-to-image'
import { RiskOutput } from './types'

// Helper to format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

// Helper to format percent
const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
}

export async function exportToPDF(riskData: RiskOutput, portfolioName: string) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // --- Header ---
    doc.setFillColor(37, 99, 235) // Blue-600
    doc.rect(0, 0, pageWidth, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('RiskLens Report', 25, 25)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 25, 25, { align: 'right' })

    doc.setTextColor(51, 65, 85) // Slate-700
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(portfolioName, 25, 55)

    // --- Key Metrics Table ---
    // @ts-ignore
    autoTable(doc, {
        startY: 65,
        margin: { left: 25, right: 25 },
        head: [['Metric', 'Value', 'Description']],
        body: [
            ['Total Value', formatCurrency(riskData.total_value), 'Current market value of portfolio'],
            ['Annual Volatility', formatPercent(riskData.volatility_annualized), 'Standard deviation of annual returns'],
            ['VaR (95%)', formatCurrency(riskData.var_95), 'Maximum expected loss with 95% confidence'],
            ['Sharpe Ratio', riskData.performance.sharpe_ratio.toFixed(2), 'Risk-adjusted return measure'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10, cellPadding: 5 }
    })

    // --- Risk Metrics ---
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('Risk Analysis', 25, finalY)

    // @ts-ignore
    autoTable(doc, {
        startY: finalY + 5,
        margin: { left: 25, right: 25 },
        head: [['Asset', 'Weight', 'Risk Contribution', 'Marginal Risk']],
        body: riskData.positions.map(p => [
            p.ticker,
            formatPercent(p.weight || 0),
            formatPercent(p.risk_contribution_pct || 0),
            formatCurrency(p.marginal_risk || 0)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] }, // Slate-600
        styles: { fontSize: 9 }
    })

    // --- Charts Capture ---
    const sections = [
        'risk-metrics-section',
        'monte-carlo-section',
        'portfolio-composition-section',
        'risk-correlation-section',
        'efficient-frontier-section',
        'scenario-section',
        'explanation-section'
    ]

    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 10

    // Start visual analysis on a new page to save space logic complexity
    doc.addPage()
    finalY = 25
    doc.setFontSize(14)
    doc.setTextColor(37, 99, 235)
    doc.text('Visual Analysis', 25, 20)
    finalY = 30

    for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (!element) continue

        try {
            // OPTIMIZATION: Use JPEG and lower quality to reduce file size from ~100MB to ~2MB
            const imgData = await toJpeg(element, {
                quality: 0.70, // 70% quality is good enough for charts
                backgroundColor: '#ffffff'
            })

            const imgProps = doc.getImageProperties(imgData)
            const margin = 25
            const maxWidth = pageWidth - (margin * 2)
            const imgHeight = (imgProps.height * maxWidth) / imgProps.width

            // Check page break with buffer
            if (finalY + imgHeight > pageHeight - 25) {
                doc.addPage()
                finalY = 25
            }

            doc.addImage(imgData, 'JPEG', margin, finalY, maxWidth, imgHeight)
            finalY += imgHeight + 15 // Increased spacing

        } catch (e) {
            console.error(`Failed to capture section ${sectionId}`, e)
        }
    }

    // --- Premium Analytics (Text Summary) ---
    // Monte Carlo Summary is usually huge, so adding a page break before it if needed
    if (riskData.monte_carlo) {
        if (finalY + 40 > pageHeight - 20) {
            doc.addPage()
            finalY = 25
        } else {
            finalY += 10
        }

        doc.setFontSize(14)
        doc.setTextColor(37, 99, 235)
        doc.text('Monte Carlo Summary', 25, finalY)

        doc.setFontSize(10)
        doc.setTextColor(51, 65, 85)
        doc.text(`Simulated VaR (95%): ${formatCurrency(riskData.monte_carlo.mc_var_95)}`, 25, finalY + 10)
        doc.text(`Expected Shortfall (CVaR): ${formatCurrency(riskData.monte_carlo.mc_cvar_95)}`, 25, finalY + 17)
    }

    doc.save(`RiskLens_Report_${portfolioName.replace(/\s+/g, '_')}.pdf`)
}
