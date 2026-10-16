import { useState, useEffect } from 'react'
import { Wallet2, ExternalLink, Bookmark, BookmarkCheck, Search, Filter } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const TYPE_META = {
  nsfas:       { label: 'NSFAS',       badge: 'badge-success' },
  bursary:     { label: 'Bursary',     badge: 'badge-info' },
  scholarship: { label: 'Scholarship', badge: 'badge-ink' },
  loan:        { label: 'Loan',        badge: 'badge-warning' },
  other:       { label: 'Other',       badge: 'badge-muted' },
}

export default function FundingDirectory() {
  const { user } = useAuth()
  const [funding, setFunding] = useState([])
  const [saved,   setSaved]   = useState(new Set())
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    supabase.from('funding_opportunities').select('*').eq('is_active', true)
      .order('closing_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => setFunding(data || []))
    if (user) {
      supabase.from('saved_funding').select('funding_id').eq('user_id', user.id)
        .then(({ data }) => setSaved(new Set((data || []).map(d => d.funding_id))))
    }
  }, [user])

  async function toggleSave(fundingId) {
    if (!user) { toast.error('Please sign in'); return }
    if (saved.has(fundingId)) {
      await supabase.from('saved_funding').delete().eq('user_id', user.id).eq('funding_id', fundingId)
      setSaved(v => { const n = new Set(v); n.delete(fundingId); return n })
      toast.success('Removed from saved')
    } else {
      await supabase.from('saved_funding').insert({ user_id: user.id, funding_id: fundingId })
      setSaved(v => new Set([...v, fundingId]))
      toast.success('Saved to your list')
    }
  }

  const filtered = funding.filter(f => {
    const matchType   = filter === 'all' || f.type === filter
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.funder?.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  function daysUntil(dateStr) {
    if (!dateStr) return null
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">Funding</p>
        <h1 className="page-title">Bursaries & NSFAS</h1>
        <p className="page-sub">Browse funding opportunities matched to your profile.</p>
      </div>

      {/* NSFAS highlight */}
      <div className="border border-stone-300 bg-stone-100 p-6 flex items-start gap-5">
        <div className="w-10 h-10 bg-ink flex items-center justify-center flex-shrink-0">
          <Wallet2 size={18} className="text-stone-100" />
        </div>
        <div>
          <h2 className="font-semibold text-sm mb-1">NSFAS — National Student Financial Aid Scheme</h2>
          <p className="text-xs text-stone-500 leading-relaxed max-w-xl">
            NSFAS provides financial assistance to qualifying South African students at public universities and TVET colleges.
            Applications open annually — check the official site for the latest dates.
          </p>
          <a href="https://www.nsfas.org.za" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-xs font-medium underline underline-offset-2 hover:no-underline">
            Visit nsfas.org.za <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Eligibility note */}
      <div className="border border-stone-300 bg-stone-100 px-5 py-3 text-xs text-stone-500">
        ⚠️ Eligibility matches are for guidance only — not a guarantee of funding. Always verify with the official funder.
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className="input pl-9" placeholder="Search funding opportunities…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-stone-400" />
          <select className="input w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-px bg-stone-300">
        {filtered.map(f => {
          const days   = daysUntil(f.closing_date)
          const isSaved = saved.has(f.id)
          return (
            <div key={f.id} className="bg-stone-100 p-6 flex flex-col gap-4 hover:bg-stone-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-2xs text-stone-400 uppercase tracking-widest mb-1">{TYPE_META[f.type]?.label || f.type}</div>
                  <div className="font-semibold text-sm leading-tight">{f.name}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{f.funder}</div>
                </div>
                <button onClick={() => toggleSave(f.id)}
                  className={`flex-shrink-0 p-1 transition-colors ${isSaved ? 'text-ink' : 'text-stone-400 hover:text-ink'}`}>
                  {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">{f.description}</p>

              {f.eligibility && (
                <div className="border border-stone-300 px-3 py-2 text-xs text-stone-500">
                  <span className="font-medium text-ink">Eligibility: </span>{f.eligibility}
                </div>
              )}

              {f.max_income && (
                <div className="text-xs text-stone-500">
                  Max household income: <span className="font-medium text-ink">R{Number(f.max_income).toLocaleString()}/year</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex flex-wrap gap-2 items-center">
                  {f.closing_date && (
                    <span className={`text-2xs uppercase tracking-widest font-medium ${days !== null && days < 30 ? 'text-red-600' : 'text-stone-500'}`}>
                      Closes {new Date(f.closing_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {days !== null && days >= 0 && <span className="ml-1">({days}d)</span>}
                    </span>
                  )}
                </div>
                {f.official_url && (
                  <a href={f.official_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:no-underline flex-shrink-0">
                    Apply <ExternalLink size={11} />
                  </a>
                )}
              </div>
              {f.last_verified && (
                <div className="text-2xs text-stone-400 uppercase tracking-widest">
                  Verified {new Date(f.last_verified).toLocaleDateString('en-ZA')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-xs text-stone-500">No funding opportunities found for your search.</p>
        </div>
      )}
    </div>
  )
}
