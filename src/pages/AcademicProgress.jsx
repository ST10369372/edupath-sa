import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Check, Edit3, X, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const LEARNING_RESOURCES = [
  { title: 'Khan Academy',     desc: 'Free lessons for Maths, Science, Economics and more',       url: 'https://www.khanacademy.org',     badge: 'Maths & Science' },
  { title: 'Siyavula',         desc: 'Free South African textbooks and practice for Grades 10–12', url: 'https://www.siyavula.com',         badge: 'SA Curriculum' },
  { title: 'Everything Maths', desc: 'Free NSC Maths study guide and exercises',                  url: 'https://www.everythingmaths.co.za',badge: 'Mathematics' },
  { title: 'OpenStax',         desc: 'Free peer-reviewed university textbooks',                   url: 'https://openstax.org',             badge: 'University' },
  { title: 'Coursera',         desc: 'Online university courses — many free to audit',            url: 'https://www.coursera.org',         badge: 'Online' },
  { title: 'edX',              desc: 'Courses from top universities worldwide, free to audit',    url: 'https://www.edx.org',             badge: 'Online' },
]

const BLANK_GOAL = { title: '', description: '', due_date: '' }

export default function AcademicProgress() {
  const { user } = useAuth()
  const [goals,    setGoals]    = useState([])
  const [form,     setForm]     = useState(BLANK_GOAL)
  const [editId,   setEditId]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { fetchGoals() }, [user])

  async function fetchGoals() {
    if (!user) return
    const { data } = await supabase.from('academic_goals').select('*')
      .eq('user_id', user.id).order('due_date', { ascending: true, nullsFirst: false })
    setGoals(data || [])
  }

  async function saveGoal() {
    if (!form.title) { toast.error('Goal title is required'); return }
    setSaving(true)
    const payload = { ...form, user_id: user.id }
    if (editId) {
      const { error } = await supabase.from('academic_goals').update(payload).eq('id', editId)
      if (!error) toast.success('Goal updated'); else toast.error(error.message)
    } else {
      const { error } = await supabase.from('academic_goals').insert(payload)
      if (!error) toast.success('Goal added!'); else toast.error(error.message)
    }
    setSaving(false); setForm(BLANK_GOAL); setEditId(null); setShowForm(false); fetchGoals()
  }

  async function toggleComplete(goal) {
    await supabase.from('academic_goals').update({ completed: !goal.completed }).eq('id', goal.id)
    fetchGoals()
    if (!goal.completed) toast.success('Goal completed!')
  }

  async function deleteGoal(id) {
    if (!confirm('Delete this goal?')) return
    await supabase.from('academic_goals').delete().eq('id', id)
    toast.success('Deleted'); fetchGoals()
  }

  function startEdit(goal) {
    setForm({ title: goal.title, description: goal.description || '', due_date: goal.due_date || '' })
    setEditId(goal.id); setShowForm(true)
  }

  const active    = goals.filter(g => !g.completed)
  const completed = goals.filter(g => g.completed)
  const set = k => e => setForm(v => ({ ...v, [k]: e.target.value }))

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-300 pb-8 flex items-end justify-between">
        <div>
          <p className="section-label mb-3">Progress</p>
          <h1 className="page-title">Academic Progress</h1>
          <p className="page-sub">Set goals, track milestones and access learning resources.</p>
        </div>
        <button onClick={() => { setForm(BLANK_GOAL); setEditId(null); setShowForm(true) }}
          className="btn-primary flex items-center gap-2 py-2.5 px-5 text-xs">
          <Plus size={14} /> Add Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-stone-300">
        <div className="bg-stone-100 p-6 text-center">
          <div className="font-serif text-4xl text-stone-800 leading-none mb-2">{goals.length}</div>
          <div className="section-label">Total goals</div>
        </div>
        <div className="bg-stone-100 p-6 text-center">
          <div className="font-serif text-4xl text-stone-800 leading-none mb-2">{active.length}</div>
          <div className="section-label">In progress</div>
        </div>
        <div className="bg-stone-100 p-6 text-center">
          <div className="font-serif text-4xl text-stone-800 leading-none mb-2">{completed.length}</div>
          <div className="section-label">Completed</div>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md border border-stone-300 p-7 space-y-4" style={{ background: 'var(--pageBG)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-widest">{editId ? 'Edit Goal' : 'New Goal'}</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-ink transition-colors"><X size={16} /></button>
            </div>
            <div>
              <label className="label">Goal title *</label>
              <input className="input" placeholder="e.g. Complete maths revision chapters 1–5" value={form.title} onChange={set('title')} />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={set('description')} />
            </div>
            <div>
              <label className="label">Due date (optional)</label>
              <input type="date" className="input" value={form.due_date} onChange={set('due_date')} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={saveGoal} disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-5">
                <Check size={14} /> {editId ? 'Update' : 'Add Goal'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary py-2.5 px-5">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Active goals */}
      <div>
        <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Active Goals ({active.length})</h2>
        {active.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-xs text-stone-500">No active goals. Add one to get started.</p>
          </div>
        ) : (
          <div className="border border-stone-300 divide-y divide-stone-300">
            {active.map(goal => (
              <div key={goal.id} className="flex items-start gap-4 px-5 py-4 bg-stone-100 hover:bg-stone-200 transition-colors">
                <button onClick={() => toggleComplete(goal)}
                  className="w-5 h-5 border-2 border-stone-400 hover:border-ink flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{goal.title}</div>
                  {goal.description && <p className="text-xs text-stone-500 mt-0.5">{goal.description}</p>}
                  {goal.due_date && (
                    <div className="text-2xs uppercase tracking-wider text-stone-400 mt-1">
                      Due {new Date(goal.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(goal)} className="p-1.5 text-stone-400 hover:text-ink transition-colors"><Edit3 size={13} /></button>
                  <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-stone-400 hover:text-ink transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-widest mb-4">Completed ({completed.length})</h2>
          <div className="border border-stone-300 divide-y divide-stone-300 opacity-60">
            {completed.map(goal => (
              <div key={goal.id} className="flex items-center gap-4 px-5 py-3.5 bg-stone-100">
                <button onClick={() => toggleComplete(goal)}
                  className="w-5 h-5 bg-ink flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-stone-100" />
                </button>
                <div className="flex-1 text-sm text-stone-500 line-through">{goal.title}</div>
                <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-stone-400 hover:text-ink transition-colors"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning resources */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <BookOpen size={15} className="opacity-60" />
          <h2 className="font-semibold text-sm uppercase tracking-widest">Free Learning Resources</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-300">
          {LEARNING_RESOURCES.map(({ title, desc, url, badge }) => (
            <a key={title} href={url} target="_blank" rel="noopener noreferrer"
              className="bg-stone-100 p-5 hover:bg-stone-200 transition-colors group">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="font-semibold text-sm">{title}</div>
                <span className="badge badge-muted flex-shrink-0">{badge}</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
              <div className="flex items-center gap-1 text-2xs uppercase tracking-widest mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Visit <ExternalLink size={10} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
