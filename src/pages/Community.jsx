import { useState, useEffect } from 'react'
import { MessageSquare, Star, Plus, X, Check, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

const BLANK = { institution: '', course: '', year_attended: '', rating: 5, experience_text: '' }

const INSTITUTIONS = [
  'UCT – University of Cape Town',
  'Wits – University of the Witwatersrand',
  'UP – University of Pretoria',
  'SU – Stellenbosch University',
  'UJ – University of Johannesburg',
  'UKZN – University of KwaZulu-Natal',
  'NWU – North-West University',
  'UFS – University of the Free State',
  'Rhodes University',
  'UNISA – University of South Africa',
  'CPUT – Cape Peninsula University of Technology',
  'DUT – Durban University of Technology',
  'TUT – Tshwane University of Technology',
  'VUT – Vaal University of Technology',
  'MUT – Mangosuthu University of Technology',
  'UWC – University of the Western Cape',
  'UNIZULU – University of Zululand',
  'WSU – Walter Sisulu University',
  'UFH – University of Fort Hare',
  'UL – University of Limpopo',
  'SMU – Sefako Makgatho Health Sciences University',
  'SPU – Sol Plaatje University',
  'UMP – University of Mpumalanga',
  'Rosebank College',
  'Boston City Campus',
  'IMM Graduate School',
  'IIE / Varsity College',
  'AFDA',
  'Other',
]

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange && onChange(n)}
          className={`transition-opacity ${n <= value ? 'opacity-100' : 'opacity-25'} ${onChange ? 'hover:opacity-80' : ''}`}
        >
          <Star size={14} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

export default function Community() {
  const { user, profile } = useAuth()
  const [experiences, setExperiences] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState(BLANK)
  const [saving,      setSaving]      = useState(false)
  const [search,      setSearch]      = useState('')
  const [filterInst,  setFilterInst]  = useState('')

  useEffect(() => { fetchExperiences() }, [])

  async function fetchExperiences() {
    setLoading(true)
    const { data } = await supabase
      .from('student_experiences')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
    setExperiences(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.institution || !form.course || !form.experience_text) {
      toast.error('Please fill in institution, course, and your experience.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('student_experiences').insert({
      ...form,
      user_id: user.id,
      year_attended: form.year_attended ? parseInt(form.year_attended) : null,
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Experience shared!')
    setForm(BLANK)
    setShowForm(false)
    fetchExperiences()
  }

  const set = k => e => setForm(v => ({ ...v, [k]: e.target.value }))

  const allInstitutions = [...new Set(experiences.map(e => e.institution))].sort()

  const filtered = experiences.filter(e => {
    const matchSearch = !search ||
      e.institution.toLowerCase().includes(search.toLowerCase()) ||
      e.course.toLowerCase().includes(search.toLowerCase()) ||
      e.experience_text.toLowerCase().includes(search.toLowerCase())
    const matchInst = !filterInst || e.institution === filterInst
    return matchSearch && matchInst
  })

  const avgRating = experiences.length
    ? (experiences.reduce((s, e) => s + (e.rating || 0), 0) / experiences.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-300 pb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="section-label mb-3">Community</p>
          <h1 className="page-title">Student Experiences</h1>
          <p className="page-sub">Real stories from South African students — share yours and help others choose wisely.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 py-2.5 px-5 text-xs"
        >
          <Plus size={14} /> Share My Experience
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-stone-300">
        <div className="bg-stone-100 p-6 text-center">
          <div className="font-serif text-4xl text-stone-800 leading-none mb-2">{experiences.length}</div>
          <div className="section-label">Reviews</div>
        </div>
        <div className="bg-stone-100 p-6 text-center">
          <div className="font-serif text-4xl text-stone-800 leading-none mb-2">{allInstitutions.length}</div>
          <div className="section-label">Institutions</div>
        </div>
        <div className="bg-stone-100 p-6 text-center">
          <div className="font-serif text-4xl text-stone-800 leading-none mb-2">{avgRating}</div>
          <div className="section-label">Avg rating</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="input pl-8"
            placeholder="Search by institution, course or keyword…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-60"
          value={filterInst}
          onChange={e => setFilterInst(e.target.value)}
        >
          <option value="">All institutions</option>
          {allInstitutions.map(i => <option key={i}>{i}</option>)}
        </select>
      </div>

      {/* Post Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg border border-stone-300 p-7 space-y-4 overflow-y-auto max-h-[90vh]" style={{ background: 'var(--pageBG)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-widest">Share Your Experience</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-ink transition-colors"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Institution *</label>
                <select className="input" value={form.institution} onChange={set('institution')}>
                  <option value="">Select institution…</option>
                  {INSTITUTIONS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Course / Programme *</label>
                <input className="input" placeholder="e.g. BSc Computer Science" value={form.course} onChange={set('course')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Year attended</label>
                  <input type="number" className="input" placeholder="e.g. 2023" min="2000" max="2030"
                    value={form.year_attended} onChange={set('year_attended')} />
                </div>
                <div>
                  <label className="label">Rating</label>
                  <div className="flex items-center gap-3 mt-2">
                    <Stars value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                    <span className="text-xs text-stone-500">{form.rating}/5</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Your experience *</label>
                <textarea
                  className="input resize-none"
                  rows={5}
                  placeholder="Tell future students what studying there was really like — the good, the challenging, tips you wish you'd known…"
                  value={form.experience_text}
                  onChange={set('experience_text')}
                />
              </div>
              <p className="text-2xs text-stone-400 leading-relaxed">
                Your name ({profile?.full_name || 'Anonymous'}) will be shown publicly. Be honest and respectful.
              </p>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-5">
                  {saving ? <><Spinner size="sm" /> Posting…</> : <><Check size={14} /> Post Experience</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2.5 px-5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <MessageSquare size={24} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm text-stone-500">
            {experiences.length === 0
              ? 'No experiences shared yet — be the first!'
              : 'No results match your search.'}
          </p>
        </div>
      ) : (
        <div className="border border-stone-300 divide-y divide-stone-300">
          {filtered.map(exp => (
            <div key={exp.id} className="px-6 py-5 bg-stone-100 hover:bg-stone-200 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="font-semibold text-sm">{exp.institution}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{exp.course}{exp.year_attended ? ` · ${exp.year_attended}` : ''}</div>
                </div>
                <div className="flex-shrink-0">
                  <Stars value={exp.rating || 0} />
                </div>
              </div>
              <p className="text-sm leading-relaxed text-stone-700 mt-3">{exp.experience_text}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xs text-stone-400 uppercase tracking-widest">
                  {exp.profiles?.full_name || 'Anonymous'}
                </span>
                <span className="text-2xs text-stone-400 uppercase tracking-widest">
                  {new Date(exp.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="border border-stone-300 px-5 py-4 text-xs text-stone-500 leading-relaxed">
        <strong className="text-stone-700">Community Guidelines:</strong> Reviews represent individual student experiences and do not constitute official ratings or endorsements.
        EduPath SA does not verify claims. Please be honest, respectful and constructive. Reviews may be removed if they violate our guidelines.
      </div>
    </div>
  )
}
