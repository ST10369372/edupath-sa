import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BackButton({ fallbackTo = '/dashboard', label = 'Back' }) {
  const navigate = useNavigate()

  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1)
      return
    }
    navigate(fallbackTo, { replace: true })
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-emerald-900"
    >
      <ArrowLeft size={17} />
      <span>{label}</span>
    </button>
  )
}
