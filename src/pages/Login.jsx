
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'
import BackButton from '../components/BackButton'

export default function Login() {
  const { signIn, enterGuestMode } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(form)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  function handleGuestLogin() {
    enterGuestMode()
    toast.success('Welcome to EduPath SA!')
    navigate('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--pageBG)' }}
    >
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-ink text-stone-100 p-12 border-r border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-stone-600 flex items-center justify-center">
            <svg
              viewBox="0 0 14 14"
              className="w-4 h-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 11 L7 3 L12 11"
                stroke="#f4f4f0"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 8 L9.5 8"
                stroke="#f4f4f0"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <span className="font-serif text-lg tracking-tight">
            EduPath SA
          </span>
        </div>

        <div>
          <h2 className="font-serif text-4xl tracking-tighter leading-tight mb-6 text-stone-100">
            Your marks.
            <br />
            Your options.
            <br />
            <em>Your future.</em>
          </h2>

          <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
            AI-powered education pathway guidance for South African
            learners — from matric to graduation.
          </p>
        </div>

        <p className="text-2xs text-stone-600 uppercase tracking-widest">
          Powered by Google Gemini
        </p>
      </div>

      {/* Right panel — access options */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <BackButton fallbackTo="/" label="Back" />
          </div>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-ink flex items-center justify-center">
              <svg
                viewBox="0 0 14 14"
                className="w-3.5 h-3.5"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 11 L7 3 L12 11"
                  stroke="#f4f4f0"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.5 8 L9.5 8"
                  stroke="#f4f4f0"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <span className="font-serif text-base tracking-tight">
              EduPath SA
            </span>
          </div>

          <h1 className="font-serif text-2xl tracking-tight mb-1">
            Welcome to EduPath SA
          </h1>

          <p className="text-xs text-stone-500 mb-8">
            Your education journey starts here.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    email: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                placeholder="Your password"
                value={form.password}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    password: e.target.value,
                  }))
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-xs text-stone-500 mt-6 text-center">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-ink font-medium underline underline-offset-2 hover:no-underline"
            >
              Create one free
            </Link>
          </p>

          <div className="divider my-6" />

          <button
            type="button"
            onClick={handleGuestLogin}
            className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
          >
            Continue as guest
          </button>

          <p className="text-xs text-stone-500 mt-3 text-center">
            Guest mode lets you explore without saving data to your account.
          </p>

          <p className="mt-4">
            <Link
              to="/"
              className="text-2xs text-stone-400 uppercase tracking-widest hover:text-ink transition-colors"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
