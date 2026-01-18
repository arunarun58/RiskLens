export default function Privacy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
            <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 mb-4">
                    Last updated: January 2026
                </p>
                <p className="text-slate-600 mb-4">
                    At RiskLens, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.
                </p>
                <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Data Collection</h2>
                <p className="text-slate-600 mb-4">
                    We collect minimal data necessary to provide our services, such as your portfolio positions (tickers and quantities) and your basic profile information (name and email) when you sign in with Google.
                </p>
                <h2 className="text-xl font-semibold text-slate-900 mt-6 mb-3">Data Usage</h2>
                <p className="text-slate-600 mb-4">
                    Your data is used solely for generating risk analysis reports and managing your saved portfolios. We do not sell your personal data to third parties.
                </p>
            </div>
        </div>
    )
}
