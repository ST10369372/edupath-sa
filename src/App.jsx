
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import PathwayAdvisor from './pages/PathwayAdvisor'
import ApplicationTracker from './pages/ApplicationTracker'
import FundingDirectory from './pages/FundingDirectory'
import CostCalculator from './pages/CostCalculator'
import WellnessSupport from './pages/WellnessSupport'
import AcademicProgress from './pages/AcademicProgress'
import Profile from './pages/Profile'
import ApsCalculator from './pages/ApsCalculator'
import Community from './pages/Community'
import NetworkingEvents from './pages/NetworkingEvents'
import Spinner from './components/Spinner'

function ProtectedRoute({ children }) {
  const { user, isGuest, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return children
}

function GuestRoute({ children }) {
  const { user, isGuest, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (user || isGuest) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      {/* Application pages */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pathway" element={<PathwayAdvisor />} />
        <Route path="/applications" element={<ApplicationTracker />} />
        <Route path="/funding" element={<FundingDirectory />} />
        <Route path="/costs" element={<CostCalculator />} />
        <Route path="/wellness" element={<WellnessSupport />} />
        <Route path="/academic" element={<AcademicProgress />} />
        <Route path="/aps" element={<ApsCalculator />} />
        <Route path="/community" element={<Community />} />
        <Route path="/events" element={<NetworkingEvents />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
