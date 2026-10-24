import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined

    let listener
    let cancelled = false
    const subscription = CapacitorApp.addListener('backButton', () => {
      if (menuOpen) {
        setMenuOpen(false)
        return
      }

      if (window.history.state?.idx > 0) {
        navigate(-1)
      } else if (pathname !== '/dashboard') {
        navigate('/dashboard', { replace: true })
      } else {
        CapacitorApp.exitApp()
      }
    })

    subscription.then(handle => {
      if (cancelled) handle.remove()
      else listener = handle
    })

    return () => {
      cancelled = true
      listener?.remove()
    }
  }, [menuOpen, navigate, pathname])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--pageBG)' }}>
      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar menuOpen={menuOpen} onMenuClick={() => setMenuOpen(open => !open)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
