import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, Edit3, X, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const STATUSES = ['not_started','in_progress','submitted','awaiting_response','accepted','unsuccessful']
const STATUS_META = {
  not_started:       { label: 'Not Started',      badge: 'badge-muted' },
  in_progress:       { label: 'In Progress',       badge: 'badge-info' },
  submitted:         { label: 'Submitted',         badge: 'badge-info' },
  awaiting_response: { label: 'Awaiting Response', badge: 'badge-warning' },
  accepted:          { label: 'Accepted',          badge: 'badge-success' },
  unsuccessful:      { label: 'Unsuccessful',      badge: 'badge-danger' },
}

const BLANK = { institution: '', programme: '', status: 'not_started', deadline: '', notes: '', official_url: '', documents_ready: false }

export default function ApplicationTracker() {
  const { user } = useAuth()
  const [apps,     setApps]     = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(BLANK)
  const [editId,   setEditId]   = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [pathwayTasks, setPathwayTasks] = useState([])

  useEffect(() => {
    fetchApps()
    fetchPathwayTasks()
  }, [user])

  async function fetchApps() {
    if (!user) return
    const { data } = await supabase.from('applications').select('*')
      .eq('user_id', user.id).order('deadline', { ascending: true, nullsFirst: false })
    setApps(data || [])
  }

  async function fetchPathwayTasks() {
    if (!user) {
      setPathwayTasks([])
      return
    }
    try {
      setPathwayTasks(await api.get('/api/pathway-tasks'))
    } catch (err) {
      toast.error(`Could not load pathway tasks: ${err.message}`)
    }
  }

  async function togglePathwayTask(task) {
    try {
      const updated = await api.patch('/api/pathway-tasks', {
        id: task.id,
        completed: !task.completed,
      })
      setPathwayTasks(current => current.map(item => item.id === task.id ? updated : item))
    } catch (err) {
      toast.error(`Could not update task: ${err.message}`)
    }
  }

  async function deletePathwayTask(task) {
    try {
      await api.delete('/api/pathway-tasks', task.id)
      setPathwayTasks(current => current.filter(item => item.id !== task.id))
      toast.success('Task removed')
    } catch (err) {
      toast.error(`Could not remove task: ${err.message}`)
    }
  }

  async function saveApp() {
    if (!form.institution || !form.programme) { toast.error('Institution and programme are required'); return }
    setSaving(true)
    if (editId) {
      const { error } = await supabase.from('applications').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editId)
      if (!error) toast.success('Application updated'); else toast.error(error.message)
    } else {
      const { error } = await supabase.from('applications').insert({ ...form, user_id: user.id })
      if (!error) toast.success('Application added'); else toast.error(error.message)
    }
    setSaving(false)
    setForm(BLANK); setEditId(null); setShowForm(false)
    fetchApps()
  }

  async function deleteApp(id) {
    if (!confirm('Delete this application?')) return
    await supabase.from('applications').delete().eq('id', id)
    toast.success('Deleted'); fetchApps()
  }

  function startEdit(app) {
    setForm({ institution: app.institution, programme: app.programme, status: app.status,
      deadline: app.deadline || '', notes: app.notes || '', official_url: app.official_url || '',
      documents_ready: app.documents_ready })
    setEditId(app.id); setShowForm(true)
  }

  const set = k => e => setForm(v => ({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: apps.filter(a => a.status === s).length }), {})

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-300 pb-8 flex items-end justify-between">
        <div>
          <p className="section-label mb-3">Tracker</p>
          <h1 className="page-title">Applications</h1>
          <p className="page-sub">Track your university and TVET college applications.</p>
        </div>
        <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
          className="btn-primary flex items-center gap-2 py-2.5 px-5 text-xs">
          <Plus size={14} /> Add Application
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-stone-300">
        {STATUSES.map(s => (
          <div key={s} className="bg-stone-100 p-4 text-center">
            <div className="font-serif text-3xl text-stone-800 leading-none mb-2">{counts[s]}</div>
            <span className={`badge ${STATUS_META[s].badge}`}>{STATUS_META[s].label}</span>
          </div>
        ))}
      </div>

      <section className="border border-stone-300 bg-stone-100">
        <div className="px-5 py-4 border-b border-stone-300">
          <h2 className="font-semibold text-sm uppercase tracking-widest">Pathway action list</h2>
          <p className="text-xs text-stone-500 mt-1">Next steps saved from your AI Pathway Advisor.</p>
        </div>
        {pathwayTasks.length === 0 ? (
          <p className="px-5 py-4 text-xs text-stone-500">No pathway tasks yet. Add next steps from a pathway recommendation.</p>
        ) : (
          <ul className="divide-y divide-stone-300">
            {pathwayTasks.map(task => (
              <li key={task.id} className="flex items-start gap-3 px-5 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={task.completed}
                  onChange={() => togglePathwayTask(task)}
                  aria-label={`Mark task ${task.completed ? 'incomplete' : 'complete'}`}
                />
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                  {task.title}
                </span>
                <button onClick={() => deletePathwayTask(task)} className="p-1 text-stone-400 hover:text-ink" aria-label="Delete task">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg border border-stone-300 p-7 space-y-4" style={{ background: 'var(--pageBG)' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm uppercase tracking-widest">{editId ? 'Edit Application' : 'Add Application'}</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-ink transition-colors"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Institution *</label>
                <input className="input" placeholder="e.g. University of Pretoria" value={form.institution} onChange={set('institution')} />
              </div>
              <div className="col-span-2">
                <label className="label">Programme *</label>
                <input className="input" placeholder="e.g. BSc Computer Science" value={form.programme} onChange={set('programme')} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input" value={form.deadline} onChange={set('deadline')} />
              </div>
              <div className="col-span-2">
                <label className="label">Official application URL</label>
                <input className="input" placeholder="https://…" value={form.official_url} onChange={set('official_url')} />
              </div>
              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={form.notes} onChange={set('notes')} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="docs" className="w-4 h-4" checked={form.documents_ready} onChange={set('documents_ready')} />
                <label htmlFor="docs" className="text-sm text-stone-600">Documents ready (certified results, ID, etc.)</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={saveApp} disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-5">
                <Check size={14} /> {editId ? 'Update' : 'Add Application'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary py-2.5 px-5">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {apps.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-xs text-stone-500 mb-3">No applications yet.</p>
          <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
            className="text-xs underline underline-offset-2 font-medium hover:no-underline">
            Add your first application
          </button>
        </div>
      ) : (
        <div className="border border-stone-300 divide-y divide-stone-300">
          {apps.map(app => (
            <div key={app.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 bg-stone-100 hover:bg-stone-200 transition-colors">
              <div className="flex-1">
                <div className="text-sm font-semibold">{app.programme}</div>
                <div className="text-xs text-stone-500 mt-0.5">{app.institution}</div>
                {app.notes && <div className="text-xs text-stone-400 mt-1">{app.notes}</div>}
                {app.deadline && (
                  <div className="text-2xs uppercase tracking-wider text-stone-400 mt-1">
                    Deadline: {new Date(app.deadline).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {app.documents_ready && <span className="badge badge-success">Docs ready</span>}
                <span className={`badge ${STATUS_META[app.status].badge}`}>{STATUS_META[app.status].label}</span>
                {app.official_url && (
                  <a href={app.official_url} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-stone-400 hover:text-ink transition-colors">
                    <ExternalLink size={14} />
                  </a>
                )}
                <button onClick={() => startEdit(app)} className="p-2 text-stone-400 hover:text-ink transition-colors"><Edit3 size={14} /></button>
                <button onClick={() => deleteApp(app.id)} className="p-2 text-stone-400 hover:text-ink transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
