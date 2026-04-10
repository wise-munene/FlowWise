import { Link } from 'react-router-dom'

export default function Home() {
    const features = [
        {
            title: 'Track income & expenses',
            desc: 'Log every transaction in seconds. Categorize and filter with ease.'
        },
        {
            title: 'Smart budgets',
            desc: 'Set spending limits per category. Get alerts before you overspend.'
        },
        {
            title: 'Visual dashboard',
            desc: 'See your finances at a glance with clear charts and summaries.'
        },
        {
            title: 'Downloadable reports',
            desc: 'Export your data as CSV or PDF to share with your accountant.'
        },
    ]

    return (
        <div className="min-h-screen bg-white">

            {/* Public navbar */}
            <nav className="border-b border-gray-100 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">FlowWise</span>
                    <div className="flex items-center gap-4">
                        <a href="#about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">About</a>
                        <a href="#contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Contact</a>
                        <Link
                            to="/login"
                            className="text-sm text-blue-600 font-medium hover:underline"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/signup"
                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            Get started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-6 py-20 text-center">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
                    Take control of your
                    <span className="text-blue-600"> finances</span>
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
                    FlowWise helps small businesses and individuals in Kenya track income,
                    manage budgets, and understand where their money goes.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        to="/signup"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors text-sm"
                    >
                        Start for free
                    </Link>
                    <Link
                        to="/login"
                        className="border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-8 py-3 rounded-lg transition-colors text-sm"
                    >
                        Sign in
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
                        Everything you need
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About */}
            <section id="about" className="max-w-5xl mx-auto px-6 py-16">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About FlowWise</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        FlowWise was built for Kenyan SMEs and individuals who need a simple,
                        reliable way to manage their money. Most financial tools are too complex
                        or too expensive. FlowWise is different — straightforward, local, and
                        built with the Kenyan market in mind. Whether you run a small shop,
                        a freelance business, or just want to understand your personal spending,
                        FlowWise gives you the clarity you need.
                    </p>
                </div>
            </section>

            {/* Contact */}
            <section id="contact" className="bg-gray-50 py-16">
                <div className="max-w-xl mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in touch</h2>
                    <p className="text-gray-500 text-sm mb-8">
                        Have questions or feedback? We'd love to hear from you.
                    </p>
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Your name"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="email"
                                placeholder="Your email"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <textarea
                                placeholder="Your message"
                                rows={4}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                                Send message
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-8">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <p className="text-sm text-gray-400">
                        © 2026 FlowWise. Built for Kenya.
                    </p>
                </div>
            </footer>

        </div>
    )
}