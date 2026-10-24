import { useState, useEffect } from 'react'
import { Wallet2, ExternalLink, Bookmark, BookmarkCheck, Search, Filter, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { verifyFundingStatus } from '../lib/gemini'
import toast from 'react-hot-toast'

const TYPE_META = {
  nsfas:       { label: 'NSFAS',       badge: 'badge-success' },
  bursary:     { label: 'Bursary',     badge: 'badge-info' },
  scholarship: { label: 'Scholarship', badge: 'badge-ink' },
  loan:        { label: 'Loan',        badge: 'badge-warning' },
  other:       { label: 'Other',       badge: 'badge-muted' },
}

const STATUS_CACHE_KEY = 'edupath_funding_status_cache_v1'
const STATUS_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Built-in directory of real South African funding opportunities.
 * Shown by default so the page is never empty, and merged with anything
 * added to the `funding_opportunities` Supabase table (de-duplicated by name).
 * IDs are prefixed "static-" so saving them never hits Supabase's foreign key.
 */
const STATIC_FUNDING = [
  {
    id: 'static-nsfas', type: 'nsfas', name: 'NSFAS',
    funder: 'National Student Financial Aid Scheme',
    description: 'Government funding covering tuition, accommodation, transport, and a living allowance for qualifying students at public universities and TVET colleges.',
    eligibility: 'South African citizen, combined household income below the NSFAS threshold',
    max_income: 350000,
    official_url: 'https://www.nsfas.org.za',
  },
  {
    id: 'static-funza-lushaka', type: 'bursary', name: 'Funza Lushaka Bursary',
    funder: 'Department of Basic Education',
    description: 'Fully funded teaching bursary covering tuition, accommodation, and learning materials, with a guaranteed teaching post on graduation.',
    eligibility: 'Studying towards a teaching qualification (BEd or PGCE), in a priority subject such as Maths, Science or Foundation Phase',
    official_url: 'https://www.funzalushaka.doe.gov.za/',
  },
  {
    id: 'static-eskom', type: 'bursary', name: 'Eskom Bursary',
    funder: 'Eskom',
    description: 'Covers full study costs for students pursuing engineering-related qualifications, with vacation work and possible employment after graduation.',
    eligibility: 'Studying Electrical, Civil or Mechanical Engineering',
    official_url: 'https://www.eskom.co.za/bursaries',
  },
  {
    id: 'static-sasol', type: 'bursary', name: 'Sasol Bursary',
    funder: 'Sasol',
    description: 'Bursary for engineering, science and ICT students, including mentorship and vacation work opportunities.',
    eligibility: 'Studying Engineering, Science or ICT with strong Maths and Physical Sciences marks',
    official_url: 'https://www.sasol.com/bursaries',
  },
  {
    id: 'static-anglo', type: 'bursary', name: 'Anglo American Bursary',
    funder: 'Anglo American',
    description: 'Covers tuition, accommodation and living expenses for students in mining-related engineering fields.',
    eligibility: 'Studying Mining, Civil, Mechanical or Electrical Engineering',
    official_url: 'https://www.angloamerican.com/careers/bursaries',
  },
  {
    id: 'static-transnet', type: 'bursary', name: 'Transnet Bursary',
    funder: 'Transnet',
    description: 'Supports students in engineering and ICT fields relevant to South Africa\'s freight and logistics sector.',
    eligibility: 'Studying Engineering or ICT',
    official_url: 'https://www.transnet.net/bursaries',
  },
  {
    id: 'static-allan-gray', type: 'scholarship', name: 'Allan Gray Orbis Foundation',
    funder: 'Allan Gray Orbis Foundation',
    description: 'Fellowship for entrepreneurially minded students in any field of study, with mentorship and a four-year development programme.',
    eligibility: 'Entrepreneurial leadership potential, any field of study',
    official_url: 'https://www.allangrayorbis.org/',
  },
  {
    id: 'static-investec', type: 'bursary', name: 'Investec Bursary',
    funder: 'Investec',
    description: 'Funds students in finance, actuarial science and ICT, with internship opportunities during study.',
    eligibility: 'Studying Finance, Actuarial Science or ICT with strong academic results',
    official_url: 'https://www.investec.com/en_za/welcome-to-investec/careers/students/bursaries.html',
  },
  {
    id: 'static-standard-bank', type: 'bursary', name: 'Standard Bank ICT Bursary',
    funder: 'Standard Bank',
    description: 'Covers tuition and living costs for Computer Science, IT and Data Science students.',
    eligibility: 'Studying Computer Science, IT or Data Science',
    official_url: 'https://www.standardbank.co.za/bursaries',
  },
  {
    id: 'static-telkom', type: 'bursary', name: 'Telkom Foundation Bursary',
    funder: 'Telkom',
    description: 'Supports ICT and engineering students, with possible graduate placement at Telkom.',
    eligibility: 'Studying ICT or Engineering',
    official_url: 'https://www.telkom.co.za/telkomfoundation',
  },
  {
    id: 'static-huawei', type: 'scholarship', name: 'Huawei Seeds for the Future',
    funder: 'Huawei',
    description: 'A global ICT talent programme offering training and exposure to telecommunications technology.',
    eligibility: 'ICT students in good academic standing',
    official_url: 'https://www.huawei.com/en/seedsforthefuture',
  },
  {
    id: 'static-nedbank', type: 'bursary', name: 'Nedbank Bursary',
    funder: 'Nedbank',
    description: 'Funds students in finance, accounting and ICT-related degrees.',
    eligibility: 'Studying Finance, Accounting or ICT',
    official_url: 'https://www.nedbank.co.za/bursaries',
  },
  {
    id: 'static-absa', type: 'bursary', name: 'ABSA Bursary',
    funder: 'ABSA',
    description: 'Covers tuition for accounting, finance and actuarial science students, with vacation work included.',
    eligibility: 'Studying Accounting, Finance or Actuarial Science',
    official_url: 'https://www.absa.africa/bursaries',
  },
  {
    id: 'static-pwc', type: 'bursary', name: 'PwC Bursary',
    funder: 'PwC',
    description: 'Funds students working towards a CA(SA) qualification, with structured vacation work and mentorship.',
    eligibility: 'Studying Accounting or Finance towards a CA(SA) pathway',
    official_url: 'https://www.pwc.co.za/careers/student-programmes/bursaries.html',
  },
  {
    id: 'static-deloitte', type: 'bursary', name: 'Deloitte Bursary',
    funder: 'Deloitte',
    description: 'Supports accounting and actuarial science students with tuition funding and vacation work.',
    eligibility: 'Studying Accounting or Actuarial Science',
    official_url: 'https://www2.deloitte.com/za/en/pages/careers/articles/bursary.html',
  },
  {
    id: 'static-shoprite', type: 'bursary', name: 'Shoprite Checkers Bursary',
    funder: 'Shoprite Checkers',
    description: 'Bursary for students in commerce, IT and logistics-related qualifications.',
    eligibility: 'Studying Commerce, IT or Logistics',
    official_url: 'https://www.shopriteholdings.co.za/bursaries',
  },
  {
    id: 'static-legal-aid', type: 'bursary', name: 'Legal Aid South Africa Bursary',
    funder: 'Legal Aid South Africa',
    description: 'Funds LLB students, with a work-back obligation at Legal Aid offices after graduation.',
    eligibility: 'Studying LLB, financially needy',
    official_url: 'https://www.legal-aid.co.za',
  },
  {
    id: 'static-webber-wentzel', type: 'bursary', name: 'Webber Wentzel Bursary',
    funder: 'Webber Wentzel',
    description: 'Covers tuition for LLB students with strong academic performance, including vacation work at the firm.',
    eligibility: 'Studying LLB or BA Law',
    official_url: 'https://www.webberwentzel.com/careers/bursaries',
  },
  {
    id: 'static-bowmans', type: 'bursary', name: 'Bowmans Bursary',
    funder: 'Bowmans',
    description: 'Supports LLB students with tuition funding and candidate attorney opportunities.',
    eligibility: 'Studying LLB',
    official_url: 'https://www.bowmanslaw.com/careers',
  },
  {
    id: 'static-solidarity', type: 'bursary', name: 'Solidarity Helping Hand Bursary',
    funder: 'Solidarity Helping Hand',
    description: 'Financial assistance for students in health science qualifications.',
    eligibility: 'Studying a Health Sciences qualification, financially needy',
    official_url: 'https://www.solidariteit.co.za/',
  },
  {
    id: 'static-sanc', type: 'bursary', name: 'SANC Bursary',
    funder: 'South African Nursing Council',
    description: 'Supports students enrolled in accredited nursing programmes.',
    eligibility: 'Studying Nursing at an accredited institution',
    official_url: 'https://www.sanc.co.za',
  },
  {
    id: 'static-discovery', type: 'bursary', name: 'Discovery Foundation Bursary',
    funder: 'Discovery Foundation',
    description: 'Funds medical and health science students, with a focus on addressing scarce skills in healthcare.',
    eligibility: 'Studying Medicine or an allied Health Science',
    official_url: 'https://www.discovery.co.za/foundation',
  },
  {
    id: 'static-netcare', type: 'bursary', name: 'Netcare Education Bursary',
    funder: 'Netcare',
    description: 'Covers tuition for nursing and allied health students, with potential employment at Netcare facilities.',
    eligibility: 'Studying Nursing or Allied Health',
    official_url: 'https://www.netcare.co.za/careers/bursaries',
  },
  {
    id: 'static-nrf', type: 'bursary', name: 'NRF Bursary',
    funder: 'National Research Foundation',
    description: 'Funding for postgraduate study and research in the natural sciences and related fields.',
    eligibility: 'Postgraduate students in Science, Technology or Research fields',
    official_url: 'https://www.nrf.ac.za/bursaries',
  },
  {
    id: 'static-sanral', type: 'bursary', name: 'SANRAL Bursary',
    funder: 'South African National Roads Agency',
    description: 'Supports students in civil engineering and the built environment, with vacation work on national road projects.',
    eligibility: 'Studying Civil Engineering, Architecture or a related Built Environment field',
    official_url: 'https://www.nra.co.za/bursaries',
  },
  {
    id: 'static-nac', type: 'bursary', name: 'National Arts Council Bursary',
    funder: 'National Arts Council of South Africa',
    description: 'Funding for students pursuing qualifications in the visual and performing arts.',
    eligibility: 'Studying Visual Arts, Music, Drama or a related creative field',
    official_url: 'https://www.nac.org.za',
  },
  {
    id: 'static-dsd', type: 'bursary', name: 'DSD Bursary',
    funder: 'Department of Social Development',
    description: 'Covers tuition for Social Work students, with a work-back obligation at a government department after graduation.',
    eligibility: 'Studying Social Work (BSW)',
    official_url: 'https://www.dsd.gov.za',
  },
  {
    id: 'static-imvula', type: 'bursary', name: 'iMvula Education Support',
    funder: 'iMvula Education Trust',
    description: 'Provides holistic funding and mentorship support to students in engineering, science and ICT.',
    eligibility: 'Studying Engineering, Science or ICT, financially needy',
    official_url: 'https://www.imvulaeducation.co.za/',
  },
  {
    id: 'static-murray-roberts', type: 'bursary', name: 'Murray & Roberts Bursary',
    funder: 'Murray & Roberts',
    description: 'Supports civil and electrical engineering students with tuition funding and vacation work.',
    eligibility: 'Studying Civil or Electrical Engineering',
    official_url: 'https://www.murrob.com/sustainability/bursaries',
  },
  {
    id: 'static-nyda-loan', type: 'loan', name: 'NYDA Grant & Loan Programmes',
    funder: 'National Youth Development Agency',
    description: 'Grants and small business loans for young people, including support for youth-owned enterprises linked to study fields.',
    eligibility: 'South African youth aged 18–35',
    official_url: 'https://www.nyda.gov.za',
  },
  {
    id: 'static-fundi-loan', type: 'loan', name: 'Fundi Student Loan',
    funder: 'Fundi (formerly Eduloan)',
    description: 'A commercial study loan covering tuition, textbooks and accommodation, repayable after graduation or during study.',
    eligibility: 'Registered or accepted at an accredited institution; credit and affordability checks apply',
    official_url: 'https://www.fundi.co.za',
  },
]

function readStatusCache() {
  try {
    const raw = localStorage.getItem(STATUS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > STATUS_CACHE_MAX_AGE_MS) return null
    return parsed.statuses // { [name]: { status, closing_date, note } }
  } catch {
    return null
  }
}

function writeStatusCache(statusMap) {
  try {
    localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), statuses: statusMap }))
  } catch {
    // localStorage unavailable/full — fail silently, just means we re-check next load
  }
}

export default function FundingDirectory() {
  const { user } = useAuth()
  const [funding,        setFunding]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [lastChecked,    setLastChecked]    = useState(null)
  const [saved,          setSaved]          = useState(new Set())
  const [search,         setSearch]         = useState('')
  const [filter,         setFilter]         = useState('all')

  useEffect(() => {
    supabase.from('funding_opportunities').select('*').eq('is_active', true)
      .order('closing_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        const dbFunding = data || []
        const dbNames = new Set(dbFunding.map(f => f.name.toLowerCase()))
        const extras = STATIC_FUNDING.filter(f => !dbNames.has(f.name.toLowerCase()))
        const combined = [...dbFunding, ...extras]
        setFunding(combined)
        setLoading(false)
        applyLiveStatus(combined)
      })
      .catch(() => {
        // Supabase table missing/unreachable — fall back to the built-in list only
        setFunding(STATIC_FUNDING)
        setLoading(false)
        applyLiveStatus(STATIC_FUNDING)
      })

    if (user) {
      supabase.from('saved_funding').select('funding_id').eq('user_id', user.id)
        .then(({ data }) => setSaved(new Set((data || []).map(d => d.funding_id))))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  /**
   * Checks live application status for the given funding list, using a 24h
   * cache so we don't hit the Gemini API on every page load. Removes any
   * opportunity Gemini confidently found to be closed.
   */
  async function applyLiveStatus(list, { force = false } = {}) {
    if (!list.length || !user) return

    const cached = force ? null : readStatusCache()
    if (cached) {
      applyStatusMap(list, cached)
      return
    }

    setCheckingStatus(true)
    try {
      const opportunities = list.map(f => ({ name: f.name, funder: f.funder }))
      const results = []
      for (let index = 0; index < opportunities.length; index += 10) {
        results.push(...await verifyFundingStatus(opportunities.slice(index, index + 10)))
      }
      const statusMap = {}
      results.forEach(r => { statusMap[r.name] = r })
      writeStatusCache(statusMap)
      applyStatusMap(list, statusMap)
    } catch (err) {
      // Verification failed (e.g. grounding not enabled on this key) — keep the full list as-is
      toast.error(err.message || 'Could not check live funding status right now.')
      setFunding(list)
    } finally {
      setCheckingStatus(false)
      setLastChecked(new Date())
    }
  }

  function applyStatusMap(list, statusMap) {
    const updated = list
      .map(f => {
        const s = statusMap[f.name]
        if (!s) return f
        return {
          ...f,
          closing_date: s.closing_date || f.closing_date,
          status_note: s.note || null,
          _liveStatus: s.status,
        }
      })
      .filter(f => f._liveStatus !== 'closed') // remove anything confirmed closed

    setFunding(updated)
  }

  async function handleRefreshStatus() {
    if (!user) { toast.error('Sign in to check live funding status'); return }
    localStorage.removeItem(STATUS_CACHE_KEY)
    toast('Checking live status for every listing…', { icon: '🔎' })
    await applyLiveStatus(funding, { force: true })
    toast.success('Funding status updated')
  }

  async function toggleSave(fundingId) {
    if (!user) { toast.error('Please sign in'); return }
    const isStatic = String(fundingId).startsWith('static-')

    if (saved.has(fundingId)) {
      if (!isStatic) await supabase.from('saved_funding').delete().eq('user_id', user.id).eq('funding_id', fundingId)
      setSaved(v => { const n = new Set(v); n.delete(fundingId); return n })
      toast.success('Removed from saved')
    } else {
      if (!isStatic) await supabase.from('saved_funding').insert({ user_id: user.id, funding_id: fundingId })
      setSaved(v => new Set([...v, fundingId]))
      toast.success(isStatic ? 'Saved to your list for this session' : 'Saved to your list')
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
      <div className="border-b border-stone-300 pb-8 flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-3">Funding</p>
          <h1 className="page-title">Bursaries & NSFAS</h1>
          <p className="page-sub">Browse funding opportunities matched to your profile.</p>
        </div>
        <button
          onClick={handleRefreshStatus}
          disabled={checkingStatus || loading}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-2 flex-shrink-0"
        >
          <RefreshCw size={12} className={checkingStatus ? 'animate-spin' : ''} />
          {checkingStatus ? 'Checking…' : 'Refresh status'}
        </button>
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
      <div className="border border-stone-300 bg-stone-100 px-5 py-3 text-xs text-stone-500 space-y-1">
        <p>⚠️ Eligibility matches are for guidance only — not a guarantee of funding. Always verify with the official funder.</p>
        <p>
          Listings are automatically checked against the web and removed once confirmed closed.
          {lastChecked && !checkingStatus && (
            <span className="text-stone-400"> Last checked {lastChecked.toLocaleString('en-ZA')}.</span>
          )}
          {checkingStatus && <span className="text-stone-400"> Checking live status now…</span>}
        </p>
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

      {loading && (
        <div className="card text-center py-12">
          <p className="text-xs text-stone-500">Loading funding opportunities…</p>
        </div>
      )}

      {/* Cards */}
      {!loading && (
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

                {f.status_note && (
                  <div className="text-2xs text-stone-400 italic">{f.status_note}</div>
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
      )}

      {!loading && filtered.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-xs text-stone-500">No funding opportunities found for your search.</p>
        </div>
      )}
    </div>
  )
}