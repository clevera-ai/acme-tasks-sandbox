import { useState, type FormEvent } from 'react'
import { t } from '../lib/copy'
import { act, useStore } from '../lib/store'
import type { Role } from '../lib/seed'
import { Button, SelectField, TextField, useToast } from './ui'

/** Email + role form. Shared by Settings → Members and the top-bar dialog. */
export function useInvite(onDone?: () => void) {
  const { members } = useStore()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('Member')
  const [error, setError] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setError('Enter a valid email address.')
    if (members.some((m) => m.email.toLowerCase() === v)) return setError('That person is already on your team.')
    act.invite(v, role)
    toast(`Invitation sent to ${v}`)
    setEmail(''); setError('')
    onDone?.()
  }
  const fields = (
    <>
      <TextField label="Email address" type="email" placeholder="name@company.com" value={email} autoFocus
        onChange={(e) => { setEmail(e.target.value); setError('') }} error={error} />
      <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
        <option>Admin</option><option>Member</option><option>Viewer</option>
      </SelectField>
    </>
  )
  return { submit, fields }
}

export function InviteForm() {
  const { submit, fields } = useInvite()
  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-start">
      {fields}
      <Button type="submit" variant="primary" className="sm:mt-6">{t('members.inviteButton')}</Button>
    </form>
  )
}
