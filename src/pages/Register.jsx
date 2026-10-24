import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'
import BackButton from '../components/BackButton'

const PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West','Western Cape'
]

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', province: '', grade: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await signUp({ email: form.email, password: form.password, fullName: form.fullName })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Account created — welcome to EduPath SA!')
    navigate('/dashboard')
  }

  const set = k => e => setForm(v => ({ ...v, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--pageBG)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-ink text-stone-100 p-12 border-r border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-stone-600 flex items-center justify-center">
            <svg viewBox="0 0 14 14" className="w-4 h-4" fill="none">
              <path d="M2 11 L7 3 L12 11" stroke="#f4f4f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.5 8 L9.5 8" stroke="#f4f4f0" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-serif text-lg tracking-tight">EduPath SA</span>
        </div>
        <div>
          <h2 className="font-serif text-4xl tracking-tighter leading-tight mb-6 text-stone-100">
            One place for<br />your entire<br /><em>education journey.</em>
          </h2>
          <ul className="space-y-2 text-sm text-stone-400">
            {['AI-powered study recommendations','Application & deadline tracking','Bursary & NSFAS guidance','Study cost calculator'].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-stone-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-2xs text-stone-600 uppercase tracking-widest">Free for South African learners</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <BackButton fallbackTo="/" label="Back" />
          </div>
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-ink flex items-center justify-center">
              <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none">
                <path d="M2 11 L7 3 L12 11" stroke="#f4f4f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.5 8 L9.5 8" stroke="#f4f4f0" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-serif text-base tracking-tight">EduPath SA</span>
          </div>

          <h1 className="font-serif text-2xl tracking-tight mb-1">Create account</h1>
          <p className="text-xs text-stone-500 mb-8">Free for all South African learners.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" required className="input" placeholder="Thabo Nkosi"
                value={form.fullName} onChange={set('fullName')} />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={set('email')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Grade / Level</label>
                <select className="input" value={form.grade} onChange={set('grade')}>
                  <option value="">Select…</option>
                  <option>Grade 11</option>
                  <option>Grade 12</option>
                  <option>Matric pass</option>
                  <option>Current student</option>
                </select>
              </div>
              <div>
                <label className="label">Province</label>
                <select className="input" value={form.province} onChange={set('province')}>
                  <option value="">Select…</option>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required className="input" placeholder="Min 6 characters"
                value={form.password} onChange={set('password')} />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" required className="input" placeholder="Repeat password"
                value={form.confirm} onChange={set('confirm')} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <><Spinner size="sm" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <div className="divider my-6" />

          <p className="text-xs text-stone-500">
            Already have an account?{' '}
            <Link to="/login" className="text-ink font-medium underline underline-offset-2 hover:no-underline">
              Sign in
            </Link>
          </p>
          <p className="mt-4">
            <Link to="/" className="text-2xs text-stone-400 uppercase tracking-widest hover:text-ink transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
