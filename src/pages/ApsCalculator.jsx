import { useState } from 'react'
import { Plus, Trash2, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import SubjectUploader from '../components/SubjectUploader'
import { markToAps } from '../lib/aps'

/**
 * NSC APS Calculator
 *
 * Official South African National Senior Certificate APS formula:
 *   % 0–29  → 1 point
 *   % 30–39 → 2 points
 *   % 40–49 → 3 points
 *   % 50–59 → 4 points
 *   % 60–69 → 5 points
 *   % 70–79 → 6 points
 *   % 80–100 → 7 points
 *
 * Life Orientation: most universities use half value (max 2 pts),
 * some exclude it entirely. We show both variants.
 * APS = sum of best 6 subjects (excl. LO) + LO half-value.
 */

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
  'Tourism','Agricultural Sciences','Visual Arts','Music','Dramatic Arts',
  'Life Orientation',
]

// Curated SA degree APS requirements  (min, institution examples)
const COURSES = [
  // Medicine / Health
  { field: 'Medicine (MBChB)',              minAps: 34, subjects: ['Mathematics','Physical Sciences'], unis: ['UCT','Wits','UP','SMU','Walter Sisulu'], category: 'Health Sciences' },
  { field: 'Pharmacy (BPharm)',             minAps: 28, subjects: ['Mathematics','Physical Sciences','Life Sciences'], unis: ['UWC','NWU','UKZN','UP'], category: 'Health Sciences' },
  { field: 'Nursing (BSc Nursing)',         minAps: 22, subjects: ['Mathematics or Maths Lit','Life Sciences'], unis: ['Multiple public universities'], category: 'Health Sciences' },
  { field: 'Dentistry (BDS)',               minAps: 32, subjects: ['Mathematics','Physical Sciences','Life Sciences'], unis: ['UCT','Wits','UWC'], category: 'Health Sciences' },
  // Engineering
  { field: 'Civil Engineering (BEng)',      minAps: 30, subjects: ['Mathematics','Physical Sciences'], unis: ['UCT','Wits','UP','SU','UKZN','UJ'], category: 'Engineering' },
  { field: 'Electrical Engineering (BEng)', minAps: 30, subjects: ['Mathematics','Physical Sciences'], unis: ['UCT','Wits','UP','SU','UJ'], category: 'Engineering' },
  { field: 'Mechanical Engineering (BEng)', minAps: 30, subjects: ['Mathematics','Physical Sciences'], unis: ['UCT','Wits','UP','SU','NMU'], category: 'Engineering' },
  { field: 'Chemical Engineering (BEng)',   minAps: 32, subjects: ['Mathematics','Physical Sciences'], unis: ['UCT','UP','Wits','SU'], category: 'Engineering' },
  { field: 'Industrial Engineering (BEng)', minAps: 28, subjects: ['Mathematics','Physical Sciences'], unis: ['UP','Wits','SU'], category: 'Engineering' },
  // ICT / Computer Science
  { field: 'Computer Science (BSc)',        minAps: 28, subjects: ['Mathematics'], unis: ['UCT','Wits','UP','SU','UJ','UKZN','NWU','Rhodes'], category: 'ICT' },
  { field: 'Information Technology (BSc)',  minAps: 26, subjects: ['Mathematics'], unis: ['UP','UJ','NWU','UNISA','TUT','VUT'], category: 'ICT' },
  { field: 'Software Engineering (BEng/BSc)',minAps:28, subjects: ['Mathematics'], unis: ['UCT','SU','UJ','NWU'], category: 'ICT' },
  { field: 'Data Science (BSc)',            minAps: 28, subjects: ['Mathematics'], unis: ['UCT','Wits','UP','SU'], category: 'ICT' },
  { field: 'Cybersecurity (Diploma/BSc)',   minAps: 24, subjects: ['Mathematics or CAT'], unis: ['CPUT','TUT','VUT','UJ'], category: 'ICT' },
  // Business / Law
  { field: 'BCom (General)',                minAps: 24, subjects: ['Mathematics or Maths Lit'], unis: ['Multiple public universities'], category: 'Business' },
  { field: 'BCom Accounting',               minAps: 26, subjects: ['Mathematics','Accounting'], unis: ['UCT','Wits','UP','SU','UJ','UKZN'], category: 'Business' },
  { field: 'BCom Finance',                  minAps: 26, subjects: ['Mathematics'], unis: ['UCT','Wits','UP','SU','UJ'], category: 'Business' },
  { field: 'Law (LLB)',                     minAps: 28, subjects: ['English Home or FAL'], unis: ['UCT','Wits','UP','SU','UWC','UKZN','UJ'], category: 'Law' },
  // Science
  { field: 'BSc (General)',                 minAps: 24, subjects: ['Mathematics','Physical Sciences'], unis: ['Multiple public universities'], category: 'Natural Sciences' },
  { field: 'Actuarial Science',             minAps: 34, subjects: ['Mathematics'], unis: ['UCT','Wits','UP','SU','Unisa'], category: 'Natural Sciences' },
  { field: 'Architecture (BArch/BSc)',      minAps: 28, subjects: ['Mathematics'], unis: ['UCT','Wits','UP','UKZN','TUT'], category: 'Built Environment' },
  // Humanities
  { field: 'BA (General)',                  minAps: 20, subjects: ['English'], unis: ['Multiple public universities'], category: 'Humanities' },
  { field: 'BA Education (BEd)',            minAps: 22, subjects: ['Any 3 NSC subjects'], unis: ['Multiple public universities'], category: 'Education' },
  { field: 'Social Work (BSW)',             minAps: 22, subjects: ['English'], unis: ['Multiple public universities'], category: 'Social Sciences' },
  { field: 'Psychology (BA/BSc)',           minAps: 24, subjects: ['English'], unis: ['UCT','Wits','UP','NWU','UJ'], category: 'Social Sciences' },
  // TVET / Diplomas
  { field: 'National Diploma: IT',          minAps: 18, subjects: ['Mathematics or Maths Lit'], unis: ['TUT','CPUT','DUT','VUT','MUT'], category: 'TVET / Diploma' },
  { field: 'National Diploma: Engineering', minAps: 18, subjects: ['Mathematics','Physical Sciences'], unis: ['TUT','CPUT','DUT','VUT'], category: 'TVET / Diploma' },
  { field: 'National Diploma: Business',    minAps: 16, subjects: ['Any'], unis: ['Multiple TVETs'], category: 'TVET / Diploma' },
]

const BURSARIES_BY_FIELD = {
  ICT: [
    { name: 'Allan Gray Orbis Foundation', url: 'https://www.allangrayorbis.org/', focus: 'Entrepreneurial students in any field' },
    { name: 'Sasol Bursary (ICT track)', url: 'https://www.sasol.com/bursaries', focus: 'Engineering & ICT' },
    { name: 'Investec Bursary', url: 'https://www.investec.com/en_za/welcome-to-investec/careers/students/bursaries.html', focus: 'Finance, Actuarial, ICT' },
    { name: 'Standard Bank ICT Bursary', url: 'https://www.standardbank.co.za/bursaries', focus: 'Computer Science, IT, Data Science' },
    { name: 'Telkom Foundation Bursary', url: 'https://www.telkom.co.za/telkomfoundation', focus: 'ICT, Engineering' },
    { name: 'Huawei Seeds for the Future', url: 'https://www.huawei.com/en/seedsforthefuture', focus: 'ICT students' },
    { name: 'iMvula Education Support', url: 'https://www.imvulaeducation.co.za/', focus: 'Engineering, Science, ICT' },
  ],
  Engineering: [
    { name: 'Eskom Bursary', url: 'https://www.eskom.co.za/bursaries', focus: 'Electrical, Civil, Mechanical Engineering' },
    { name: 'Sasol Bursary', url: 'https://www.sasol.com/bursaries', focus: 'Engineering & Sciences' },
    { name: 'Anglo American Bursary', url: 'https://www.angloamerican.com/careers/bursaries', focus: 'Mining & Engineering' },
    { name: 'Transnet Bursary', url: 'https://www.transnet.net/bursaries', focus: 'Engineering, ICT' },
    { name: 'Murray & Roberts Bursary', url: 'https://www.murrob.com/sustainability/bursaries', focus: 'Civil, Electrical Engineering' },
    { name: 'SANRAL Bursary', url: 'https://www.nra.co.za/bursaries', focus: 'Civil Engineering, Built Environment' },
    { name: 'iMvula Education Support', url: 'https://www.imvulaeducation.co.za/', focus: 'Engineering, Science, ICT' },
  ],
  'Health Sciences': [
    { name: 'Solidarity Helping Hand Bursary', url: 'https://www.solidariteit.co.za/', focus: 'Health Sciences' },
    { name: 'SANC Bursary (Nursing)', url: 'https://www.sanc.co.za', focus: 'Nursing students' },
    { name: 'Discovery Foundation Bursary', url: 'https://www.discovery.co.za/foundation', focus: 'Medical & Health Sciences' },
    { name: 'Netcare Education Bursary', url: 'https://www.netcare.co.za/careers/bursaries', focus: 'Nursing, Allied Health' },
    { name: 'HPCSA-linked funders', url: 'https://www.hpcsa.co.za', focus: 'Various health professions' },
  ],
  Business: [
    { name: 'Nedbank Bursary', url: 'https://www.nedbank.co.za/bursaries', focus: 'Finance, Accounting, ICT' },
    { name: 'ABSA Bursary', url: 'https://www.absa.africa/bursaries', focus: 'Accounting, Finance, Actuarial' },
    { name: 'Shoprite Checkers Bursary', url: 'https://www.shopriteholdings.co.za/bursaries', focus: 'Commerce, IT, Logistics' },
    { name: 'PwC Bursary', url: 'https://www.pwc.co.za/careers/student-programmes/bursaries.html', focus: 'Accounting, Finance' },
    { name: 'Deloitte Bursary', url: 'https://www2.deloitte.com/za/en/pages/careers/articles/bursary.html', focus: 'Accounting, Actuarial' },
  ],
  Law: [
    { name: 'Legal Aid South Africa Bursary', url: 'https://www.legal-aid.co.za', focus: 'LLB students' },
    { name: 'Webber Wentzel Bursary', url: 'https://www.webberwentzel.com/careers/bursaries', focus: 'LLB, BA Law' },
    { name: 'Bowmans Bursary', url: 'https://www.bowmanslaw.com/careers', focus: 'LLB students' },
  ],
  'Natural Sciences': [
    { name: 'NRF Bursary (postgrad)', url: 'https://www.nrf.ac.za/bursaries', focus: 'Sciences, Research' },
    { name: 'DSI Internship & Bursary', url: 'https://www.dst.gov.za', focus: 'Science, Technology, Innovation' },
    { name: 'Eskom Bursary (Sciences)', url: 'https://www.eskom.co.za/bursaries', focus: 'Natural Sciences' },
  ],
  'Built Environment': [
    { name: 'SANRAL Bursary', url: 'https://www.nra.co.za/bursaries', focus: 'Civil, Architecture, Built Environment' },
    { name: 'NHBRC Bursary', url: 'https://www.nhbrc.org.za', focus: 'Built Environment' },
  ],
  Humanities: [
    { name: 'National Arts Council Bursary', url: 'https://www.nac.org.za', focus: 'Arts, Drama, Music' },
    { name: 'NSFAS (all fields)', url: 'https://www.nsfas.org.za', focus: 'All qualifying fields' },
  ],
  Education: [
    { name: 'Funza Lushaka Bursary', url: 'https://www.funzalushaka.doe.gov.za/', focus: 'Teaching — government-funded, work-back required' },
    { name: 'NSFAS (all fields)', url: 'https://www.nsfas.org.za', focus: 'All qualifying fields' },
  ],
  'Social Sciences': [
    { name: 'NSFAS (all fields)', url: 'https://www.nsfas.org.za', focus: 'All qualifying fields' },
    { name: 'DSD Bursary (Social Work)', url: 'https://www.dsd.gov.za', focus: 'Social Work — work-back' },
  ],
  'TVET / Diploma': [
    { name: 'NSFAS TVET Bursary', url: 'https://www.nsfas.org.za', focus: 'All TVET colleges' },
    { name: 'SETAs (various)', url: 'https://www.dhet.gov.za/setas', focus: 'Sector-specific bursaries' },
  ],
}

const JOBS_BY_CATEGORY = {
  ICT: ['Software Developer', 'Data Scientist', 'Cybersecurity Analyst', 'Cloud Engineer', 'UX Designer', 'IT Project Manager', 'AI/ML Engineer', 'DevOps Engineer'],
  Engineering: ['Civil Engineer', 'Electrical Engineer', 'Mechanical Engineer', 'Project Engineer', 'Site Manager', 'Structural Engineer', 'Mining Engineer'],
  'Health Sciences': ['Medical Doctor', 'Pharmacist', 'Registered Nurse', 'Dentist', 'Physiotherapist', 'Occupational Therapist'],
  Business: ['Chartered Accountant (CA)', 'Financial Analyst', 'Management Consultant', 'Actuary', 'Auditor', 'Business Analyst'],
  Law: ['Attorney', 'Advocate', 'Legal Advisor', 'Magistrate', 'Compliance Officer'],
  'Natural Sciences': ['Research Scientist', 'Actuary', 'Environmental Scientist', 'Lab Technician', 'Geologist'],
  'Built Environment': ['Architect', 'Quantity Surveyor', 'Urban Planner', 'Construction Manager'],
  Humanities: ['Journalist', 'Editor', 'Policy Analyst', 'Museum Curator', 'NGO Manager'],
  Education: ['Teacher', 'School Principal', 'Curriculum Developer', 'Educational Psychologist'],
  'Social Sciences': ['Social Worker', 'Psychologist', 'Counsellor', 'Community Development Officer'],
  'TVET / Diploma': ['IT Technician', 'Electrician', 'Plumber', 'Artisan', 'Admin Officer'],
}

const CATEGORIES = [...new Set(COURSES.map(c => c.category))]

export default function ApsCalculator() {
  const [subjects,    setSubjects]    = useState([
    { subject: '', mark: '' },
    { subject: '', mark: '' },
    { subject: '', mark: '' },
  ])
  const [selectedCat, setSelectedCat] = useState('all')
  const [calculated,  setCalculated]  = useState(false)

  // ─── Subject list helpers ────────────────────────────────────────────────

  function addSubject()           { setSubjects(v => [...v, { subject: '', mark: '' }]) }
  function removeSubject(i)       { setSubjects(v => v.filter((_, idx) => idx !== i)) }
  function update(i, key, val)    { setSubjects(v => v.map((s, idx) => idx === i ? { ...s, [key]: val } : s)) }

  /**
   * Called by SubjectUploader after local OCR recognises subjects from a file.
   * Merges extracted subjects into the current list:
   *   - Updates the mark for any subject already in the list.
   *   - Appends new subjects.
   *   - Removes blank placeholder rows.
   * Then resets any previous calculation result.
   */
  function handleSubjectsExtracted(extracted) {
    setSubjects(current => {
      // Keep rows the user has already filled in
      const existing = current.filter(s => s.subject && s.mark !== '')
      const result   = [...existing]

      for (const ext of extracted) {
        const idx = result.findIndex(s => s.subject === ext.subject)
        if (idx >= 0) {
          // Overwrite the mark for a subject already in the list
          result[idx] = { subject: ext.subject, mark: String(ext.mark) }
        } else {
          result.push({ subject: ext.subject, mark: String(ext.mark) })
        }
      }

      return result.length > 0 ? result : [{ subject: '', mark: '' }]
    })
    // Reset results so the user re-calculates with the new marks
    setCalculated(false)
  }

  // ─── APS calculation ─────────────────────────────────────────────────────

  const valid   = subjects.filter(s => s.subject && s.mark !== '')
  const lo      = valid.find(s => s.subject === 'Life Orientation')
  const others  = valid
    .filter(s => s.subject !== 'Life Orientation')
    .map(s => ({ ...s, pts: markToAps(s.mark) }))
    .sort((a, b) => b.pts - a.pts)

  // APS = best 6 non-LO subjects + LO half value (rounded down, max 2)
  const top6   = others.slice(0, 6)
  const aps6   = top6.reduce((sum, s) => sum + s.pts, 0)
  const loHalf = lo ? Math.min(2, Math.floor(markToAps(lo.mark) / 2)) : 0
  const aps    = aps6 + loHalf

  const qualified = COURSES.filter(c =>
    aps >= c.minAps && (selectedCat === 'all' || c.category === selectedCat)
  )
  const nearMiss = COURSES.filter(c =>
    aps < c.minAps && aps >= c.minAps - 3 && (selectedCat === 'all' || c.category === selectedCat)
  )

  // Unique categories from qualified courses for bursary/job display
  const qualifiedCategories = [...new Set(qualified.map(c => c.category))]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">NSC</p>
        <h1 className="page-title">APS Calculator</h1>
        <p className="page-sub">Calculate your Admission Point Score and see which courses you qualify for.</p>
      </div>

      {/* How APS works */}
      <div className="border border-stone-300 bg-stone-100 p-5 flex items-start gap-4">
        <Info size={16} className="flex-shrink-0 opacity-50 mt-0.5" />
        <div className="text-xs text-stone-600 leading-relaxed space-y-1">
          <p><strong>How APS is calculated:</strong> Each subject % is converted to a 1–7 point scale. Your APS = sum of your best 6 subjects (excluding Life Orientation). Life Orientation is counted at half-value (max 2 pts) by most universities.</p>
          <p className="text-stone-400">0–29% = 1 · 30–39% = 2 · 40–49% = 3 · 50–59% = 4 · 60–69% = 5 · 70–79% = 6 · 80–100% = 7</p>
        </div>
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
              — or enter your marks manually below —
            </p>
          </div>

          {/* Manual entry */}
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Your Marks</h2>
            <div className="border border-stone-300 divide-y divide-stone-300">
              {subjects.map((s, i) => (
                <div key={i} className="flex gap-2 px-3 py-2.5 bg-stone-100 items-center">
                  <select
                    className="flex-1 text-xs bg-transparent border-0 outline-none"
                    value={s.subject}
                    onChange={e => update(i, 'subject', e.target.value)}
                  >
                    <option value="">Select subject…</option>
                    {SA_SUBJECTS.map(sub => <option key={sub}>{sub}</option>)}
                  </select>
                  <input
                    type="number" min="0" max="100"
                    className="w-14 text-center text-xs border border-stone-300 bg-stone-200 px-1 py-0.5"
                    placeholder="%"
                    value={s.mark}
                    onChange={e => update(i, 'mark', e.target.value)}
                  />
                  {subjects.length > 1 && (
                    <button
                      onClick={() => removeSubject(i)}
                      className="text-stone-400 hover:text-ink p-0.5 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-px">
              <button
                onClick={addSubject}
                className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
              >
                <Plus size={12} /> Add subject
              </button>
              <button
                onClick={() => setCalculated(true)}
                className="flex-1 btn-primary text-xs py-2"
              >
                Calculate APS
              </button>
            </div>
          </div>

          {/* APS score display */}
          {calculated && valid.length >= 3 && (
            <div className="border border-stone-300">
              <div className="bg-ink text-stone-100 px-5 py-6 text-center">
                <div className="font-serif text-6xl leading-none mb-1">{aps}</div>
                <div className="text-2xs uppercase tracking-widest text-stone-400">Your APS Score</div>
              </div>
              <div className="bg-stone-100 divide-y divide-stone-300">
                {top6.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2">
                    <span className="text-xs truncate mr-3">{s.subject}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-2xs text-stone-400">{s.mark}%</span>
                      <span className="font-semibold text-sm w-4 text-right">{s.pts}</span>
                    </div>
                  </div>
                ))}
                {lo && (
                  <div className="flex items-center justify-between px-4 py-2 text-stone-400">
                    <span className="text-xs">Life Orientation (½)</span>
                    <span className="font-semibold text-sm">+{loHalf}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Results panel ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {!calculated && (
            <div className="card text-center py-16">
              <p className="text-xs text-stone-500">
                Upload your report card above, or enter marks manually, then click{' '}
                <strong>Calculate APS</strong> to see which courses you qualify for.
              </p>
            </div>
          )}

          {calculated && valid.length < 3 && (
            <div className="card text-center py-10">
              <p className="text-xs text-stone-500">Please add at least 3 subjects to calculate your APS.</p>
            </div>
          )}

          {calculated && valid.length >= 3 && (
            <>
              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCat('all')}
                  className={`badge cursor-pointer transition-colors ${selectedCat === 'all' ? 'badge-ink' : 'badge-muted hover:badge-ink'}`}
                >
                  All fields
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`badge cursor-pointer transition-colors ${selectedCat === cat ? 'badge-ink' : 'badge-muted'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Qualified courses */}
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">
                  Courses You Qualify For ({qualified.length})
                </h2>
                {qualified.length === 0 ? (
                  <div className="card text-center py-8">
                    <p className="text-xs text-stone-500">No courses in this category match your current APS of {aps}.</p>
                  </div>
                ) : (
                  <div className="border border-stone-300 divide-y divide-stone-300">
                    {qualified.map((c, i) => (
                      <div key={i} className="px-5 py-4 bg-stone-100 hover:bg-stone-200 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-sm font-semibold">{c.field}</div>
                            <div className="text-2xs text-stone-400 uppercase tracking-wider mt-1">
                              {c.unis.join(' · ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-2xs text-stone-400 uppercase tracking-widest">Min APS</div>
                              <div className="font-semibold text-sm">{c.minAps}</div>
                            </div>
                            <span className="badge badge-success">Qualifies</span>
                          </div>
                        </div>
                        {c.subjects.length > 0 && (
                          <div className="text-2xs text-stone-500 mt-1.5">
                            Requires: {c.subjects.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Near misses */}
              {nearMiss.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">
                    Almost There — Within 3 APS Points
                  </h2>
                  <div className="border border-stone-300 divide-y divide-stone-300">
                    {nearMiss.map((c, i) => (
                      <div key={i} className="px-5 py-4 bg-stone-100 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">{c.field}</div>
                          <div className="text-2xs text-stone-400 uppercase tracking-wider mt-0.5">
                            {c.unis.join(' · ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-2xs text-stone-400 uppercase tracking-widest">Need</div>
                            <div className="font-semibold text-sm">{c.minAps}</div>
                          </div>
                          <span className="badge badge-warning">{c.minAps - aps} short</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bursaries for qualified categories */}
              {qualifiedCategories.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">
                    Bursaries Open in Your Fields
                  </h2>
                  <div className="space-y-5">
                    {qualifiedCategories.filter(cat => BURSARIES_BY_FIELD[cat]).map(cat => (
                      <div key={cat}>
                        <div className="section-label mb-3">{cat}</div>
                        <div className="border border-stone-300 divide-y divide-stone-300">
                          {BURSARIES_BY_FIELD[cat].map(b => (
                            <div
                              key={b.name}
                              className="flex items-center justify-between px-5 py-3.5 bg-stone-100 hover:bg-stone-200 transition-colors"
                            >
                              <div>
                                <div className="text-xs font-semibold">{b.name}</div>
                                <div className="text-2xs text-stone-500 mt-0.5">{b.focus}</div>
                              </div>
                              <a
                                href={b.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-2xs uppercase tracking-widest underline underline-offset-2 hover:no-underline flex-shrink-0 ml-4"
                              >
                                Apply
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jobs for qualified categories */}
              {qualifiedCategories.length > 0 && (
                <div>
                  <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">
                    Job Opportunities in Your Fields
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-px bg-stone-300">
                    {qualifiedCategories.filter(cat => JOBS_BY_CATEGORY[cat]).map(cat => (
                      <div key={cat} className="bg-stone-100 p-5">
                        <div className="section-label mb-3">{cat}</div>
                        <ul className="space-y-1.5">
                          {JOBS_BY_CATEGORY[cat].map(job => (
                            <li key={job} className="flex items-center gap-2 text-xs">
                              <span className="w-1 h-1 bg-ink flex-shrink-0" />
                              {job}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="border border-stone-300 bg-stone-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm">Get full AI-powered pathway recommendations</div>
                  <p className="text-xs text-stone-500 mt-0.5">Enter interests and goals for a personalised Gemini analysis.</p>
                </div>
                <Link to="/pathway" className="btn-primary text-xs py-2.5 px-6 flex-shrink-0">
                  Open AI Advisor →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}