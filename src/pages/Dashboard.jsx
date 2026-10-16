import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, FileText, Wallet2, Calculator, ArrowRight, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const STATUS_BADGE = {
  not_started:       'badge-muted',
  in_progress:       'badge-info',
  submitted:         'badge-info',
  awaiting_response: 'badge-warning',
  accepted:          'badge-success',
  unsuccessful:      'badge-danger',
}
const STATUS_LABEL = {
  not_started: 'Not started', in_progress: 'In progress', submitted: 'Submitted',
  awaiting_response: 'Awaiting', accepted: 'Accepted', unsuccessful: 'Unsuccessful',
}

const QUICK = [
  { to: '/pathway',      icon: Sparkles,  label: 'AI Pathway Advisor',  sub: 'Get study recommendations' },
  { to: '/applications', icon: FileText,  label: 'Applications',        sub: 'Track your applications' },
  { to: '/funding',      icon: Wallet2,   label: 'Funding & NSFAS',     sub: 'Find bursaries' },
  { to: '/costs',        icon: Calculator,label: 'Cost Calculator',     sub: 'Plan your budget' },
]

export default function Dashboard() {
  const { profile, user } = useAuth()
  const [apps,    setApps]    = useState([])
  const [funding, setFunding] = useState([])
  const [goals,   setGoals]   = useState([])

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('applications').select('*').eq('user_id', user.id).order('deadline', { ascending: true }).limit(4),
      supabase.from('funding_opportunities').select('*').eq('is_active', true).order('closing_date', { ascending: true }).limit(4),
      supabase.from('academic_goals').select('*').eq('user_id', user.id).eq('completed', false).limit(4),
    ]).then(([a, f, g]) => {
      setApps(a.data || [])
      setFunding(f.data || [])
      setGoals(g.data || [])
    })
  }, [user])

  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  return (
    <div className="space-y-10">

      {/* Page header */}
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">Dashboard</p>
        <h1 className="page-title">Welcome back, {firstName}.</h1>
        <p className="page-sub">Your education journey at a glance.</p>
      </div>

      {/* Quick access — horizontal strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-stone-300">
        {QUICK.map(({ to, icon: Icon, label, sub }) => (
          <Link key={to} to={to} className="bg-stone-100 hover:bg-stone-200 transition-colors p-5 group">
            <Icon size={16} className="mb-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="text-sm font-semibold leading-tight mb-1">{label}</div>
            <div className="text-2xs text-stone-500 uppercase tracking-wider">{sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Applications */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm uppercase tracking-widest">Applications</h2>
            <Link to="/applications" className="text-2xs text-stone-500 uppercase tracking-widest hover:text-ink transition-colors flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {apps.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-xs text-stone-500 mb-3">No applications yet.</p>
              <Link to="/applications" className="text-xs underline underline-offset-2 font-medium hover:no-underline">
                Add your first application
              </Link>
            </div>
          ) : (
            <div className="border border-stone-300 divide-y divide-stone-300">
              {apps.map(app => (
                <div key={app.id} className="flex items-center justify-between px-5 py-3.5 bg-stone-100 hover:bg-stone-200 transition-colors">
                  <div>
                    <div className="text-sm font-medium leading-tight">{app.programme}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{app.institution}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {app.deadline && (
                      <div className="hidden sm:flex items-center gap-1 text-2xs text-stone-400">
                        <Clock size={10} />
                        {new Date(app.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                    <span className={`badge ${STATUS_BADGE[app.status]}`}>{STATUS_LABEL[app.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm uppercase tracking-widest">Active Goals</h2>
            <Link to="/academic" className="text-2xs text-stone-500 uppercase tracking-widest hover:text-ink transition-colors flex items-center gap-1">
              Manage <ArrowRight size={11} />
            </Link>
          </div>
          {goals.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-xs text-stone-500 mb-3">No active goals.</p>
              <Link to="/academic" className="text-xs underline underline-offset-2 font-medium hover:no-underline">Set a goal</Link>
            </div>
          ) : (
            <div className="border border-stone-300 divide-y divide-stone-300">
              {goals.map(goal => (
                <div key={goal.id} className="flex items-start gap-3 px-5 py-3.5 bg-stone-100">
                  <div className="w-1.5 h-1.5 bg-ink mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{goal.title}</div>
                    {goal.due_date && (
                      <div className="text-2xs text-stone-400 uppercase tracking-wider mt-0.5">
                        Due {new Date(goal.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Funding deadlines */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest">Upcoming Funding Deadlines</h2>
          <Link to="/funding" className="text-2xs text-stone-500 uppercase tracking-widest hover:text-ink transition-colors flex items-center gap-1">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-300">
          {funding.map(f => (
            <div key={f.id} className="bg-stone-100 hover:bg-stone-200 transition-colors p-5">
              <div className="text-2xs text-stone-400 uppercase tracking-widest mb-2">{f.type}</div>
              <div className="text-sm font-semibold leading-tight mb-1">{f.name}</div>
              <div className="text-xs text-stone-500 mb-3">{f.funder}</div>
              {f.closing_date && (
                <div className="text-2xs uppercase tracking-widest text-stone-500">
                  Closes {new Date(f.closing_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          ))}
          {funding.length === 0 && (
            <div className="bg-stone-100 col-span-4 text-center py-10">
              <p className="text-xs text-stone-500">No funding data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
