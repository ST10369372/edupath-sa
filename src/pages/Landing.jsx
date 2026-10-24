import { Link } from 'react-router-dom'
import {
  ArrowDown, ArrowRight, BookOpen, Calculator, Check, FileText,
  HeartHandshake, Sparkles, Wallet2,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Sparkles,
    number: '01',
    title: 'Find a study path',
    desc: 'Explore degrees, diplomas and TVET options based on your subjects, marks and interests.',
  },
  {
    icon: FileText,
    number: '02',
    title: 'Keep applications on track',
    desc: 'Organise institutions, deadlines, statuses and the documents you still need.',
  },
  {
    icon: Wallet2,
    number: '03',
    title: 'Explore funding',
    desc: 'Find bursaries and NSFAS guidance, and keep useful funding options together.',
  },
  {
    icon: Calculator,
    number: '04',
    title: 'Plan your costs',
    desc: 'Estimate study and living costs, then see the gap between expenses and available funding.',
  },
  {
    icon: BookOpen,
    number: '05',
    title: 'Build your next steps',
    desc: 'Set learning goals, monitor progress and discover resources for your studies.',
  },
  {
    icon: HeartHandshake,
    number: '06',
    title: 'Find student support',
    desc: 'Keep wellbeing, counselling and student support resources within reach.',
  },
]

const STEPS = [
  ['01', 'Tell us about you', 'Add your grade, interests and the subjects you take.'],
  ['02', 'Explore your options', 'Review study routes that could fit your profile.'],
  ['03', 'Make a plan', 'Track applications, funding and the next steps on your journey.'],
]

function Brand({ light = false }) {
  return (
    <Link to="/" aria-label="EduPath SA home" className="inline-flex items-center gap-3">
      <span className={`flex h-9 w-9 items-center justify-center ${light ? 'bg-stone-100' : 'bg-ink'}`}>
        <svg viewBox="0 0 14 14" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M2 11 L7 3 L12 11"
            stroke={light ? '#111' : '#f4f4f0'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 8 L9.5 8"
            stroke={light ? '#111' : '#f4f4f0'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={`font-serif text-lg tracking-tight ${light ? 'text-stone-100' : 'text-ink'}`}>
        EduPath <span className={light ? 'text-emerald-300' : 'text-emerald-800'}>SA</span>
      </span>
    </Link>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-stone-50 text-ink">
      <div className="bg-emerald-950 px-4 py-2 text-center text-xs font-medium tracking-wide text-emerald-50">
        Made for South African learners <span className="mx-2 text-emerald-400">/</span> Free to get started
      </div>

      <header className="border-b border-stone-200 bg-stone-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-10">
          <Brand />
          <div className="hidden items-center gap-7 md:flex">
            <a href="#how-it-works" className="text-sm text-stone-600 transition-colors hover:text-ink">
              How it works
            </a>
            <a href="#tools" className="text-sm text-stone-600 transition-colors hover:text-ink">
              Explore tools
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-2 py-2 text-sm font-medium text-stone-700 hover:text-ink">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-950"
            >
              Get started <ArrowRight size={15} />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 md:grid-cols-2 md:gap-16 md:px-10 md:py-24 lg:py-28">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-900/5 px-3 py-1.5 text-xs font-semibold text-emerald-950">
              <span className="h-2 w-2 rounded-full bg-emerald-700" />
              Your future, with a clearer starting point
            </div>
            <h1 className="max-w-xl font-serif text-5xl leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Your marks are a start.
              <span className="mt-2 block italic text-emerald-800">See where they can take you.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-stone-600 md:text-lg">
              Make sense of your study options, plan applications and explore funding—all in one place, built for South African learners.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-emerald-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-950"
              >
                Start planning for free <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 border border-stone-300 bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-500"
              >
                See how it works <ArrowDown size={15} />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-800" /> Study pathways</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-800" /> Application planning</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-800" /> Funding guidance</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-200/70 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-emerald-200/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white shadow-2xl shadow-emerald-950/15 sm:p-7">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">Your next steps</p>
                  <p className="mt-1 font-serif text-2xl">A plan that starts with you.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                  <Sparkles size={19} />
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-white p-4 text-ink sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Pathway explorer</p>
                    <h2 className="mt-1 font-serif text-xl">Start with your subjects</h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">Your profile</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ['Mathematics', 'Build on your strengths'],
                    ['Life Sciences', 'Explore related study fields'],
                    ['English', 'Keep your options open'],
                  ].map(([subject, note], index) => (
                    <div key={subject} className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                        0{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{subject}</p>
                        <p className="truncate text-xs text-stone-500">{note}</p>
                      </div>
                      <Check size={16} className="flex-shrink-0 text-emerald-800" />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-lg bg-stone-50 p-3">
                  <div>
                    <p className="text-xs font-semibold">Then make your plan</p>
                    <p className="mt-0.5 text-[11px] text-stone-500">Compare options and track what matters</p>
                  </div>
                  <ArrowRight size={16} className="text-emerald-900" />
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-emerald-100/75">
                Helpful guidance—not a guarantee of admission or funding.
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-8 border-y border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">A simpler way forward</p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">From “what now?” to a plan you can follow.</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Take it one step at a time. Start with what you know and build your plan as you go.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map(([number, title, description]) => (
                <article key={number} className="rounded-xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-sm font-bold text-white">{number}</span>
                  <h3 className="mt-5 text-base font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="tools" className="scroll-mt-8 mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">One place to get organised</p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">Support for the whole journey.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-stone-600">
              Explore practical tools for choosing a path, preparing applications and staying on top of your plans.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, number, title, desc }) => (
              <article key={number} className="group rounded-xl border border-stone-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-emerald-900/30 hover:shadow-lg hover:shadow-emerald-950/5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-900">
                    <Icon size={19} />
                  </span>
                  <span className="text-xs font-semibold tracking-widest text-stone-400">{number}</span>
                </div>
                <h3 className="mt-5 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-5 pb-16 md:px-10 md:pb-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-emerald-950 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Your next chapter starts here</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl tracking-tight sm:text-5xl">You don’t have to figure it all out at once.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-emerald-100/80">
              Start with your subjects. Explore what’s possible. Take the next step when you’re ready.
            </p>
            <Link
              to="/register"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50"
            >
              Create your free account <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between md:px-10">
          <Brand />
          <p className="max-w-xl text-center text-xs leading-5 text-stone-500 sm:text-left">
            Recommendations are for guidance only. Confirm admission requirements and funding details with the relevant institution or funder.
          </p>
          <p className="text-center text-xs text-stone-400">© {new Date().getFullYear()} DataFyre</p>
        </div>
      </footer>
    </div>
  )
}
