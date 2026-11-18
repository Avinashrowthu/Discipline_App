import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import {
  Activity, BarChart3, BookOpen, BriefcaseBusiness, Check, ChevronRight,
  CircleDollarSign, HeartPulse, Home, Moon, Plus, Settings, Sun,
  Target, UserRound, X,
} from 'lucide-react'
import { create, list, remove, update, type BaseRecord } from './database/repositories'
import { exportBackup, validateAndRestore } from './services/backup'
import { db } from './database/db'
import './App.css'

type Field = { name: string; label: string; type?: 'text' | 'number' | 'date' | 'time' | 'select'; options?: string[] }

function today() { return new Date().toISOString().slice(0, 10) }

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lifeos-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('lifeos-theme', theme)
  }, [theme])
  return { theme, setTheme }
}

function AppShell({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const primary = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/day', label: 'My Day', icon: Check },
    { to: '/habits', label: 'Habits', icon: Activity },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/more', label: 'More', icon: Settings },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">L</span><span>LifeOS</span></div>
        <nav>{primary.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} /><span>{label}</span>
          </NavLink>
        ))}</nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><span className="eyebrow">{greeting}</span><h1>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h1></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <NavLink className="avatar" to="/settings" aria-label="Settings"><UserRound size={19} /></NavLink>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
      <nav className="bottom-nav">{primary.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
          <Icon size={21} /><span>{label}</span>
        </NavLink>
      ))}</nav>
    </div>
  )
}

function Modal({ title, fields, value, onClose, onSave }: {
  title: string; fields: Field[]; value?: BaseRecord; onClose: () => void; onSave: (data: Record<string, unknown>) => Promise<void>
}) {
  const [data, setData] = useState<Record<string, unknown>>(value ?? {})
  const [saving, setSaving] = useState(false)
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(data); setSaving(false); onClose() }}>
          <div className="form-grid">
            {fields.map(field => (
              <label key={field.name}>{field.label}
                {field.type === 'select' ? (
                  <select value={String(data[field.name] ?? '')} onChange={e => setData({ ...data, [field.name]: e.target.value })} required>
                    <option value="">Select</option>{field.options?.map(option => <option key={option}>{option}</option>)}
                  </select>
                ) : (
                  <input required type={field.type ?? 'text'} value={String(data[field.name] ?? '')} onChange={e => setData({ ...data, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })} />
                )}
              </label>
            ))}
          </div>
          <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>
        </form>
      </div>
    </div>
  )
}

function GenericModule({ table, title, subtitle, fields, itemName = 'name' }: {
  table: string; title: string; subtitle: string; fields: Field[]; itemName?: 'name' | 'title' | 'description'
}) {
  const [records, setRecords] = useState<BaseRecord[]>([])
  const [modal, setModal] = useState<{ open: boolean; value?: BaseRecord }>({ open: false })
  const [search, setSearch] = useState('')
  const refresh = async () => setRecords(await list(table))
  useEffect(() => { refresh() }, [table])
  const filtered = records.filter(record => JSON.stringify(record).toLowerCase().includes(search.toLowerCase()))
  return (
    <section>
      <div className="section-heading"><div><span className="eyebrow">LifeOS module</span><h2>{title}</h2><p>{subtitle}</p></div><button className="button primary" onClick={() => setModal({ open: true })}><Plus size={18} /> Add new</button></div>
      <div className="toolbar"><input className="search" placeholder={`Search ${title.toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)} /></div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Plus size={22} /></div><h3>No {title.toLowerCase()} yet</h3><p>Start by adding your first record.</p><button className="button primary" onClick={() => setModal({ open: true })}><Plus size={17} /> Add {title}</button></div>
      ) : (
        <div className="record-grid">{filtered.map(record => (
          <article className="record-card" key={record.id}>
            <div><h3>{String(record[itemName] ?? record.title ?? record.name ?? 'Untitled')}</h3><p>{String(record.description ?? record.category ?? record.status ?? '')}</p></div>
            <div className="record-actions"><button className="text-button" onClick={() => setModal({ open: true, value: record })}>Edit</button><button className="danger-text" onClick={async () => { if (confirm('Delete this record?')) { await remove(table, record.id); await refresh() } }}>Delete</button></div>
          </article>
        ))}</div>
      )}
      {modal.open && <Modal title={modal.value ? `Edit ${title}` : `Add ${title}`} fields={fields} value={modal.value} onClose={() => setModal({ open: false })} onSave={async data => { if (modal.value) await update(table, modal.value.id, data); else await create(table, data); await refresh() }} />}
    </section>
  )
}

function Dashboard() {
  const [tasks, setTasks] = useState<BaseRecord[]>([])
  const [habits, setHabits] = useState<BaseRecord[]>([])
  const [completions, setCompletions] = useState<BaseRecord[]>([])
  useEffect(() => {
    Promise.all([list('tasks'), list('habits'), list('habitCompletions')]).then(([t, h, c]) => { setTasks(t); setHabits(h); setCompletions(c) })
  }, [])
  const date = today()
  const todaysTasks = tasks.filter(t => t.dueDate === date)
  const completedTasks = todaysTasks.filter(t => t.status === 'Completed').length
  const completedHabits = completions.filter(c => c.date === date).length
  const progress = todaysTasks.length + habits.length ? Math.round(((completedTasks + completedHabits) / (todaysTasks.length + habits.length)) * 100) : 0
  const priorities = tasks.filter(t => t.status !== 'Completed').sort((a, b) => String(a.dueTime ?? '').localeCompare(String(b.dueTime ?? ''))).slice(0, 3)
  return (
    <section>
      <div className="dashboard-title"><div><span className="eyebrow">Today</span><h2>Your life, at a glance</h2></div></div>
      <div className="stat-grid">
        <article className="stat-card"><span>Today's progress</span><strong>{progress}%</strong><div className="progress"><div style={{ width: `${progress}%` }} /></div></article>
        <article className="stat-card"><span>Tasks completed</span><strong>{completedTasks}</strong><small>{todaysTasks.length - completedTasks} remaining</small></article>
        <article className="stat-card"><span>Habits completed</span><strong>{completedHabits}</strong><small>{Math.max(habits.length - completedHabits, 0)} remaining</small></article>
      </div>
      <div className="dashboard-grid">
        <article className="panel"><div className="panel-header"><div><span className="eyebrow">Priorities</span><h3>Today's focus</h3></div><button className="icon-button" onClick={() => location.hash = '#/day'} aria-label="View tasks"><ChevronRight size={19} /></button></div>
          {priorities.length ? priorities.map(task => <div className="task-row" key={task.id}><button className="check" aria-label={`Complete ${task.title}`} onClick={async () => { await update('tasks', task.id, { status: 'Completed', completionDate: today() }); setTasks(await list('tasks')) }} /><div><strong>{String(task.title)}</strong><small>{String(task.category ?? 'Personal')} · {String(task.dueTime ?? 'Any time')}</small></div><span className={`priority ${String(task.priority).toLowerCase()}`}>{String(task.priority ?? 'Medium')}</span></div>) : <div className="panel-empty">No pending priorities. Your day is clear.</div>}
        </article>
        <article className="panel"><div className="panel-header"><div><span className="eyebrow">Habits</span><h3>Daily routines</h3></div></div>
          {habits.length ? habits.slice(0, 5).map(habit => {
            const done = completions.some(c => c.habitId === habit.id && c.date === date)
            return <div className="task-row" key={habit.id}><button className={`check ${done ? 'checked' : ''}`} aria-label={`Toggle ${habit.name}`} onClick={async () => {
              if (done) { const record = completions.find(c => c.habitId === habit.id && c.date === date); if (record) await remove('habitCompletions', record.id) }
              else await create('habitCompletions', { habitId: habit.id, date, completed: true })
              setCompletions(await list('habitCompletions'))
            }}>{done ? <Check size={14} /> : null}</button><strong>{String(habit.name)}</strong></div>
          }) : <div className="panel-empty">Add habits to start building consistency.</div>}
        </article>
      </div>
      <div className="quick-actions"><span>Quick actions</span><NavLink to="/day" className="quick"><Plus size={17} /> Add task</NavLink><NavLink to="/habits" className="quick"><Plus size={17} /> Add habit</NavLink><NavLink to="/finance" className="quick"><CircleDollarSign size={17} /> Add transaction</NavLink><NavLink to="/journal" className="quick"><BookOpen size={17} /> Journal</NavLink></div>
    </section>
  )
}

function MyDay() {
  const fields: Field[] = [
    { name: 'title', label: 'Task title' }, { name: 'description', label: 'Description' },
    { name: 'category', label: 'Category', type: 'select', options: ['Work', 'Health', 'Learning', 'Personal', 'Finance', 'Other'] },
    { name: 'priority', label: 'Priority', type: 'select', options: ['Urgent', 'High', 'Medium', 'Low'] },
    { name: 'dueDate', label: 'Due date', type: 'date' }, { name: 'dueTime', label: 'Due time', type: 'time' },
  ]
  return <GenericModule table="tasks" title="Tasks" subtitle="Plan the work that matters today." fields={fields} itemName="title" />
}

function Habits() {
  const fields: Field[] = [
    { name: 'name', label: 'Habit name' }, { name: 'description', label: 'Description' },
    { name: 'category', label: 'Category', type: 'select', options: ['Health', 'Work', 'Learning', 'Personal', 'Finance'] },
    { name: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Weekdays', 'Weekly', 'Custom'] },
    { name: 'target', label: 'Daily target', type: 'number' }, { name: 'startDate', label: 'Start date', type: 'date' },
    { name: 'reminderTime', label: 'Reminder time', type: 'time' },
  ]
  return <GenericModule table="habits" title="Habits" subtitle="Small actions, repeated consistently." fields={fields} />
}

function Analytics() {
  const [tasks, setTasks] = useState<BaseRecord[]>([])
  const [habits, setHabits] = useState<BaseRecord[]>([])
  const [completions, setCompletions] = useState<BaseRecord[]>([])
  useEffect(() => { Promise.all([list('tasks'), list('habits'), list('habitCompletions')]).then(([t,h,c]) => { setTasks(t); setHabits(h); setCompletions(c) }) }, [])
  const completedTasks = tasks.filter(t => t.status === 'Completed').length
  const taskRate = tasks.length ? Math.round(completedTasks / tasks.length * 100) : 0
  const habitRate = habits.length ? Math.round(completions.length / habits.length * 100) : 0
  return <section><div className="section-heading"><div><span className="eyebrow">Insights</span><h2>Analytics</h2><p>Calculated from your locally stored records.</p></div></div><div className="stat-grid"><article className="stat-card"><span>Task completion</span><strong>{taskRate}%</strong><small>{completedTasks} of {tasks.length} tasks</small></article><article className="stat-card"><span>Habit completions</span><strong>{habitRate}%</strong><small>{completions.length} check-ins</small></article><article className="stat-card"><span>Active habits</span><strong>{habits.length}</strong><small>Across all categories</small></article></div></section>
}

function More() {
  const modules = [
    ['Health & Fitness', '/health', HeartPulse], ['Finance', '/finance', CircleDollarSign], ['Career', '/career', BriefcaseBusiness],
    ['Learning', '/learning', BookOpen], ['Goals', '/goals', Target], ['Journal', '/journal', Activity], ['Settings', '/settings', Settings],
  ] as const
  return <section><div className="section-heading"><div><span className="eyebrow">Life areas</span><h2>More</h2><p>Manage every part of your life.</p></div></div><div className="module-grid">{modules.map(([label, to, Icon]) => <NavLink to={to} className="module-card" key={to}><span className="module-icon"><Icon size={21} /></span><div><h3>{label}</h3><span>Open module</span></div><ChevronRight size={18} /></NavLink>)}</div></section>
}

function SettingsPage() {
  const [profile, setProfile] = useState<Record<string, unknown>>({})
  const [message, setMessage] = useState('')
  useEffect(() => { list('profile').then(rows => { if (rows[0]) setProfile(rows[0]) }) }, [])
  const downloadBackup = async () => {
    const backup = await exportBackup()
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `lifeos-backup-${today()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
  }
  const restoreBackup = async (file?: File) => {
    if (!file) return
    if (!confirm('Restoring replaces all current LifeOS records. Continue?')) return
    try {
      await validateAndRestore(file)
      setMessage('Backup restored successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not restore the backup.')
    }
  }
  const clearData = async () => {
    if (!confirm('Clear every LifeOS record? This cannot be undone.')) return
    await db.delete()
    setMessage('All application data was cleared. Reload the app to initialise storage.')
  }
  return <section><div className="section-heading"><div><span className="eyebrow">Personalisation</span><h2>Settings</h2><p>Preferences and local data management.</p></div></div>{message && <div className="notice">{message}</div>}<article className="panel"><h3>Profile</h3><form onSubmit={async e => { e.preventDefault(); const fd = new FormData(e.currentTarget); const data = { name: String(fd.get('name') ?? ''), currency: String(fd.get('currency') ?? 'INR'), height: Number(fd.get('height') ?? 0) }; const rows = await list('profile'); if (rows[0]) await update('profile', rows[0].id, data); else await create('profile', data); setProfile(data); setMessage('Profile saved.') }}><div className="form-grid"><label>Display name<input name="name" defaultValue={String(profile.name ?? '')} /></label><label>Currency<select name="currency" defaultValue={String(profile.currency ?? 'INR')}><option>INR</option><option>USD</option><option>EUR</option></select></label><label>Height (cm)<input name="height" type="number" defaultValue={String(profile.height ?? '')} /></label></div><button className="button primary" type="submit">Save profile</button></form></article><article className="panel data-panel"><h3>Data management</h3><p>Personal data stays in this browser. Clearing browser storage or losing the device can remove it, so keep regular backups.</p><div className="data-actions"><button className="button secondary" onClick={downloadBackup}>Export backup</button><label className="button secondary restore-button">Restore backup<input type="file" accept="application/json,.json" onChange={e => restoreBackup(e.target.files?.[0])} /></label><button className="button danger" onClick={clearData}>Clear all data</button></div></article></section>
}

function Health() {
  return <GenericModule table="weightEntries" title="Health & Fitness" subtitle="Track weight, workouts, water, sleep and nutrition." fields={[{ name: 'title', label: 'Entry title' }, { name: 'weight', label: 'Weight (kg)', type: 'number' }, { name: 'date', label: 'Date', type: 'date' }, { name: 'notes', label: 'Notes' }]} itemName="title" />
}
function Finance() {
  return <GenericModule table="expenses" title="Finance" subtitle="Record income and expenses to understand your monthly cash flow." fields={[{ name: 'description', label: 'Description' }, { name: 'amount', label: 'Amount (INR)', type: 'number' }, { name: 'category', label: 'Category', type: 'select', options: ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'] }, { name: 'date', label: 'Date', type: 'date' }, { name: 'paymentMethod', label: 'Payment method', type: 'select', options: ['UPI', 'Cash', 'Card', 'Bank'] }]} itemName="description" />
}
function Career() {
  return <GenericModule table="projects" title="Career" subtitle="Manage projects and professional growth." fields={[{ name: 'name', label: 'Project name' }, { name: 'description', label: 'Description' }, { name: 'startDate', label: 'Start date', type: 'date' }, { name: 'targetDate', label: 'Target date', type: 'date' }, { name: 'status', label: 'Status', type: 'select', options: ['Not started', 'In progress', 'Completed'] }, { name: 'progress', label: 'Progress (%)', type: 'number' }]} />
}
function Learning() {
  return <GenericModule table="learningResources" title="Learning" subtitle="Track courses, books and skills." fields={[{ name: 'name', label: 'Learning title' }, { name: 'category', label: 'Category', type: 'select', options: ['UX/UI Design', 'Product Design', 'Figma', 'AI Tools', 'Frontend Development', 'Business', 'Personal Development', 'Other'] }, { name: 'url', label: 'Resource URL' }, { name: 'status', label: 'Status', type: 'select', options: ['Not started', 'In progress', 'Completed'] }, { name: 'progress', label: 'Progress (%)', type: 'number' }]} />
}
function Goals() {
  return <GenericModule table="goals" title="Goals" subtitle="Turn important intentions into measurable milestones." fields={[{ name: 'name', label: 'Goal name' }, { name: 'description', label: 'Description' }, { name: 'category', label: 'Category' }, { name: 'targetDate', label: 'Target date', type: 'date' }, { name: 'progress', label: 'Progress (%)', type: 'number' }, { name: 'status', label: 'Status', type: 'select', options: ['Not started', 'In progress', 'Completed'] }]} />
}
function Journal() {
  return <GenericModule table="journalEntries" title="Journal" subtitle="A private record of thoughts, lessons and gratitude." fields={[{ name: 'date', label: 'Date', type: 'date' }, { name: 'mood', label: 'Mood', type: 'select', options: ['Excellent', 'Good', 'Normal', 'Low', 'Difficult'] }, { name: 'whatWentWell', label: 'What went well?' }, { name: 'improve', label: 'What could improve tomorrow?' }, { name: 'gratitude', label: 'What are you grateful for?' }, { name: 'learned', label: 'What did you learn?' }]} itemName="description" />
}

function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/day" element={<MyDay />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/more" element={<More />} />
        <Route path="/health" element={<Health />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/career" element={<Career />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}
