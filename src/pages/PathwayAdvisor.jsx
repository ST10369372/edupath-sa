import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, Send, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Bookmark, GitCompareArrows, ExternalLink, ListChecks } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { getPathwayRecommendations, askFollowUpQuestion } from '../lib/gemini'
import { calculateApsVariants } from '../lib/aps'
import SubjectUploader from '../components/SubjectUploader'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

const SA_SUBJECTS = [
  'Mathematics','Mathematical Literacy','Physical Sciences','Life Sciences',
  'Geography','History','Accounting','Business Studies','Economics',
  'English Home Language','English First Additional Language',
  'Afrikaans Home Language','Afrikaans First Additional Language',
  'Zulu Home Language','Zulu First Additional Language',
  'Sotho Home Language','Sotho First Additional Language',
  'Xhosa Home Language','Xhosa First Additional Language',
  'Sepedi Home Language','Sepedi First Additional Language',
  'Setswana Home Language','Setswana First Additional Language',
  'Siswati Home Language','Siswati First Additional Language',
  'Tshivenda Home Language','Tshivenda First Additional Language',
  'itsonga Home Language','itsonga First Additional Language',
  'Ndebele Home Language','Ndebele First Additional Language',
  'Computer Applications Technology','Information Technology',
  'Engineering Graphics & Design','Civil Technology','Electrical Technology',
  'Mechanical Technology','Consumer Studies','Hospitality Studies',
  'Tourism','Agricultural Sciences','Visual Arts','Music','Dramatic Arts'
]

const MATCH_BADGE = {
  strong_match:   'badge-success',
  possible_match: 'badge-warning',
  stretch_goal:   'badge-danger',
}
const MATCH_LABEL = {
  strong_match: 'Strong Match', possible_match: 'Possible Match', stretch_goal: 'Stretch Goal',
}
const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]
const CURRENT_YEAR = new Date().getFullYear()

function pathwayKey(pathway) {
  const title = `${pathway.field || 'pathway'}-${(pathway.programmes || []).join('-')}`
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180)
}

export default function PathwayAdvisor() {
  const { user, profile } = useAuth()
  const [subjects,    setSubjects]    = useState([{ subject: '', mark: '' }])
  const [interests,   setInterests]   = useState('')
  const [careerGoals, setCareerGoals] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState(null)
  const [expanded,    setExpanded]    = useState({})
  const [followUp,    setFollowUp]    = useState('')
  const [fuLoading,   setFuLoading]   = useState(false)
  const [fuAnswer,    setFuAnswer]    = useState('')
  const [province, setProvince] = useState(profile?.province || '')
  const [studyStartYear, setStudyStartYear] = useState(String(CURRENT_YEAR + 1))
  const [savedPathways, setSavedPathways] = useState([])
  const [compareKeys, setCompareKeys] = useState([])

  // Load saved subjects from DB on mount
  useEffect(() => {
    if (!user) return
    api.get('/api/subjects')
      .then(data => {
        if (data?.length) setSubjects(data.map(d => ({ subject: d.subject, mark: d.mark })))
      })
      .catch(err => toast.error(`Could not load saved subjects: ${err.message}`))
  }, [user])

  useEffect(() => {
    if (!user) {
      setSavedPathways([])
      return
    }
    api.get('/api/saved-pathways')
      .then(setSavedPathways)
      .catch(err => toast.error(`Could not load saved pathways: ${err.message}`))
  }, [user])

  useEffect(() => {
    if (profile?.province && !province) setProvince(profile.province)
  }, [profile?.province, province])

  // ─── Subject list helpers ────────────────────────────────────────────────

  function addSubject()                     { setSubjects(v => [...v, { subject: '', mark: '' }]) }
  function removeSubject(i)                 { setSubjects(v => v.filter((_, idx) => idx !== i)) }
  function updateSubject(i, key, val)       { setSubjects(v => v.map((s, idx) => idx === i ? { ...s, [key]: val } : s)) }

  /**
   * Called by SubjectUploader after local OCR recognises subjects from a file.
   * Merges extracted subjects into the current list without losing manual entries.
   */
  function handleSubjectsExtracted(extracted) {
    setSubjects(current => {
      const existing = current.filter(s => s.subject && s.mark !== '')
      const result   = [...existing]

      for (const ext of extracted) {
        const idx = result.findIndex(s => s.subject === ext.subject)
        if (idx >= 0) {
          result[idx] = { subject: ext.subject, mark: String(ext.mark) }
        } else {
          result.push({ subject: ext.subject, mark: String(ext.mark) })
        }
      }

      return result.length > 0 ? result : [{ subject: '', mark: '' }]
    })
    // Clear previous analysis — subjects have changed
    setResult(null)
    setFuAnswer('')
  }

  // ─── Save subjects to DB ─────────────────────────────────────────────────

  async function saveSubjects(valid) {
    if (!user) return
    const rows = valid.map(s => ({ subject: s.subject, mark: parseInt(s.mark) }))
    await api.put('/api/subjects', { subjects: rows })
  }

  // ─── Run Gemini analysis ─────────────────────────────────────────────────

  async function handleAnalyse() {
    const valid = subjects.filter(s => s.subject && s.mark !== '')
    if (valid.length < 2) { toast.error('Please add at least 2 subjects with marks'); return }
    if (valid.length > 20) { toast.error('Please enter no more than 20 subjects'); return }
    if (valid.some(s => !Number.isInteger(Number(s.mark)) || Number(s.mark) < 0 || Number(s.mark) > 100)) {
      toast.error('Subject marks must be whole numbers from 0 to 100')
      return
    }
    if (new Set(valid.map(s => s.subject)).size !== valid.length) {
      toast.error('Each subject can only be entered once')
      return
    }

    setLoading(true)
    setResult(null)
    setFuAnswer('')

    try {
      await saveSubjects(valid)
      const rec = await getPathwayRecommendations({
        subjects: valid,
        interests,
        careerGoals,
        grade: profile?.grade,
        province,
        studyStartYear: Number(studyStartYear),
      })
      setResult(rec)
      await api.post('/api/pathways', { subjects_snapshot: valid, recommendations: rec })
      toast.success('Pathway analysis complete!')
    } catch (err) {
      toast.error(err.message || 'Could not get recommendations. Check your Gemini API key.')
    } finally {
      setLoading(false)
    }
  }

  async function savePathway(pathway) {
    if (!user) {
      toast.error('Sign in to save pathways to your account')
      return
    }
    const key = pathwayKey(pathway)
    try {
      const saved = await api.post('/api/saved-pathways', {
        pathway_key: key,
        pathway,
        profile_snapshot: {
          subjects: subjects.filter(s => s.subject && s.mark !== ''),
          grade: profile?.grade || null,
          province: province || null,
          study_start_year: Number(studyStartYear),
          interests,
          career_goals: careerGoals,
        },
      })
      setSavedPathways(current => [saved, ...current.filter(item => item.pathway_key !== key)])
      toast.success('Pathway saved to your account')
    } catch (err) {
      toast.error(`Could not save pathway: ${err.message}`)
    }
  }

  async function removeSavedPathway(saved) {
    try {
      await api.delete('/api/saved-pathways', saved.id)
      setSavedPathways(current => current.filter(item => item.id !== saved.id))
      setCompareKeys(current => current.filter(key => key !== saved.pathway_key))
      toast.success('Saved pathway removed')
    } catch (err) {
      toast.error(`Could not remove pathway: ${err.message}`)
    }
  }

  function toggleComparison(key) {
    setCompareKeys(current => {
      if (current.includes(key)) return current.filter(item => item !== key)
      if (current.length >= 3) {
        toast.error('Compare up to 3 pathways at a time')
        return current
      }
      return [...current, key]
    })
  }

  async function addNextSteps(pathway, steps) {
    if (!user) {
      toast.error('Sign in to save pathway tasks')
      return
    }
    try {
      const saved = savedPathways.find(item => item.pathway_key === pathwayKey(pathway))
      await api.post('/api/pathway-tasks', {
        saved_pathway_id: saved?.id,
        tasks: steps,
      })
      toast.success('Next steps added to your task list in Applications')
    } catch (err) {
      toast.error(`Could not add tasks: ${err.message}`)
    }
  }

  const currentAps = calculateApsVariants(subjects)
  const comparisonItems = compareKeys.map(key => {
    const saved = savedPathways.find(item => item.pathway_key === key)
    const pathway = saved?.pathway || result?.top_pathways?.find(item => pathwayKey(item) === key)
    return pathway ? { key, pathway } : null
  }).filter(Boolean)

  // ─── Follow-up question ──────────────────────────────────────────────────

  async function handleFollowUp(e) {
    e.preventDefault()
    if (!followUp.trim() || !result) return
    setFuLoading(true)
    try {
      const answer = await askFollowUpQuestion({ question: followUp, context: result })
      setFuAnswer(answer)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setFuLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">AI Advisor</p>
        <h1 className="page-title">Pathway Advisor</h1>
        <p className="page-sub">Powered by Google Gemini · Upload your results or enter marks to get personalised study recommendations.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Input panel ─────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Upload section */}
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-widest mb-3">
              Auto-fill from Report Card
            </h2>
            <SubjectUploader onSubjectsExtracted={handleSubjectsExtracted} />
            <p className="text-2xs text-stone-400 mt-2 text-center">
              — or enter marks manually below —
            </p>
          </div>

          {/* Manual subject entry */}
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Subjects &amp; Marks</h2>
            <div className="border border-stone-300 divide-y divide-stone-300">
              {subjects.map((s, i) => (
                <div key={i} className="flex gap-2 px-3 py-2.5 bg-stone-100 items-center">
                  <select
                    className="input text-sm flex-1 border-0 bg-transparent p-0 focus:ring-0"
                    value={s.subject}
                    onChange={e => updateSubject(i, 'subject', e.target.value)}
                  >
                    <option value="">Select subject…</option>
                    {SA_SUBJECTS.map(sub => <option key={sub}>{sub}</option>)}
                  </select>
                  <input
                    type="number" min="0" max="100"
                    className="input text-sm w-16 text-center border-0 bg-stone-200 p-1"
                    placeholder="%"
                    value={s.mark}
                    onChange={e => updateSubject(i, 'mark', e.target.value)}
                  />
                  {subjects.length > 1 && (
                    <button
                      onClick={() => removeSubject(i)}
                      className="text-stone-400 hover:text-ink p-1 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addSubject}
              className="btn-secondary text-xs py-2 mt-px w-full flex items-center justify-center gap-2"
            >
              <Plus size={13} /> Add subject
            </button>
          </div>

          {/* Interests / Goals */}
          <div className="space-y-4">
            <div>
              <label className="label">Career interests (optional)</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="e.g. I enjoy working with computers…"
                value={interests}
                onChange={e => setInterests(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Career goals (optional)</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="e.g. I want to become a software engineer…"
                value={careerGoals}
                onChange={e => setCareerGoals(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Preferred province</label>
                <select className="input" value={province} onChange={e => setProvince(e.target.value)}>
                  <option value="">Any province</option>
                  {PROVINCES.map(item => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Study-start year</label>
                <select className="input" value={studyStartYear} onChange={e => setStudyStartYear(e.target.value)}>
                  {Array.from({ length: 8 }, (_, index) => CURRENT_YEAR + index).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-stone-300 bg-stone-100 p-4">
              <div className="section-label mb-3">Indicative APS from your marks</div>
              {currentAps.subjects.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {currentAps.variants.map(variant => (
                      <div key={variant.key} className="flex items-center justify-between text-xs">
                        <span className="text-stone-600">{variant.label}</span>
                        <strong>{variant.score}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="text-2xs text-stone-500 mt-3">
                    Estimates only. Universities select subjects and calculate APS differently; always check the programme’s official requirements.
                  </p>
                </>
              ) : (
                <p className="text-xs text-stone-500">Enter subject marks to see your APS estimates.</p>
              )}
              {currentAps.bestSixWithoutLifeOrientation.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-300">
                  <div className="section-label mb-2">Best 6 excluding Life Orientation</div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAps.bestSixWithoutLifeOrientation.map(item => (
                      <span key={item.subject} className="badge badge-muted">
                        {item.subject}: {item.points}
                      </span>
                    ))}
                  </div>
                  {currentAps.lifeOrientationHalf > 0 && (
                    <p className="text-2xs text-stone-500 mt-2">
                      This app’s alternative adds {currentAps.lifeOrientationHalf} Life Orientation points.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Analyse button */}
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading
                ? <><Spinner size="sm" /> Analysing with Gemini…</>
                : <><Sparkles size={15} /> Analyse My Pathways</>}
            </button>
          </div>
        </div>

        {/* ── Results panel ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {savedPathways.length > 0 && (
            <section className="border border-stone-300 bg-stone-100 p-5">
              <h2 className="font-semibold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <Bookmark size={14} /> Saved Pathways
              </h2>
              <div className="space-y-2">
                {savedPathways.map(saved => (
                  <div key={saved.id} className="flex items-center gap-3 border border-stone-200 bg-stone-50 px-3 py-2">
                    <label className="flex items-center gap-2 flex-1 min-w-0 text-sm">
                      <input
                        type="checkbox"
                        checked={compareKeys.includes(saved.pathway_key)}
                        onChange={() => toggleComparison(saved.pathway_key)}
                      />
                      <span className="truncate">{saved.pathway?.field || 'Saved pathway'}</span>
                    </label>
                    <button onClick={() => removeSavedPathway(saved)} className="text-2xs underline text-stone-500">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {comparisonItems.length > 0 && (
            <section className="border border-stone-300 bg-stone-100 p-5">
              <h2 className="font-semibold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <GitCompareArrows size={14} /> Compare Pathways
              </h2>
              <div className="overflow-x-auto">
                <div className="grid gap-3 min-w-[600px]" style={{ gridTemplateColumns: `repeat(${comparisonItems.length}, minmax(0, 1fr))` }}>
                  {comparisonItems.map(({ key, pathway }) => (
                    <div key={key} className="border border-stone-300 bg-stone-50 p-3 space-y-2">
                      <div className="font-semibold text-sm">{pathway.field}</div>
                      <p className="text-xs text-stone-600">{pathway.programmes?.join(', ') || 'Programmes not specified'}</p>
                      <div><div className="section-label">Match</div><p className="text-xs">{MATCH_LABEL[pathway.match_level] || 'Review fit'}</p></div>
                      <div><div className="section-label">Requirements</div><p className="text-xs">{pathway.key_requirements || 'Confirm with institution'}</p></div>
                      {pathway.typical_aps_min != null && (
                        <div><div className="section-label">Source-reported APS minimum</div><p className="text-xs">{pathway.typical_aps_min}</p></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div className="card text-center py-16">
              <Sparkles size={32} className="mx-auto mb-4 opacity-20" />
              <p className="text-xs text-stone-500">
                Upload your report card, or enter marks manually, then click{' '}
                <strong className="text-ink">Analyse My Pathways</strong>.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="card flex flex-col items-center justify-center py-16 gap-4">
              <Spinner size="lg" />
              <p className="text-xs text-stone-500 uppercase tracking-widest">
                Google Gemini is analysing your profile…
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary card */}
              <div className="border border-stone-300 bg-stone-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="opacity-60" />
                  <span className="section-label">EduPath AI Advisor · Powered by Google Gemini</span>
                </div>
                <p className="text-sm leading-relaxed">{result.summary}</p>
                <div className="mt-3 text-xs text-stone-500">
                  Guidance tailored for {province || 'all provinces'} · Intended start: {studyStartYear}. APS variants are calculated from your marks above; institution rules vary.
                </div>
              </div>

              {/* Top pathways */}
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">
                  Recommended Study Pathways
                </h2>
                <div className="border border-stone-300 divide-y divide-stone-300">
                  {result.top_pathways?.map((p, i) => {
                    const key = pathwayKey(p)
                    const isSaved = savedPathways.some(item => item.pathway_key === key)
                    return (
                    <div key={key || i} className="bg-stone-100">
                      <button
                        onClick={() => setExpanded(v => ({ ...v, [i]: !v[i] }))}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-serif text-2xl text-stone-300 leading-none w-6 flex-shrink-0">
                            {p.rank}
                          </span>
                          <div>
                            <div className="text-sm font-semibold">{p.field}</div>
                            <div className="text-2xs text-stone-500 uppercase tracking-wider mt-0.5">
                              {p.qualification_types?.join(' · ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`badge ${MATCH_BADGE[p.match_level] || 'badge-muted'}`}>
                            {MATCH_LABEL[p.match_level] || p.match_level}
                          </span>
                          {expanded[i]
                            ? <ChevronUp size={14} className="text-stone-400" />
                            : <ChevronDown size={14} className="text-stone-400" />}
                        </div>
                      </button>

                      {expanded[i] && (
                        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-stone-200 bg-stone-50">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => isSaved ? toggleComparison(key) : savePathway(p)} className="btn-secondary text-xs py-2 px-3 flex items-center gap-2">
                              <Bookmark size={13} /> {isSaved ? 'Add to comparison' : 'Save pathway'}
                            </button>
                            <label className="btn-secondary text-xs py-2 px-3 flex items-center gap-2 cursor-pointer">
                              <GitCompareArrows size={13} />
                              <input
                                type="checkbox"
                                checked={compareKeys.includes(key)}
                                onChange={() => toggleComparison(key)}
                              />
                              Compare
                            </label>
                          </div>
                          <div>
                            <div className="section-label mb-1">Why suitable</div>
                            <p className="text-sm text-stone-700">{p.why_suitable}</p>
                          </div>
                          <div>
                            <div className="section-label mb-1">Typical requirements</div>
                            <p className="text-sm text-stone-700">{p.key_requirements}</p>
                          </div>
                          {p.profile_evidence?.length > 0 && (
                            <div>
                              <div className="section-label mb-1">Your matching evidence</div>
                              <ul className="list-disc pl-5 text-sm text-stone-700">
                                {p.profile_evidence.map((item, index) => <li key={index}>{item}</li>)}
                              </ul>
                            </div>
                          )}
                          {p.potential_gaps?.length > 0 && (
                            <div>
                              <div className="section-label mb-1">Potential gaps to check</div>
                              <ul className="list-disc pl-5 text-sm text-stone-700">
                                {p.potential_gaps.map((item, index) => <li key={index}>{item}</li>)}
                              </ul>
                            </div>
                          )}
                          {p.requirements_to_check?.length > 0 && (
                            <div>
                              <div className="section-label mb-1">Confirm with the institution</div>
                              <ul className="list-disc pl-5 text-sm text-stone-700">
                                {p.requirements_to_check.map((item, index) => <li key={index}>{item}</li>)}
                              </ul>
                            </div>
                          )}
                          {p.improvement_actions?.length > 0 && (
                            <div>
                              <div className="section-label mb-1">Ways to strengthen your application</div>
                              <ul className="list-disc pl-5 text-sm text-stone-700">
                                {p.improvement_actions.map((item, index) => <li key={index}>{item}</li>)}
                              </ul>
                            </div>
                          )}
                          {p.typical_aps_min != null && (
                            <p className="text-xs text-stone-600">
                              Search-reported typical APS minimum: <strong>{p.typical_aps_min}</strong>. This may be outdated or programme-specific; verify on the official admissions page.
                            </p>
                          )}
                          {p.programmes?.length > 0 && (
                            <div>
                              <div className="section-label mb-2">Programmes</div>
                              <div className="flex flex-wrap gap-2">
                                {p.programmes.map(prog => (
                                  <span key={prog} className="badge badge-muted">{prog}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {p.institutions?.length > 0 && (
                            <div>
                              <div className="section-label mb-2">Institutions to explore</div>
                              <div className="flex flex-wrap gap-2">
                                {p.institutions.map(inst => (
                                  <span key={inst} className="badge badge-ink">{inst}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </div>

              {result.sources?.length > 0 && (
                <div className="mt-5 border border-stone-300 bg-stone-50 p-4">
                  <div className="section-label mb-2">Admission research sources</div>
                  <ul className="space-y-1">
                    {result.sources.map(source => (
                      <li key={source.url}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-2 inline-flex items-center gap-1">
                          {source.title} <ExternalLink size={11} />
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="text-2xs text-stone-500 mt-2">
                    {result.research_checked_at && `Search checked ${new Date(result.research_checked_at).toLocaleDateString()}. `}
                    Sources can change. Confirm requirements and dates on the institution’s official programme page.
                  </p>
                </div>
              )}

              {/* Alternative pathways */}
              {result.alternative_pathways?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertCircle size={14} className="opacity-60" /> Alternative Pathways
                  </h2>
                  <div className="border border-stone-300 divide-y divide-stone-300">
                    {result.alternative_pathways.map((alt, i) => (
                      <div key={i} className="px-5 py-4 bg-stone-100">
                        <div className="font-medium text-sm">{alt.title}</div>
                        <p className="text-stone-500 text-sm mt-1">{alt.description}</p>
                        {alt.suitable_if && (
                          <p className="text-2xs uppercase tracking-wider text-stone-400 mt-2">
                            Consider if: {alt.suitable_if}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next steps */}
              {result.next_steps?.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle size={14} className="opacity-60" /> Your Next Steps
                  </h2>
                  <button
                    onClick={() => addNextSteps(result.top_pathways?.[0] || {}, result.next_steps)}
                    className="btn-secondary text-xs py-2 px-3 mb-3 flex items-center gap-2"
                  >
                    <ListChecks size={13} /> Add steps to task list
                  </button>
                  <div className="border border-stone-300 divide-y divide-stone-300">
                    {result.next_steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-3.5 bg-stone-100">
                        <span className="font-serif text-lg text-stone-300 leading-none flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-stone-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Funding note */}
              {result.funding_note && (
                <div className="border border-stone-300 bg-stone-100 px-5 py-4">
                  <div className="section-label mb-2">Funding Opportunities</div>
                  <p className="text-sm text-stone-700">{result.funding_note}</p>
                </div>
              )}

              {/* Follow-up question */}
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">
                  Ask a Follow-Up Question
                </h2>
                <form onSubmit={handleFollowUp} className="flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder='"What if I improve my Maths mark?"'
                    value={followUp}
                    onChange={e => setFollowUp(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={fuLoading}
                    className="btn-primary px-4 flex items-center gap-2"
                  >
                    {fuLoading ? <Spinner size="sm" /> : <Send size={14} />}
                  </button>
                </form>
                {fuAnswer && (
                  <div className="mt-4 border border-stone-300 bg-stone-100 p-5 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {fuAnswer}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}