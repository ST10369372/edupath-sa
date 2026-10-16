import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, Send, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getPathwayRecommendations, askFollowUpQuestion } from '../lib/gemini'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

const SA_SUBJECTS = [
  'Mathematics','Mathematical Literacy','Physical Sciences','Life Sciences',
  'Geography','History','Accounting','Business Studies','Economics',
  'English Home Language','English First Additional Language',
  'Afrikaans Home Language','Afrikaans First Additional Language',
  'Zulu Home Language','Sotho Home Language','Xhosa Home Language',
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

  useEffect(() => {
    if (!user) return
    supabase.from('student_subjects').select('*').eq('user_id', user.id)
      .then(({ data }) => { if (data?.length) setSubjects(data.map(d => ({ subject: d.subject, mark: d.mark }))) })
  }, [user])

  function addSubject() { setSubjects(v => [...v, { subject: '', mark: '' }]) }
  function removeSubject(i) { setSubjects(v => v.filter((_, idx) => idx !== i)) }
  function updateSubject(i, key, val) { setSubjects(v => v.map((s, idx) => idx === i ? { ...s, [key]: val } : s)) }

  async function saveSubjects() {
    if (!user) return
    await supabase.from('student_subjects').delete().eq('user_id', user.id)
    const rows = subjects.filter(s => s.subject && s.mark !== '').map(s => ({
      user_id: user.id, subject: s.subject, mark: parseInt(s.mark)
    }))
    if (rows.length) await supabase.from('student_subjects').insert(rows)
  }

  async function handleAnalyse() {
    const valid = subjects.filter(s => s.subject && s.mark !== '')
    if (valid.length < 2) { toast.error('Please add at least 2 subjects with marks'); return }
    setLoading(true); setResult(null); setFuAnswer('')
    try {
      await saveSubjects()
      const rec = await getPathwayRecommendations({ subjects: valid, interests, careerGoals, grade: profile?.grade })
      setResult(rec)
      await supabase.from('pathway_recommendations').insert({ user_id: user.id, subjects_snapshot: valid, recommendations: rec })
      toast.success('Pathway analysis complete!')
    } catch (err) {
      toast.error(err.message || 'Could not get recommendations. Check your Gemini API key.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFollowUp(e) {
    e.preventDefault()
    if (!followUp.trim() || !result) return
    setFuLoading(true)
    try {
      const answer = await askFollowUpQuestion({ question: followUp, context: result })
      setFuAnswer(answer)
    } catch (err) { toast.error(err.message) }
    finally { setFuLoading(false) }
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">AI Advisor</p>
        <h1 className="page-title">Pathway Advisor</h1>
        <p className="page-sub">Powered by Google Gemini · Enter your marks to get personalised study recommendations.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input panel */}
        <div className="lg:col-span-1 space-y-5">
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Subjects & Marks</h2>
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
                    <button onClick={() => removeSubject(i)} className="text-stone-400 hover:text-ink p-1 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addSubject} className="btn-secondary text-xs py-2 mt-px w-full flex items-center justify-center gap-2">
              <Plus size={13} /> Add subject
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Career interests (optional)</label>
              <textarea className="input resize-none" rows={2}
                placeholder="e.g. I enjoy working with computers…"
                value={interests} onChange={e => setInterests(e.target.value)} />
            </div>
            <div>
              <label className="label">Career goals (optional)</label>
              <textarea className="input resize-none" rows={2}
                placeholder="e.g. I want to become a software engineer…"
                value={careerGoals} onChange={e => setCareerGoals(e.target.value)} />
            </div>
            <button onClick={handleAnalyse} disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading
                ? <><Spinner size="sm" /> Analysing with Gemini…</>
                : <><Sparkles size={15} /> Analyse My Pathways</>}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !loading && (
            <div className="card text-center py-16">
              <Sparkles size={32} className="mx-auto mb-4 opacity-20" />
              <p className="text-xs text-stone-500">Enter your subjects and marks, then click <strong className="text-ink">Analyse My Pathways</strong>.</p>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-16 gap-4">
              <Spinner size="lg" />
              <p className="text-xs text-stone-500 uppercase tracking-widest">Google Gemini is analysing your profile…</p>
            </div>
          )}

          {result && (
            <>
              {/* Summary */}
              <div className="border border-stone-300 bg-stone-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="opacity-60" />
                  <span className="section-label">EduPath AI Advisor · Powered by Google Gemini</span>
                </div>
                <p className="text-sm leading-relaxed">{result.summary}</p>
                {result.aps_estimate && (
                  <div className="mt-4 inline-flex items-center gap-3 border border-stone-300 px-4 py-2 bg-stone-200">
                    <span className="text-2xs uppercase tracking-widest text-stone-500">Estimated APS</span>
                    <span className="font-semibold text-sm">{result.aps_estimate}</span>
                  </div>
                )}
              </div>

              {/* Top pathways */}
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Recommended Study Pathways</h2>
                <div className="border border-stone-300 divide-y divide-stone-300">
                  {result.top_pathways?.map((p, i) => (
                    <div key={i} className="bg-stone-100">
                      <button
                        onClick={() => setExpanded(v => ({ ...v, [i]: !v[i] }))}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-serif text-2xl text-stone-300 leading-none w-6 flex-shrink-0">{p.rank}</span>
                          <div>
                            <div className="text-sm font-semibold">{p.field}</div>
                            <div className="text-2xs text-stone-500 uppercase tracking-wider mt-0.5">{p.qualification_types?.join(' · ')}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`badge ${MATCH_BADGE[p.match_level] || 'badge-muted'}`}>
                            {MATCH_LABEL[p.match_level] || p.match_level}
                          </span>
                          {expanded[i] ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                        </div>
                      </button>
                      {expanded[i] && (
                        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-stone-200 bg-stone-50">
                          <div>
                            <div className="section-label mb-1">Why suitable</div>
                            <p className="text-sm text-stone-700">{p.why_suitable}</p>
                          </div>
                          <div>
                            <div className="section-label mb-1">Typical requirements</div>
                            <p className="text-sm text-stone-700">{p.key_requirements}</p>
                          </div>
                          {p.programmes?.length > 0 && (
                            <div>
                              <div className="section-label mb-2">Programmes</div>
                              <div className="flex flex-wrap gap-2">
                                {p.programmes.map(prog => <span key={prog} className="badge badge-muted">{prog}</span>)}
                              </div>
                            </div>
                          )}
                          {p.institutions?.length > 0 && (
                            <div>
                              <div className="section-label mb-2">Institutions to explore</div>
                              <div className="flex flex-wrap gap-2">
                                {p.institutions.map(inst => <span key={inst} className="badge badge-ink">{inst}</span>)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternatives */}
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
                        {alt.suitable_if && <p className="text-2xs uppercase tracking-wider text-stone-400 mt-2">Consider if: {alt.suitable_if}</p>}
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
                  <div className="border border-stone-300 divide-y divide-stone-300">
                    {result.next_steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-3.5 bg-stone-100">
                        <span className="font-serif text-lg text-stone-300 leading-none flex-shrink-0">{i + 1}</span>
                        <p className="text-sm text-stone-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up */}
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Ask a Follow-Up Question</h2>
                <form onSubmit={handleFollowUp} className="flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder='"What if I improve my Maths mark?"'
                    value={followUp}
                    onChange={e => setFollowUp(e.target.value)}
                  />
                  <button type="submit" disabled={fuLoading} className="btn-primary px-4 flex items-center gap-2">
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
