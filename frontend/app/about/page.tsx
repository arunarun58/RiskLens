export default function About() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">About RiskLens</h1>
            <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-700 mb-4">
                    RiskLens is a professional-grade portfolio risk analysis tool designed to help investors understand the true exposure of their investments.
                </p>
                <p className="text-slate-600 mb-4">
                    Our platform leverages real-time market data to calculate advanced risk metrics, including Value at Risk (VaR), volatility, and correlation matrices. Whether you are a retail investor or a financial professional, RiskLens provides the insights needed to build more resilient portfolios.
                </p>
                <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">Our Mission</h2>
                <p className="text-slate-600">
                    To democratize access to institutional-grade risk management tools, empowering everyone to make data-driven investment decisions.
                </p>
            </div>
        </div>
    )
}
