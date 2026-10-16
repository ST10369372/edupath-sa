import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

const PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West','Western Cape'
]

export default function Profile() {
  const { profile, updateProfile, user } = useAuth()
  const [form, setForm] = useState({
    full_name: '', grade: '', province: '', career_goals: '', study_budget: '', preferred_lang: 'en'
  })
  const [saving,   setSaving]   = useState(false)
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:      profile.full_name      || '',
        grade:          profile.grade          || '',
        province:       profile.province       || '',
        career_goals:   profile.career_goals   || '',
        study_budget:   profile.study_budget   || '',
        preferred_lang: profile.preferred_lang || 'en',
      })
    }
  }, [profile])

  useEffect(() => {
    if (!user) return
    supabase.from('student_subjects').select('*').eq('user_id', user.id)
      .then(({ data }) => setSubjects(data || []))
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await updateProfile({
      ...form,
      study_budget: form.study_budget ? parseFloat(form.study_budget) : null,
    })
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile updated!')
  }

  const set = k => e => setForm(v => ({ ...v, [k]: e.target.value }))

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">Account</p>
        <h1 className="page-title">My Profile</h1>
        <p className="page-sub">Keep your profile up to date for better AI recommendations.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-ink flex items-center justify-center text-stone-100 text-xl font-semibold flex-shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-semibold text-base">{profile?.full_name || 'Student'}</div>
          <div className="text-xs text-stone-500 mt-0.5">{user?.email}</div>
          <div className="mt-2">
            <span className="badge badge-muted capitalize">{profile?.role || 'student'}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <h2 className="font-semibold text-sm uppercase tracking-widest">Personal Details</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Full name</label>
            <input className="input" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
          </div>
          <div>
            <label className="label">Grade / Level</label>
            <select className="input" value={form.grade} onChange={set('grade')}>
              <option value="">Select…</option>
              <option>Grade 11</option>
              <option>Grade 12</option>
              <option>Matric pass</option>
              <option>Current student</option>
              <option>Graduate</option>
            </select>
          </div>
          <div>
            <label className="label">Province</label>
            <select className="input" value={form.province} onChange={set('province')}>
              <option value="">Select…</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Annual study budget (R)</label>
            <input type="number" className="input" value={form.study_budget} onChange={set('study_budget')} placeholder="e.g. 80000" />
          </div>
          <div>
            <label className="label">Preferred language</label>
            <select className="input" value={form.preferred_lang} onChange={set('preferred_lang')}>
              <option value="en">English</option>
              <option value="af">Afrikaans</option>
              <option value="zu">Zulu</option>
              <option value="xh">Xhosa</option>
              <option value="st">Sotho</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Career goals</label>
            <textarea className="input resize-none" rows={3} value={form.career_goals} onChange={set('career_goals')}
              placeholder="Describe your career aspirations…" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-6">
          {saving ? <><Spinner size="sm" /> Saving…</> : <><Save size={14} /> Save Profile</>}
        </button>
      </form>

      {/* Subjects summary */}
      {subjects.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Saved Subjects</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-stone-300">
            {subjects.map(s => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-stone-100">
                <span className="text-xs truncate mr-3">{s.subject}</span>
                <span className={`text-sm font-bold flex-shrink-0 ${s.mark >= 70 ? 'text-stone-800' : s.mark >= 50 ? '' : 'text-red-700'}`}>
                  {s.mark}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-2xs text-stone-400 uppercase tracking-widest mt-3">Update subjects in the AI Pathway Advisor</p>
        </div>
      )}
    </div>
  )
}
