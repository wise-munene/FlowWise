import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
    const formRef = useRef<HTMLFormElement>(null)
    const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

    useEffect(() => {
    emailjs.init('7nJJoOeCr9Jxb5wnx')
    }, [])
    
    const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactStatus('sending')

    const form = formRef.current
    if (!form) return

    const templateParams = {
        from_name: (form.elements.namedItem('from_name') as HTMLInputElement).value,
        from_email: (form.elements.namedItem('from_email') as HTMLInputElement).value,
        subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
        message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
        await emailjs.send(
            'service_9pj6uei',
            'template_44colwr',
            templateParams,
            '7nJJoOeCr9Jxb5wnx'
        )
        setContactStatus('sent')
        formRef.current?.reset()
    } catch (err) {
        console.error('EmailJS error:', err)
        setContactStatus('error')
    }
}

    const features = [
        {
            icon: '📊',
            title: 'Track every shilling',
            desc: 'Log income and expenses in seconds — whether it\'s a salary, a sale, or a weekly shopping trip.'
        },
        {
            icon: '🎯',
            title: 'Budgets that work',
            desc: 'Set monthly limits for rent, groceries, transport or any category. Get alerted before you overspend.'
        },
        {
            icon: '📈',
            title: 'See the full picture',
            desc: 'Charts and summaries show where your money comes from and where it goes — at a glance.'
        },
        {
            icon: '📄',
            title: 'Reports on demand',
            desc: 'Download PDF reports for your accountant or CSV files for your own records. Anytime.'
        },
        {
            icon: '🔔',
            title: 'Spending alerts',
            desc: 'Real-time warnings when you\'re approaching your limits so you can adjust before it\'s too late.'
        },
        {
            icon: '👤',
            title: 'Personal & business',
            desc: 'Works for your household budget and your business finances. One tool, two use cases.'
        },
    ]

    const useCases = [
        {
            type: 'For individuals',
            title: 'Know where your salary goes',
            desc: 'You earn every month but somehow it runs out before the next paycheck. FlowWise shows you exactly where it went — groceries, transport, entertainment — so you can budget smarter next time.',
            color: 'bg-blue-50 border-blue-100',
            tag: 'bg-blue-100 text-blue-700'
        },
        {
            type: 'For small businesses',
            title: 'Run your business with clarity',
            desc: 'Track sales, manage expenses, monitor cash flow and generate reports for your accountant — without hiring a full-time bookkeeper.',
            color: 'bg-gray-50 border-gray-100',
            tag: 'bg-gray-200 text-gray-700'
        },
    ]

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">F</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">FlowWise</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                        <a href="#who-its-for" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Who it's for</a>
                        <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</a>
                        <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-sm text-gray-700 font-medium hover:text-blue-600 transition-colors px-4 py-2">
                            Log in
                        </Link>
                        <Link to="/signup" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors">
                            Get started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="bg-gradient-to-b from-blue-50 to-white pt-20 pb-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        For individuals and businesses in Kenya
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                        Your money,
                        <br />
                        <span className="text-blue-600">finally under control</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Whether you're managing your household budget or running a small business —
                        FlowWise gives you the tools to track, budget, and understand your finances.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-sm shadow-lg shadow-blue-200">
                            Get started free
                        </Link>
                        <Link to="/login" className="border border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-medium px-8 py-3.5 rounded-lg transition-colors text-sm">
                            Sign in
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats bar */}
            <section className="border-y border-gray-100 bg-white py-8">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        {[
                            { value: 'Free', label: 'Free to get started' },
                            { value: 'KES', label: 'Native currency support' },
                            { value: '2-in-1', label: 'Personal & business' },
                        ].map((s, i) => (
                            <div key={i}>
                                <div className="text-2xl font-bold text-blue-600 mb-1">{s.value}</div>
                                <div className="text-xs text-gray-500">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Who it's for */}
            <section id="who-its-for" className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Who is FlowWise for?</h2>
                        <p className="text-gray-500 text-sm max-w-xl mx-auto">
                            Built for two types of people — both equally important.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {useCases.map((u, i) => (
                            <div key={i} className={`rounded-2xl border p-8 ${u.color}`}>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${u.tag}`}>
                                    {u.type}
                                </span>
                                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-3">{u.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{u.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="bg-gray-50 py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Everything you need
                        </h2>
                        <p className="text-gray-500 text-sm max-w-xl mx-auto">
                            Simple enough for anyone to use. Powerful enough for real financial management.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-200">
                                <div className="text-2xl mb-4">{f.icon}</div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="bg-blue-600 py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Up and running in minutes</h2>
                    <p className="text-blue-200 text-sm mb-12 max-w-xl mx-auto">
                        No complicated setup. No accountant required. Just sign up and start.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Create your account', desc: 'Sign up free. Choose personal or business mode depending on your needs.' },
                            { step: '02', title: 'Log your transactions', desc: 'Add income and expenses as they happen. Takes less than 10 seconds each.' },
                            { step: '03', title: 'Understand your money', desc: 'Your dashboard updates instantly. Download reports whenever you need them.' },
                        ].map((s, i) => (
                            <div key={i} className="text-left">
                                <div className="text-5xl font-bold text-blue-400 mb-3">{s.step}</div>
                                <h3 className="text-sm font-semibold text-white mb-2">{s.title}</h3>
                                <p className="text-sm text-blue-200 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12">
                        <Link to="/signup" className="inline-block bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-3.5 rounded-lg transition-colors text-sm">
                            Get started free
                        </Link>
                    </div>
                </div>
            </section>

            {/* About */}
            <section id="about" className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for Kenya</h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                Most financial tools were built for Western markets. They're too complex,
                                too expensive, or simply don't understand how money moves in Kenya.
                            </p>
                            <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                FlowWise was designed here, for here. Whether you're a salaried employee
                                trying to save more each month, or a shop owner tracking daily sales and
                                expenses — FlowWise works for you.
                            </p>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Our goal is simple — give every Kenyan the financial clarity they
                                deserve, regardless of how much they earn or whether they have
                                an accountant.
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-8">
                            <div className="space-y-4">
                                {[
                                    'Designed for Kenyan users and businesses',
                                    'Works for both personal and business finances',
                                    'No accounting knowledge required',
                                    'Generates reports your accountant will understand',
                                    'Free to start — no credit card needed',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section id="contact" className="bg-gray-50 py-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Get in touch</h2>
                        <p className="text-gray-500 text-sm">
                            Have a question, suggestion, or want to give feedback? We read every message.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                        {contactStatus === 'sent' ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Message sent</h3>
                                <p className="text-sm text-gray-500">We'll get back to you as soon as possible.</p>
                                <button
                                    onClick={() => setContactStatus('idle')}
                                    className="mt-4 text-sm text-blue-600 hover:underline"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form ref={formRef} onSubmit={handleContact} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            name="from_name"
                                            required
                                            placeholder="John Doe"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="from_email"
                                            required
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        required
                                        placeholder="How can we help?"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows={5}
                                        placeholder="Tell us what's on your mind..."
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>
                                {contactStatus === 'error' && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                        Failed to send. Please try again or email us directly.
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={contactStatus === 'sending'}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-3 rounded-lg transition-colors"
                                >
                                    {contactStatus === 'sending' ? 'Sending...' : 'Send message'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Ready to get started?
                    </h2>
                    <p className="text-gray-500 text-sm mb-8">
                        It takes less than a minute to create your account. No credit card required.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3.5 rounded-lg transition-colors text-sm shadow-lg shadow-blue-200"
                    >
                        Create your free account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">F</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">FlowWise</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#features" className="text-xs text-gray-400 hover:text-gray-600">Features</a>
                        <a href="#about" className="text-xs text-gray-400 hover:text-gray-600">About</a>
                        <a href="#contact" className="text-xs text-gray-400 hover:text-gray-600">Contact</a>
                        <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600">Log in</Link>
                    </div>
                    <p className="text-xs text-gray-400">© 2026 FlowWise. Built for Kenya.</p>
                </div>
            </footer>

        </div>
    )
}