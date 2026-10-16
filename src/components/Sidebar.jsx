import { NavLink } from 'react-router-dom'
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

export default function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col w-60 flex-shrink-0 border-r border-stone-300"
      style={{ background: 'var(--pageBG)' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-stone-300">
        <div className="flex items-center gap-2.5">
          {/* Monogram mark */}
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

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-3 pb-1 pt-2">
          <span className="section-label px-3">Menu</span>
        </div>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(isActive ? 'nav-link-active' : 'nav-link', 'mx-1')
            }
          >
            <Icon size={15} className="flex-shrink-0 opacity-70" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Profile */}
      <div className="border-t border-stone-300 p-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(isActive ? 'nav-link-active' : 'nav-link', 'mx-1')
          }
        >
          <User size={15} className="flex-shrink-0 opacity-70" />
          <span>My Profile</span>
        </NavLink>
      </div>
    </aside>
  )
}
