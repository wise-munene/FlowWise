import { Link } from 'react-router-dom'
import axios from 'axios'
import { useRef, useState } from 'react'

export default function Home() {
    const formRef = useRef<HTMLFormElement>(null)
    const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
    const [menuOpen, setMenuOpen] = useState(false)

   

    const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactStatus('sending')

    const form = formRef.current
    if (!form) return

    const data = {
        name: (form.elements.namedItem('from_name') as HTMLInputElement).value,
        email: (form.elements.namedItem('from_email') as HTMLInputElement).value,
        subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
        message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/contact`, data)

        setContactStatus('sent')
        form.reset()
    } catch (err) {
        console.error('Contact error:', err)
        setContactStatus('error')
    }
}

    const features = [
        { icon: '📊', title: 'Track every shilling',   desc: "Log income and expenses in seconds — salary, a sale, or a weekly shopping trip." },
        { icon: '🎯', title: 'Budgets that work',      desc: 'Set monthly limits per category. Get alerted before you overspend.' },
        { icon: '📈', title: 'See the full picture',   desc: 'Charts and summaries show where your money comes from and where it goes.' },
        { icon: '📄', title: 'Reports on demand',      desc: 'Download PDF reports for your accountant or CSV files for your own records.' },
        { icon: '📱', title: 'M-Pesa integrated',      desc: 'Record Till and Paybill payments directly. Your M-Pesa life, tracked automatically.' },
        { icon: '👤', title: 'Personal & business',    desc: 'Works for your household budget and your business finances. One tool, two use cases.' },
    ]

    const steps = [
        { step: '01', title: 'Create your account', desc: 'Sign up free. Choose personal or business mode.' },
        { step: '02', title: 'Log your transactions', desc: 'Add income and expenses as they happen. Takes under 10 seconds.' },
        { step: '03', title: 'Understand your money', desc: 'Your dashboard updates instantly. Download reports anytime.' },
    ]

    const navLinks = [
        { href: '#features',    label: 'Features' },
        { href: '#how-it-works',label: 'How it works' },
        { href: '#about',       label: 'About' },
        { href: '#contact',     label: 'Contact' },
    ]

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* Google Font */}
            <link
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
                rel="stylesheet"
            />

            {/* ── NAVBAR ─────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
                            <span className="text-white text-sm font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>F</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 tracking-tight">FlowWise</span>
                    </div>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-7">
                        {navLinks.map(l => (
                            <a key={l.href} href={l.href}
                                className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
                                {l.label}
                            </a>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link to="/login"
                            className="text-sm text-gray-600 font-medium hover:text-blue-600 transition-colors px-4 py-2">
                            Log in
                        </Link>
                        <Link to="/signup"
                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200">
                            Get started free
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMenuOpen(o => !o)}
                        className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <span className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-gray-700 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-gray-700 transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </button>
                </div>

                {/* Mobile drawer */}
                {menuOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white px-5 py-4 flex flex-col gap-1">
                        {navLinks.map(l => (
                            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                                className="text-sm font-medium text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                {l.label}
                            </a>
                        ))}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                            <Link to="/login" onClick={() => setMenuOpen(false)}
                                className="flex-1 text-center text-sm font-medium text-gray-700 border border-gray-200 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                                Log in
                            </Link>
                            <Link to="/signup" onClick={() => setMenuOpen(false)}
                                className="flex-1 text-center text-sm font-semibold text-white bg-blue-600 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                                Get started
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pt-24 pb-32 px-5">

                {/* Background grid */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }} />

                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(ellipse, #3b82f6, transparent 70%)' }} />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/20 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        Built for Kenya — M-Pesa native
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-7"
                        style={{ letterSpacing: '-0.03em' }}>
                        Your money,
                        <br />
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #34d399)' }}>
                            finally clear.
                        </span>
                    </h1>

                    <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        Track income and expenses, set budgets, record M-Pesa payments, and download
                        reports — all in one place built for how Kenyans actually handle money.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link to="/signup"
                            className="w-full sm:w-auto text-center bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-4 rounded-xl transition-all text-sm shadow-lg shadow-blue-900/50 hover:shadow-blue-900/70 hover:-translate-y-0.5">
                            Start for free — no card needed
                        </Link>
                        <a href="#how-it-works"
                            className="w-full sm:w-auto text-center border border-white/15 hover:border-white/30 text-slate-300 hover:text-white font-medium px-8 py-4 rounded-xl transition-all text-sm backdrop-blur-sm">
                            See how it works →
                        </a>
                    </div>

                    {/* Social proof strip */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-slate-400 text-xs font-medium">
                        {['Free to start', 'KES native', 'M-Pesa integrated', 'PDF & CSV reports'].map((t, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {t}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DEMO VIDEO ──────────────────────────────────────────── */}
            <section className="bg-slate-950 pb-20 px-5">
                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 -mt-6">
                        <video controls className="w-full aspect-video object-cover bg-slate-900">
                            <source src="/demo.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </section>

            {/* ── STATS BAR ───────────────────────────────────────────── */}
            <section className="bg-slate-950 border-t border-white/5 pb-16 px-5">
                <div className="max-w-3xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                        {[
                            { value: 'Free',  label: 'Forever free tier' },
                            { value: 'KES',   label: 'Native currency' },
                            { value: '2-in-1',label: 'Personal & business' },
                            { value: 'M-Pesa',label: 'Payment integration' },
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-900 px-6 py-6 text-center">
                                <div className="text-xl font-bold text-blue-400 mb-1"
                                    style={{ fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── WHO IT'S FOR ────────────────────────────────────────── */}
            <section id="who-its-for" className="bg-white py-24 px-5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Who it's for</p>
                        <h2 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            Built for two types of people
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="rounded-2xl bg-blue-600 p-8 text-white relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-blue-500/40" />
                            <div className="relative">
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-200">For individuals</span>
                                <h3 className="text-2xl font-bold mt-3 mb-3 leading-snug">Know where your salary goes</h3>
                                <p className="text-blue-100 text-sm leading-relaxed">
                                    You earn every month but somehow it's gone before the next paycheck.
                                    FlowWise shows you exactly where — groceries, transport, entertainment —
                                    so you can budget smarter next time.
                                </p>
                                <Link to="/signup"
                                    className="inline-flex items-center gap-1 mt-6 text-sm font-semibold text-white border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                                    Get started free →
                                </Link>
                            </div>
                        </div>
                        <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-8 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gray-200/60" />
                            <div className="relative">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">For small businesses</span>
                                <h3 className="text-2xl font-bold mt-3 mb-3 text-gray-900 leading-snug">Run your business with clarity</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    Track sales, manage expenses, monitor cash flow and generate reports
                                    for your accountant — without hiring a full-time bookkeeper.
                                </p>
                                <Link to="/signup"
                                    className="inline-flex items-center gap-1 mt-6 text-sm font-semibold text-gray-700 border border-gray-200 bg-white px-4 py-2 rounded-lg hover:border-gray-300 transition-colors">
                                    Get started free →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ────────────────────────────────────────────── */}
            <section id="features" className="bg-gray-50 py-24 px-5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Features</p>
                        <h2 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            Everything you need
                        </h2>
                        <p className="text-gray-400 mt-3 text-sm max-w-md mx-auto">
                            Simple enough for anyone. Powerful enough for real financial management.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((f, i) => (
                            <div key={i}
                                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 hover:-translate-y-0.5 transition-all duration-200 group">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl mb-4 group-hover:bg-blue-100 transition-colors">
                                    {f.icon}
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────────────────────── */}
            <section id="how-it-works" className="bg-slate-950 py-24 px-5">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">How it works</p>
                        <h2 className="text-4xl font-bold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                            Up and running in minutes
                        </h2>
                        <p className="text-slate-400 mt-3 text-sm">No complicated setup. No accountant required.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map((s, i) => (
                            <div key={i} className="relative">
                                {/* Connector line */}
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-7 left-full w-full h-px bg-gradient-to-r from-blue-500/40 to-transparent -translate-x-1/2 z-0" />
                                )}
                                <div className="relative bg-slate-900 border border-white/8 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                                    <div className="text-4xl font-bold mb-4"
                                        style={{ fontFamily: "'DM Mono', monospace", color: 'rgba(96, 165, 250, 0.35)' }}>
                                        {s.step}
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/signup"
                            className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-blue-900/50 hover:-translate-y-0.5">
                            Create your free account →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── ABOUT ───────────────────────────────────────────────── */}
            <section id="about" className="bg-white py-24 px-5">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">Our story</p>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight"
                                style={{ letterSpacing: '-0.02em' }}>
                                Built for Kenya,<br />by people who get it
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                Most financial tools were built for Western markets. They're too complex,
                                too expensive, and simply don't understand how money moves in Kenya —
                                M-Pesa, chamas, daily cash businesses.
                            </p>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                FlowWise was designed here, for here. Whether you're a salaried employee
                                trying to save more each month, or a shop owner tracking daily sales —
                                FlowWise works the way you do.
                            </p>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Our goal is simple: give every Kenyan the financial clarity they deserve,
                                regardless of how much they earn.
                            </p>
                        </div>

                        <div className="bg-slate-950 rounded-2xl p-8 border border-white/5">
                            <div className="space-y-3">
                                {[
                                    'Designed for Kenyan users and businesses',
                                    'M-Pesa Till and Paybill integration built in',
                                    'Works for both personal and business finances',
                                    'No accounting knowledge required',
                                    'Generates reports your accountant understands',
                                    'Free to start — no credit card needed',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-2.5 h-2.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-slate-300 leading-snug">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CONTACT ─────────────────────────────────────────────── */}
            <section id="contact" className="bg-gray-50 py-24 px-5">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Contact</p>
                        <h2 className="text-4xl font-bold text-gray-900 tracking-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
                            Get in touch
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Have a question or feedback? We read every message.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm shadow-gray-100">
                        {contactStatus === 'sent' ? (
                            <div className="text-center py-10">
                                <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">Message sent!</h3>
                                <p className="text-sm text-gray-400 mb-5">We'll get back to you as soon as possible.</p>
                                <button onClick={() => setContactStatus('idle')}
                                    className="text-sm text-blue-600 font-medium hover:underline">
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form ref={formRef} onSubmit={handleContact} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                                        <input type="text" name="from_name" required placeholder="Jane Doe"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                                        <input type="email" name="from_email" required placeholder="you@example.com"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                                    <input type="text" name="subject" required placeholder="How can we help?"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                                    <textarea name="message" required rows={5} placeholder="Tell us what's on your mind..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none" />
                                </div>
                                {contactStatus === 'error' && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm">
                                        Failed to send. Please try again or email us at{' '}
                                        <a href="mailto:flowwise2026@gmail.com" className="underline">flowwise2026@gmail.com</a>
                                    </div>
                                )}
                                <button type="submit" disabled={contactStatus === 'sending'}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-3.5 rounded-xl transition-colors shadow-sm shadow-blue-200">
                                    {contactStatus === 'sending' ? 'Sending...' : 'Send message'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ───────────────────────────────────────────── */}
            <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 py-24 px-5 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }} />
                <div className="relative max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                        Ready to take control?
                    </h2>
                    <p className="text-slate-300 text-sm mb-10 leading-relaxed">
                        Join thousands of Kenyans managing their finances smarter.<br />
                        It takes less than a minute to get started.
                    </p>
                    <Link to="/signup"
                        className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-bold px-10 py-4 rounded-xl transition-all text-sm shadow-xl shadow-blue-900/50 hover:-translate-y-0.5">
                        Create your free account →
                    </Link>
                    <p className="text-slate-500 text-xs mt-4">No credit card required · Cancel anytime</p>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────── */}
            <footer className="bg-slate-950 border-t border-white/5 py-10 px-5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">F</span>
                        </div>
                        <span className="text-sm font-bold text-white">FlowWise</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {navLinks.map(l => (
                            <a key={l.href} href={l.href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                {l.label}
                            </a>
                        ))}
                        <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Log in</Link>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-2 text-xs text-slate-500">
                        <a href="mailto:flowwise2026@gmail.com" className="hover:text-slate-300 transition-colors">
                            flowwise2026@gmail.com
                        </a>
                        <span className="hidden md:inline">·</span>
                        <span>© 2026 FlowWise. Built for Kenya.</span>
                    </div>
                </div>
            </footer>

        </div>
    )
}