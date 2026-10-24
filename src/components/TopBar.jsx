import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User, Globe, ChevronDown, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import BackButton from './BackButton'
import toast from 'react-hot-toast'

export default function TopBar({ menuOpen, onMenuClick }) {
  const { profile, signOut } = useAuth()
  const { lang, setLang, LANGUAGES } = useI18n()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [showMenu,   setShowMenu]   = useState(false)
  const [showLang,   setShowLang]   = useState(false)

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  return (
    <header
      className="h-12 flex items-center justify-between px-4 md:px-10 flex-shrink-0 border-b border-stone-300"
      style={{ background: 'var(--pageBG)' }}
    >
      <div className="md:hidden flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="mobile-navigation-menu"
          aria-expanded={menuOpen}
          className="p-2 -ml-2 text-stone-700 hover:bg-stone-200 transition-colors"
        >
          <Menu size={20} />
        </button>
        {pathname !== '/dashboard' && <BackButton />}
        <span className="font-serif text-sm tracking-tight text-ink">EduPath SA</span>
      </div>

      <div className="hidden md:block">
        {pathname !== '/dashboard' && <BackButton />}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => { setShowLang(v => !v); setShowMenu(false) }}
            className="flex items-center gap-1.5 py-1 px-2.5 hover:bg-stone-200 transition-colors text-xs text-stone-600"
          >
            <Globe size={13} className="opacity-60" />
            <span className="hidden sm:inline">{currentLang.label}</span>
            <span className="sm:hidden uppercase font-mono text-2xs">{currentLang.code}</span>
            <ChevronDown size={11} className="opacity-50" />
          </button>

          {showLang && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLang(false)} />
              <div
                className="absolute right-0 top-full mt-px w-52 border border-stone-300 z-50 overflow-hidden"
                style={{ background: 'var(--pageBG)' }}
              >
                <div className="px-3 py-2 border-b border-stone-200">
                  <span className="section-label">Language / Ulimi</span>
                </div>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLang(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2 text-xs hover:bg-stone-200 transition-colors ${l.code === lang ? 'font-semibold text-ink' : 'text-stone-700'}`}
                  >
                    <span>{l.label}</span>
                    {l.code === lang && <div className="w-1.5 h-1.5 bg-ink" />}
                  </button>
                ))}
                <div className="px-4 py-2 border-t border-stone-200">
                  <p className="text-2xs text-stone-400 leading-relaxed">⚠ Machine-assisted translations. Human review pending.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => { setShowMenu(v => !v); setShowLang(false) }}
            className="flex items-center gap-2 py-1 px-2 hover:bg-stone-200 transition-colors"
          >
            <div className="w-6 h-6 bg-ink flex items-center justify-center text-stone-100 text-2xs font-semibold">
              {initials}
            </div>
            <span className="hidden md:block text-xs text-stone-600 max-w-[140px] truncate">
              {profile?.full_name || 'Student'}
            </span>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 top-full mt-px w-44 border border-stone-300 z-50 overflow-hidden"
                style={{ background: 'var(--pageBG)' }}
              >
                <button
                  onClick={() => { navigate('/profile'); setShowMenu(false) }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-200 hover:text-ink transition-colors border-b border-stone-200"
                >
                  <User size={13} />
                  My Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-200 hover:text-ink transition-colors"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
