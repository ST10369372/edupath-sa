import { useState, useEffect } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const COST_FIELDS = [
  { key: 'tuition',       label: 'Tuition / Registration fees' },
  { key: 'accommodation', label: 'Accommodation / Res fees' },
  { key: 'transport',     label: 'Transport / Travel' },
  { key: 'food',          label: 'Food / Groceries' },
  { key: 'books',         label: 'Textbooks & Stationery' },
  { key: 'data',          label: 'Data / Internet' },
  { key: 'other',         label: 'Other expenses' },
]

const INCOME_FIELDS = [
  { key: 'bursary_income',  label: 'Bursary / Scholarship' },
  { key: 'nsfas_income',    label: 'NSFAS funding' },
  { key: 'personal_income', label: 'Personal / Family contribution' },
]

const BLANK_PLAN = { label: 'My Budget', institution: '',
  tuition: '', accommodation: '', transport: '', food: '', books: '', data: '', other: '',
  bursary_income: '', nsfas_income: '', personal_income: '' }

function fmt(n) {
  return `R ${Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

export default function CostCalculator() {
  const { user } = useAuth()
  const [plans,  setPlans]  = useState([])
  const [form,   setForm]   = useState(BLANK_PLAN)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchPlans() }, [user])

  async function fetchPlans() {
    if (!user) return
    const { data } = await supabase.from('cost_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setPlans(data || [])
  }

  function totalCosts(f) { return COST_FIELDS.reduce((sum, { key }) => sum + (parseFloat(f[key]) || 0), 0) }
  function totalIncome(f) { return INCOME_FIELDS.reduce((sum, { key }) => sum + (parseFloat(f[key]) || 0), 0) }
  function gap(f) { return totalCosts(f) - totalIncome(f) }

  const activeTotals = { costs: totalCosts(form), income: totalIncome(form), gap: gap(form) }
  const set = k => e => setForm(v => ({ ...v, [k]: e.target.value }))

  async function savePlan() {
    setSaving(true)
    const payload = {
      ...form, user_id: user.id,
      ...Object.fromEntries([...COST_FIELDS, ...INCOME_FIELDS].map(({ key }) => [key, parseFloat(form[key]) || 0])),
      updated_at: new Date().toISOString(),
    }
    if (editId) {
      const { error } = await supabase.from('cost_plans').update(payload).eq('id', editId)
      if (!error) toast.success('Plan updated'); else toast.error(error.message)
    } else {
      const { error } = await supabase.from('cost_plans').insert(payload)
      if (!error) toast.success('Plan saved'); else toast.error(error.message)
    }
    setSaving(false); fetchPlans(); setForm(BLANK_PLAN); setEditId(null)
  }

  async function deletePlan(id) {
    if (!confirm('Delete this plan?')) return
    await supabase.from('cost_plans').delete().eq('id', id)
    toast.success('Deleted'); fetchPlans()
    if (editId === id) { setForm(BLANK_PLAN); setEditId(null) }
  }

  function loadPlan(plan) {
    setForm({ ...plan }); setEditId(plan.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">Planner</p>
        <h1 className="page-title">Cost Calculator</h1>
        <p className="page-sub">Estimate your study expenses and see your funding gap.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">{editId ? 'Edit Plan' : 'New Budget Plan'}</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">Plan name</label>
                <input className="input" placeholder="e.g. UP BSc 2025" value={form.label} onChange={set('label')} />
              </div>
              <div>
                <label className="label">Institution (optional)</label>
                <input className="input" placeholder="e.g. University of Pretoria" value={form.institution} onChange={set('institution')} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h3 className="section-label mb-4">Annual Costs (R)</h3>
                <div className="border border-stone-300 divide-y divide-stone-300">
                  {COST_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between px-4 py-2.5 bg-stone-100">
                      <label className="text-xs text-stone-600">{label}</label>
                      <input type="number" min="0" step="100" className="input w-28 text-right text-xs py-1 px-2"
                        placeholder="0" value={form[key]} onChange={set(key)} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-stone-200">
                    <span className="text-xs font-semibold uppercase tracking-widest">Total costs</span>
                    <span className="font-semibold text-sm">{fmt(activeTotals.costs)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="section-label mb-4">Annual Funding (R)</h3>
                <div className="border border-stone-300 divide-y divide-stone-300">
                  {INCOME_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between px-4 py-2.5 bg-stone-100">
                      <label className="text-xs text-stone-600">{label}</label>
                      <input type="number" min="0" step="100" className="input w-28 text-right text-xs py-1 px-2"
                        placeholder="0" value={form[key]} onChange={set(key)} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-stone-200">
                    <span className="text-xs font-semibold uppercase tracking-widest">Total funding</span>
                    <span className="font-semibold text-sm">{fmt(activeTotals.income)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={savePlan} disabled={saving}
              className="btn-primary mt-6 flex items-center gap-2 py-2.5 px-6">
              <Save size={14} /> {editId ? 'Update Plan' : 'Save Plan'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-5">
          <div>
            <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Budget Summary</h2>
            <div className="border border-stone-300 divide-y divide-stone-300">
              <div className="flex justify-between px-5 py-3.5 bg-stone-100">
                <span className="text-xs text-stone-500">Total annual costs</span>
                <span className="font-medium text-sm">{fmt(activeTotals.costs)}</span>
              </div>
              <div className="flex justify-between px-5 py-3.5 bg-stone-100">
                <span className="text-xs text-stone-500">Total funding</span>
                <span className="font-medium text-sm">{fmt(activeTotals.income)}</span>
              </div>
              <div className="flex justify-between px-5 py-4 bg-stone-200">
                <span className="font-semibold text-sm">Funding gap</span>
                <span className={`font-bold text-sm ${activeTotals.gap > 0 ? 'text-red-700' : 'text-stone-700'}`}>
                  {activeTotals.gap > 0 ? fmt(activeTotals.gap) : 'Fully covered ✓'}
                </span>
              </div>
              <div className="flex justify-between px-5 py-3.5 bg-stone-100">
                <span className="text-xs text-stone-500">Monthly estimate</span>
                <span className="text-xs text-stone-700">{fmt(activeTotals.costs / 12)}/mo</span>
              </div>
            </div>

            {activeTotals.gap > 0 && (
              <div className="mt-3 border border-stone-300 px-4 py-3 text-xs text-stone-500">
                You have a funding gap of {fmt(activeTotals.gap)}. Consider applying for additional bursaries in the Funding Directory.
              </div>
            )}
          </div>

          {/* Saved plans */}
          {plans.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Saved Plans</h2>
              <div className="border border-stone-300 divide-y divide-stone-300">
                {plans.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-stone-100 hover:bg-stone-200 transition-colors">
                    <div>
                      <div className="text-xs font-semibold">{p.label}</div>
                      {p.institution && <div className="text-2xs text-stone-400 uppercase tracking-wider">{p.institution}</div>}
                      <div className="text-2xs text-stone-400 mt-0.5">
                        Gap: {gap(p) > 0
                          ? <span className="text-red-600">{fmt(gap(p))}</span>
                          : <span>covered</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <button onClick={() => loadPlan(p)} className="text-2xs uppercase tracking-widest underline underline-offset-2 hover:no-underline px-2">Edit</button>
                      <button onClick={() => deletePlan(p.id)} className="p-1.5 text-stone-400 hover:text-ink transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
