import { useState, useEffect } from 'react'
import { Phone, Globe, Mail, Search, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CATEGORY_META = {
  crisis:        { label: 'Crisis Support', badge: 'badge-danger', order: 0 },
  counselling:   { label: 'Counselling',    badge: 'badge-info',   order: 1 },
  disability:    { label: 'Disability',     badge: 'badge-ink',    order: 2 },
  financial_aid: { label: 'Financial Aid',  badge: 'badge-success',order: 3 },
  general:       { label: 'General',        badge: 'badge-muted',  order: 4 },
}

const WELLBEING_TIPS = [
  { title: 'Manage study stress', tips: ['Break large tasks into smaller steps', 'Use the Pomodoro technique (25 min work, 5 min break)', 'Talk to a friend or counsellor when overwhelmed'] },
  { title: 'Study-life balance',  tips: ['Schedule time for rest and hobbies', 'Avoid studying for more than 2 hours without a break', 'Stay connected with family and friends'] },
  { title: 'Adjusting to campus', tips: ['Join a student society or club', 'Attend orientation and first-year programmes', 'Ask your res advisor or student affairs office for help'] },
  { title: 'Financial wellbeing', tips: ['Track your monthly budget', 'Contact financial aid for urgent support', 'Look for student discounts on food and transport'] },
]

export default function WellnessSupport() {
  const [resources, setResources] = useState([])
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    supabase.from('support_resources').select('*').eq('is_active', true)
      .then(({ data }) => setResources(data || []))
  }, [])

  const filtered = resources.filter(r => {
    const matchCat = catFilter === 'all' || r.category === catFilter
    const matchQ   = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchQ
  })

  const byCat = filtered.reduce((acc, r) => {
    const cat = r.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {})

  const sortedCats = Object.keys(byCat).sort((a, b) => (CATEGORY_META[a]?.order ?? 9) - (CATEGORY_META[b]?.order ?? 9))

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">Support</p>
        <h1 className="page-title">Wellness & Support</h1>
        <p className="page-sub">Resources for your mental, physical and financial wellbeing.</p>
      </div>

      {/* Crisis banner */}
      <div className="border border-stone-300 bg-stone-100 p-5 flex items-start gap-4">
        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 opacity-60" />
        <div>
          <h2 className="font-semibold text-sm mb-1">In a crisis?</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            If you or someone you know is in immediate danger, call <strong>10111</strong> (Police) or <strong>10177</strong> (Ambulance).
            For mental health crisis support, contact SADAG on <strong>0800 456 789</strong> (free, 24/7).
          </p>
        </div>
      </div>

      {/* Disclaimer note */}
      <div className="border border-stone-300 bg-stone-100 px-5 py-3 text-xs text-stone-500">
        These resources are for information and referral. EduPath SA complements professional support — please consult qualified healthcare providers and counsellors for personal advice.
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className="input pl-9" placeholder="Search support resources…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Resources by category */}
      {sortedCats.map(cat => (
        <div key={cat}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`badge ${CATEGORY_META[cat]?.badge || 'badge-muted'}`}>{CATEGORY_META[cat]?.label || cat}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-stone-300">
            {byCat[cat].map(r => (
              <div key={r.id} className="bg-stone-100 p-5 hover:bg-stone-200 transition-colors">
                <h3 className="font-semibold text-sm mb-1">{r.title}</h3>
                {r.description && <p className="text-xs text-stone-500 leading-relaxed">{r.description}</p>}
                <div className="mt-3 space-y-2">
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="flex items-center gap-2 text-xs hover:underline group">
                      <Phone size={12} className="text-stone-400" />
                      <span>{r.phone}</span>
                    </a>
                  )}
                  {r.email && (
                    <a href={`mailto:${r.email}`} className="flex items-center gap-2 text-xs hover:underline group">
                      <Mail size={12} className="text-stone-400" />
                      <span>{r.email}</span>
                    </a>
                  )}
                  {r.website_url && (
                    <a href={r.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-medium underline underline-offset-2 hover:no-underline">
                      <Globe size={12} className="text-stone-400" />
                      Visit website
                    </a>
                  )}
                </div>
                {r.province && <div className="text-2xs text-stone-400 uppercase tracking-widest mt-3">{r.province}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-xs text-stone-500">No resources found.</p>
        </div>
      )}

      {/* Wellbeing tips */}
      <div>
        <h2 className="font-semibold text-sm uppercase tracking-widest mb-6">Student Wellbeing Tips</h2>
        <div className="grid sm:grid-cols-2 gap-px bg-stone-300">
          {WELLBEING_TIPS.map(({ title, tips }) => (
            <div key={title} className="bg-stone-100 p-6">
              <h3 className="font-semibold text-sm mb-4">{title}</h3>
              <ul className="space-y-2">
                {tips.map(tip => (
                  <li key={tip} className="flex items-start gap-3 text-xs text-stone-500">
                    <span className="w-1.5 h-1.5 bg-ink mt-1 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
