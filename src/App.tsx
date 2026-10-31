import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import auth from './config/auth.json'
import flags from './config/flags.json'
import { t } from './lib/copy'
import { signOut, useSession, useStore } from './lib/store'
import { Avatar, Button, Modal, cx } from './components/ui'
import { useInvite } from './components/InviteForm'
import Login from './pages/Login'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import { SettingsLayout, Profile, Notifications, Members } from './pages/Settings'
import Billing from './pages/Billing'
import Integrations from './pages/Integrations'

const NAV = [
  { to: '/projects', key: 'nav.projects' },
  { to: '/integrations', key: 'nav.integrations' },
  { to: '/billing', key: 'nav.billing' },
  { to: '/settings', key: 'nav.settings' },
]

function AddPeopleDialog({ onClose }: { onClose: () => void }) {
  const { submit, fields } = useInvite(onClose)
  return (
    <Modal title={t('invite.dialogTitle')} onClose={onClose} onSubmit={submit}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{t('topbar.addPeople')}</Button></>}>
      {fields}
    </Modal>
  )
}

function UserMenu() {
  const { profile, language } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button aria-label="User menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-soft focus-visible:outline-2 focus-visible:outline-brand">
        <Avatar name={profile.name} text={profile.initials} />
        <span className="hidden text-sm font-medium sm:inline">{profile.name}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-line bg-surface p-1 shadow-xl">
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{profile.name}</p>
            <p className="text-xs text-muted">{profile.email}</p>
            <p className="mt-1 text-xs text-muted">Language: {language}</p>
          </div>
          <div className="my-1 border-t border-line" />
          <Link role="menuitem" to="/settings/profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-soft">Profile settings</Link>
          {auth.mode !== 'none' && (
            <button role="menuitem" onClick={signOut} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-soft">Sign out</button>
          )}
        </div>
      )}
    </div>
  )
}

const SHORTCUTS: [string, string][] = [
  ['?', 'Show keyboard shortcuts'],
  ['g then p', 'Go to Projects'],
  ['g then i', 'Go to Integrations'],
  ['g then b', 'Go to Billing'],
  ['g then s', 'Go to Settings'],
]

function Shortcuts() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    let pending = 0
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '?') { setOpen((o) => !o); return }
      if (e.key === 'g') { pending = Date.now(); return }
      if (Date.now() - pending < 1200) {
        const dest = ({ p: '/projects', i: '/integrations', b: '/billing', s: '/settings' } as Record<string, string>)[e.key]
        if (dest) { navigate(dest); pending = 0 }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [navigate])
  if (!open) return null
  return (
    <Modal title="Keyboard shortcuts" onClose={() => setOpen(false)} footer={<Button onClick={() => setOpen(false)}>Close</Button>}>
      <table className="w-full text-sm"><tbody>
        {SHORTCUTS.map(([k, d]) => (
          <tr key={k} className="border-b border-line last:border-0">
            <td className="py-2 pr-4"><kbd className="rounded border border-line bg-soft px-1.5 py-0.5 font-mono text-xs">{k}</kbd></td>
            <td className="py-2 text-muted">{d}</td>
          </tr>
        ))}
      </tbody></table>
    </Modal>
  )
}

function Layout() {
  const [addPeople, setAddPeople] = useState(false)
  // Navigation items: rendered in the sidebar and the mobile bar.
  const items = flags.brokenDeploy ? undefined : NAV
  const link = ({ isActive }: { isActive: boolean }) =>
    cx('block rounded-ui px-3 py-2 text-sm font-medium', isActive ? 'bg-soft text-brand' : 'text-muted hover:bg-soft hover:text-ink')
  return (
    <div className="min-h-screen md:grid md:grid-cols-[230px_1fr]">
      <aside className="hidden border-r border-line bg-surface p-4 md:flex md:flex-col">
        <Link to="/projects" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">✓</span> Acme Tasks
        </Link>
        <nav aria-label="Main" className="space-y-1">
          {items!.map((n) => <NavLink key={n.to} to={n.to} className={link}>{t(n.key)}</NavLink>)}
        </nav>
        {flags.keyboardShortcuts && <p className="mt-auto px-2 text-xs text-muted">Press <kbd className="rounded border border-line px-1">?</kbd> for keyboard shortcuts</p>}
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 md:px-[var(--page-pad)]">
          <Link to="/projects" className="font-bold md:hidden">Acme Tasks</Link>
          <nav aria-label="Mobile" className="flex gap-1 md:hidden">
            {items!.map((n) => <NavLink key={n.to} to={n.to} className={link}>{t(n.key)}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {flags.addPeople && <Button variant="primary" size="sm" onClick={() => setAddPeople(true)}>{t('topbar.addPeople')}</Button>}
            <UserMenu />
          </div>
        </header>
        <main className="p-4 md:p-[var(--page-pad)]"><Outlet /></main>
      </div>
      {addPeople && <AddPeopleDialog onClose={() => setAddPeople(false)} />}
      {flags.keyboardShortcuts && <Shortcuts />}
    </div>
  )
}

export default function App() {
  const session = useSession()
  const { theme } = useStore()
  useEffect(() => {
    document.documentElement.dataset.theme = flags.darkMode && theme === 'dark' ? 'dark' : 'light'
  }, [theme])

  if (auth.mode !== 'none' && !session) return <Login mode={auth.mode as 'password' | 'password_code'} />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="members" element={<Members />} />
        </Route>
        <Route path="billing" element={<Billing />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="login" element={<Navigate to="/projects" replace />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Route>
    </Routes>
  )
}
