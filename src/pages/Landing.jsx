import { Link } from 'react-router-dom'
import { Sparkles, FileText, Wallet2, Calculator, HeartHandshake, BookOpen, ArrowRight } from 'lucide-react'

const FEATURES = [
  { icon: Sparkles,       title: 'AI Pathway Advisor',     desc: 'Enter your marks. Google Gemini recommends the degrees, diplomas and TVET programmes that fit your profile — plus what to do when you fall short.' },
  { icon: FileText,       title: 'Application Tracker',    desc: 'Track every application across institutions with status updates, deadline reminders and document checklists.' },
  { icon: Wallet2,        title: 'Bursaries & NSFAS',      desc: 'Browse funding opportunities matched to your profile, with eligibility checklists and official sources.' },
  { icon: Calculator,     title: 'Study Cost Calculator',  desc: 'Estimate tuition, accommodation, data and living costs. See your funding gap at a glance.' },
  { icon: HeartHandshake, title: 'Wellness & Support',     desc: 'Crisis lines, counselling services, disability support and student wellbeing resources — all in one place.' },
  { icon: BookOpen,       title: 'Academic Progress',      desc: 'Set milestones, track goals and access free South African learning resources.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--pageBG)', color: 'var(--pageText)' }}>

      {/* Announcement bar */}
      <div className="bg-ink text-stone-100 text-center py-2 px-4 text-xs tracking-widest uppercase">
        Free for all South African learners &nbsp;·&nbsp; Powered by Google Gemini AI
      </div>

      {/* Nav */}
      <nav className="border-b border-stone-300 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 14 14" className="w-4 h-4" fill="none">
              <path d="M2 11 L7 3 L12 11" stroke="#f4f4f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.5 8 L9.5 8" stroke="#f4f4f0" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-serif text-lg tracking-tight">EduPath SA</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs text-stone-600 hover:text-ink font-medium uppercase tracking-widest transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-xs py-2 px-5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-stone-300 px-6 md:px-12 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-end max-w-7xl mx-auto">
        <div>
          <p className="section-label mb-6">AI-Powered Education Guidance</p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-[1.05] mb-8">
            Your marks.<br />
            Your options.<br />
            <em>Your future.</em>
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2 py-3 px-7 text-sm">
              Start for free <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 py-3 px-7 text-sm">
              Sign in
            </Link>
          </div>
        </div>
        <div className="space-y-px">
          {/* Animated stat strip */}
          {[
            ['7 modules', 'covering every step of your journey'],
            ['Gemini AI', 'personalised to your exact marks'],
            ['Free', 'for all South African learners'],
            ['POPIA compliant', 'your data stays yours'],
          ].map(([label, desc]) => (
            <div key={label} className="flex items-center justify-between px-5 py-4 border border-stone-300 bg-stone-100 hover:bg-stone-200 transition-colors">
              <span className="font-semibold text-sm tracking-tight">{label}</span>
              <span className="text-xs text-stone-500">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-stone-300 px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <p className="section-label mb-8">How it works</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-px bg-stone-300">
          {[
            ['01', 'Create your profile', 'Enter your grade, province and study goals.'],
            ['02', 'Enter your marks',    'Add your NSC subjects and percentages.'],
            ['03', 'Get AI pathways',     'Gemini recommends programmes and alternatives.'],
            ['04', 'Track & plan',        'Manage applications, funding and budget.'],
          ].map(([num, title, desc]) => (
            <div key={num} className="bg-stone-100 p-6 md:p-8">
              <div className="font-serif text-3xl text-stone-300 mb-4 leading-none">{num}</div>
              <div className="font-semibold text-sm mb-2">{title}</div>
              <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="border-b border-stone-300 px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <p className="section-label mb-8">What's included</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-300">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-stone-100 p-6 hover:bg-stone-200 transition-colors group">
              <Icon size={18} className="mb-4 opacity-60" />
              <h3 className="font-semibold text-sm mb-2">{title}</h3>
              <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 py-20 md:py-28 max-w-7xl mx-auto text-center">
        <p className="section-label mb-6">Ready to find your path?</p>
        <h2 className="font-serif text-4xl md:text-5xl tracking-tighter mb-10">
          Your education journey starts here.
        </h2>
        <Link to="/register" className="btn-primary inline-flex items-center gap-2 py-3 px-10 text-sm">
          Create your free account <ArrowRight size={15} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-300 px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 bg-ink flex items-center justify-center">
            <svg viewBox="0 0 14 14" className="w-2.5 h-2.5" fill="none">
              <path d="M2 11 L7 3 L12 11" stroke="#f4f4f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.5 8 L9.5 8" stroke="#f4f4f0" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-serif text-sm tracking-tight">EduPath SA</span>
        </div>
        <div className="text-2xs text-stone-400 uppercase tracking-widest text-center">
          Recommendations are guidance only — not a guarantee of admission or funding approval.
        </div>
        <div className="text-2xs text-stone-400 uppercase tracking-widest">
          © {new Date().getFullYear()} DataFyre
        </div>
      </footer>
    </div>
  )
}
