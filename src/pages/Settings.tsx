import { useState, type FormEvent } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import flags from '../config/flags.json'
import { t } from '../lib/copy'
import { act, useStore } from '../lib/store'
import type { AppState } from '../lib/seed'
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, PageHeader, SelectField, Switch, TextField, cx, useToast } from '../components/ui'
import { InviteForm } from '../components/InviteForm'
import { initials, shortDate } from '../lib/util'

export function SettingsLayout() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    cx('border-b-2 px-4 py-2 text-sm font-medium', isActive ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink')
  return (
    <div>
      <PageHeader title={t('nav.settings')} subtitle="Manage your profile, notifications and team." />
      <nav aria-label="Settings sections" className="mb-6 flex gap-1 border-b border-line">
        <NavLink to="/settings/profile" className={tab}>Profile</NavLink>
        <NavLink to="/settings/notifications" className={tab}>Notifications</NavLink>
        <NavLink to="/settings/members" className={tab}>Members</NavLink>
      </nav>
      <Outlet />
    </div>
  )
}

export function Profile() {
  const { profile, language, theme } = useStore()
  const toast = useToast()
  const [name, setName] = useState(profile.name)
  const [ini, setIni] = useState(profile.initials)
  const [lang, setLang] = useState<AppState['language']>(language)
  const [error, setError] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Name can’t be empty.')
    act.setProfile(name.trim(), (ini.trim() || initials(name)).slice(0, 2).toUpperCase(), lang)
    toast(`Profile saved. Language is set to ${lang}.`)
  }
  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <form onSubmit={submit} noValidate className="space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="flex items-center gap-4">
            <Avatar name={name} text={(ini.trim() || initials(name)).slice(0, 2).toUpperCase()} size={56} />
            <p className="text-sm text-muted">Your avatar shows your initials across Acme Tasks.</p>
          </div>
          <TextField label="Full name" value={name} error={error} onChange={(e) => { setName(e.target.value); setError('') }} />
          <TextField label="Avatar initials" maxLength={2} value={ini} hint="Up to two letters." onChange={(e) => setIni(e.target.value)} className="w-40" />
          <TextField label="Email" value={profile.email} readOnly hint="Your sign-in email can't be changed in this demo." />
          <SelectField label="Language" value={lang} onChange={(e) => setLang(e.target.value as AppState['language'])}>
            <option>English</option><option>Deutsch</option><option>Español</option>
          </SelectField>
          <Button type="submit" variant="primary">{t('settings.save')}</Button>
        </form>
      </Card>
      {flags.darkMode && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-sm text-muted">Use a dark colour scheme across Acme Tasks.</p>
            </div>
            <Switch label="Dark mode" checked={theme === 'dark'} onChange={(v) => { act.setTheme(v ? 'dark' : 'light'); toast(v ? 'Dark mode turned on' : 'Dark mode turned off') }} />
          </div>
        </Card>
      )}
    </div>
  )
}

export function Notifications() {
  const { notifications } = useStore()
  const toast = useToast()
  const rows: { key: keyof AppState['notifications']; title: string; body: string }[] = [
    { key: 'email', title: 'Email notifications', body: 'Get an email when a task is assigned to you.' },
    { key: 'desktop', title: 'Desktop notifications', body: 'Show browser notifications for task activity.' },
    { key: 'weekly', title: 'Weekly summary', body: 'A Monday email with progress across your projects.' },
    { key: 'mentions', title: 'Mentions', body: 'Notify me when someone mentions me.' },
    ...(flags.dueReminders ? [{ key: 'dueReminders' as const, title: 'Due-date reminders', body: 'Remind me the day before a task is due.' }] : []),
  ]
  return (
    <Card className="max-w-2xl">
      <h2 className="mb-2 text-lg font-semibold">Notifications</h2>
      <ul>
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0">
            <div><p className="text-sm font-medium">{r.title}</p><p className="text-sm text-muted">{r.body}</p></div>
            <Switch label={r.title} checked={notifications[r.key]} onChange={(v) => { act.setNotification(r.key, v); toast(`${r.title} turned ${v ? 'on' : 'off'}`) }} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function Members() {
  const { members } = useStore()
  const toast = useToast()
  const [removing, setRemoving] = useState<string | null>(null)
  const target = members.find((m) => m.id === removing)
  return (
    <div className="space-y-6">
      {!flags.addPeople && (
        <Card>
          <h2 className="text-lg font-semibold">{t('members.inviteHeading')}</h2>
          <p className="mb-4 text-sm text-muted">{t('members.inviteHint')}</p>
          <InviteForm />
        </Card>
      )}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Team members ({members.length})</h2>
        {members.length === 0 ? <EmptyState title="No members" body="Invite someone to collaborate." /> : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3"><Avatar name={m.name} size={32} />
                        <span><span className="block font-medium">{m.status === 'Invited' ? m.email : m.name}</span><span className="block text-xs text-muted">{m.status === 'Invited' ? `Invited ${shortDate(m.invitedAt ?? '')}` : m.email}</span></span>
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.role}</td>
                    <td className="px-4 py-3"><Badge tone={m.status === 'Active' ? 'green' : 'amber'}>{m.status === 'Active' ? 'Active' : 'Invite pending'}</Badge></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {m.status === 'Invited' && <Button size="sm" variant="ghost" aria-label={`Resend invitation to ${m.email}`} onClick={() => { act.resend(m.id); toast(`Invitation resent to ${m.email}`) }}>Resend</Button>}
                      {m.role !== 'Owner' && <Button size="sm" variant="ghost" aria-label={`Remove ${m.status === 'Invited' ? m.email : m.name}`} onClick={() => setRemoving(m.id)}>Remove</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {target && (
        <ConfirmDialog title={`Remove ${target.status === 'Invited' ? target.email : target.name}?`} danger confirmLabel="Remove" onCancel={() => setRemoving(null)}
          message={target.status === 'Invited' ? 'Their invitation will be cancelled.' : 'They will lose access to every project. Their tasks become unassigned.'}
          onConfirm={() => { act.removeMember(target.id); toast(`${target.status === 'Invited' ? target.email : target.name} removed from the team`); setRemoving(null) }} />
      )}
    </div>
  )
}
