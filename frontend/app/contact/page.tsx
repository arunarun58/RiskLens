export default function Contact() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Developer Contact</h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-xl">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-1">Developer</h2>
                        <p className="text-lg text-slate-700">Arun Upadhyay</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-1">Email</h2>
                        <a href="mailto:upadhyayarun2058@gmail.com" className="text-lg text-blue-600 hover:underline">
                            upadhyayarun2058@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
