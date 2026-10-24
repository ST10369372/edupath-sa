import { NavLink } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard, Sparkles, FileText, Wallet2, Calculator,
  HeartHandshake, BookOpen, User, Hash, MessageSquare, Users
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/pathway',      label: 'AI Pathway Advisor',  icon: Sparkles },
  { to: '/aps',          label: 'APS Calculator',      icon: Hash },
  { to: '/applications', label: 'Applications',        icon: FileText },
  { to: '/funding',      label: 'Funding & NSFAS',     icon: Wallet2 },
  { to: '/costs',        label: 'Cost Calculator',     icon: Calculator },
  { to: '/wellness',     label: 'Wellness & Support',  icon: HeartHandshake },
  { to: '/academic',     label: 'Academic Progress',   icon: BookOpen },
  { to: '/community',    label: 'Student Experiences', icon: MessageSquare },
  { to: '/events',       label: 'Networking & Events', icon: Users },
]

export default function Sidebar({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  function renderNavigation() {
    return (
      <>
        <div className="px-3 pb-1 pt-2">
          <span className="section-label px-3">Menu</span>
        </div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(isActive ? 'nav-link-active' : 'nav-link', 'mx-1')
            }
          >
            <Icon size={15} className="flex-shrink-0 opacity-70" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </>
    )
  }

  function renderProfileLink() {
    return (
      <NavLink
        to="/profile"
        onClick={onClose}
        className={({ isActive }) =>
          clsx(isActive ? 'nav-link-active' : 'nav-link', 'mx-1')
        }
      >
        <User size={15} className="flex-shrink-0 opacity-70" />
        <span>My Profile</span>
      </NavLink>
    )
  }

  function renderSidebar(className, id) {
    return (
      <aside
        id={id}
        className={className}
        style={{ background: 'var(--pageBG)' }}
      >
        <div className="px-6 py-5 border-b border-stone-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-ink flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none">
                <path d="M2 11 L7 3 L12 11" stroke="#f4f4f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.5 8 L9.5 8" stroke="#f4f4f0" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="font-serif text-base tracking-tight text-ink leading-none">EduPath SA</div>
              <div className="text-2xs text-stone-500 uppercase tracking-widest mt-0.5">AI Guidance</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {renderNavigation()}
        </nav>

        <div className="border-t border-stone-300 p-3">
          {renderProfileLink()}
        </div>
      </aside>
    )
  }

  return (
    <>
      {renderSidebar('hidden md:flex flex-col w-60 flex-shrink-0 border-r border-stone-300')}

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          {renderSidebar('absolute inset-y-0 left-0 flex flex-col w-72 max-w-[85vw] border-r border-stone-300 shadow-xl', 'mobile-navigation-menu')}
        </div>
      )}
    </>
  )
}
