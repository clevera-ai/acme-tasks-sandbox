import { useSyncExternalStore } from 'react'
import { seed, type AppState, type Member, type PlanName, type Project, type Role, type SavedFilter, type Task } from './seed'
import { initials, todayIso, uid } from './util'

const DATA_KEY = 'acme-tasks:data:v1'
const SESSION_KEY = 'acme-tasks:session:v1'

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, value: string | null): void {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value) } catch { /* ignore */ }
}

// `?reset` in the URL reseeds the demo data and signs out.
function consumeReset(): boolean {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('reset')) return false
  safeSet(DATA_KEY, null)
  safeSet(SESSION_KEY, null)
  url.searchParams.delete('reset')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  return true
}

function load(): AppState {
  consumeReset()
  const raw = safeGet(DATA_KEY)
  if (raw) {
    try { return { ...seed(), ...JSON.parse(raw) } } catch { /* fall through to seed */ }
  }
  const fresh = seed()
  safeSet(DATA_KEY, JSON.stringify(fresh))
  return fresh
}

let state: AppState = load()
let session: { email: string } | null = (() => {
  try { return JSON.parse(safeGet(SESSION_KEY) ?? 'null') } catch { return null }
})()
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
const emit = () => listeners.forEach((l) => l())

function update(fn: (s: AppState) => AppState): void {
  state = fn(state)
  safeSet(DATA_KEY, JSON.stringify(state))
  emit()
}

export const useStore = (): AppState => useSyncExternalStore(subscribe, () => state)
export const useSession = () => useSyncExternalStore(subscribe, () => session)

export function signIn(email: string): void {
  session = { email }
  safeSet(SESSION_KEY, JSON.stringify(session))
  emit()
}
export function signOut(): void {
  session = null
  safeSet(SESSION_KEY, null)
  emit()
}

export const act = {
  addProject(name: string, color: string, description: string): string {
    const id = uid('p')
    update((s) => ({ ...s, projects: [{ id, name, color, description, archived: false, createdAt: todayIso() }, ...s.projects] }))
    return id
  },
  editProject(id: string, patch: Partial<Project>) {
    update((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  },
  addTask(task: Omit<Task, 'id'>) {
    update((s) => ({ ...s, tasks: [...s.tasks, { ...task, id: uid('t') }] }))
  },
  editTask(id: string, patch: Partial<Task>) {
    update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  },
  deleteTasks(ids: string[]) {
    update((s) => ({ ...s, tasks: s.tasks.filter((t) => !ids.includes(t.id)) }))
  },
  addSavedFilter(f: Omit<SavedFilter, 'id'>) {
    update((s) => ({ ...s, savedFilters: [...s.savedFilters, { ...f, id: uid('f') }] }))
  },
  removeSavedFilter(id: string) {
    update((s) => ({ ...s, savedFilters: s.savedFilters.filter((f) => f.id !== id) }))
  },
  invite(email: string, role: Role) {
    const m: Member = { id: uid('m'), name: email.split('@')[0], email, role, status: 'Invited', invitedAt: todayIso() }
    update((s) => ({ ...s, members: [...s.members, m] }))
  },
  resend(id: string) {
    update((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, invitedAt: todayIso() } : m)) }))
  },
  removeMember(id: string) {
    update((s) => ({
      ...s,
      members: s.members.filter((m) => m.id !== id),
      tasks: s.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: '' } : t)),
    }))
  },
  setPlan(plan: PlanName, invoiceAmount: number | null) {
    update((s) => ({
      ...s,
      plan,
      invoices: invoiceAmount === null ? s.invoices : [
        { id: `INV-${1000 + s.invoices.length}`, date: todayIso(), amount: invoiceAmount, plan, status: 'Paid' },
        ...s.invoices,
      ],
    }))
  },
  setProfile(name: string, ini: string, language: AppState['language']) {
    update((s) => ({
      ...s,
      language,
      profile: { ...s.profile, name, initials: ini || initials(name) },
      members: s.members.map((m) => (m.id === 'm-alex' ? { ...m, name } : m)),
    }))
  },
  setNotification(key: keyof AppState['notifications'], value: boolean) {
    update((s) => ({ ...s, notifications: { ...s.notifications, [key]: value } }))
  },
  setTheme(theme: 'light' | 'dark') {
    update((s) => ({ ...s, theme }))
  },
  connectSlack(workspace: string, channel: string) {
    update((s) => ({ ...s, integrations: { ...s.integrations, slack: { workspace, channel } } }))
  },
  connectGcal(account: string, sync: boolean) {
    update((s) => ({ ...s, integrations: { ...s.integrations, gcal: { account, sync } } }))
  },
  disconnect(kind: 'slack' | 'gcal') {
    update((s) => ({ ...s, integrations: { ...s.integrations, [kind]: null } }))
  },
}

export const memberName = (s: AppState, id: string): string => s.members.find((m) => m.id === id)?.name ?? 'Unassigned'
