import { daysFromNow } from './util'

export type Role = 'Owner' | 'Admin' | 'Member' | 'Viewer'
export type Status = 'todo' | 'in_progress' | 'done'
export type Priority = 'Low' | 'Medium' | 'High'
export type PlanName = 'Free' | 'Team' | 'Business'

export interface Member { id: string; name: string; email: string; role: Role; status: 'Active' | 'Invited'; invitedAt?: string }
export interface Project { id: string; name: string; color: string; archived: boolean; description: string; createdAt: string }
export interface Task { id: string; projectId: string; title: string; assigneeId: string; due: string; priority: Priority; status: Status; labels: string[] }
export interface Invoice { id: string; date: string; amount: number; plan: PlanName; status: 'Paid' }
export interface SavedFilter { id: string; name: string; assignee: string; status: string }
export interface AppState {
  projects: Project[]
  tasks: Task[]
  members: Member[]
  invoices: Invoice[]
  plan: PlanName
  profile: { name: string; initials: string; email: string }
  notifications: { email: boolean; desktop: boolean; weekly: boolean; mentions: boolean; dueReminders: boolean }
  language: 'English' | 'Deutsch' | 'Español'
  integrations: { slack: null | { workspace: string; channel: string }; gcal: null | { account: string; sync: boolean } }
  savedFilters: SavedFilter[]
  theme: 'light' | 'dark'
}

const T = (n: number, projectId: string, title: string, assigneeId: string, due: number, priority: Priority, status: Status, labels: string[] = []): Task => ({
  id: `t-${projectId}-${n}`, projectId, title, assigneeId, due: daysFromNow(due), priority, status, labels,
})

export function seed(): AppState {
  const p1 = 'p-web', p2 = 'p-mobile', p3 = 'p-onboard'
  return {
    projects: [
      { id: p1, name: 'Website Relaunch', color: '#6366f1', archived: false, description: 'Rebuild the marketing site with the new brand.', createdAt: daysFromNow(-60) },
      { id: p2, name: 'Mobile App v2', color: '#10b981', archived: false, description: 'Second major release of the iOS and Android apps.', createdAt: daysFromNow(-45) },
      { id: p3, name: 'Customer Onboarding', color: '#f59e0b', archived: false, description: 'Make the first week with Acme delightful.', createdAt: daysFromNow(-20) },
    ],
    tasks: [
      T(1, p1, 'Audit current homepage copy', 'm-dana', 3, 'High', 'in_progress', ['Docs']),
      T(2, p1, 'Design new pricing page', 'm-priya', 7, 'High', 'todo', ['Design']),
      T(3, p1, 'Migrate blog to new CMS', 'm-marcus', 14, 'Medium', 'todo', ['Feature']),
      T(4, p1, 'Set up 301 redirects', 'm-marcus', -2, 'High', 'done'),
      T(5, p1, 'Write launch announcement', 'm-dana', 10, 'Medium', 'todo', ['Docs']),
      T(6, p1, 'Run accessibility check', 'm-priya', 5, 'Low', 'in_progress', ['Bug']),
      T(1, p2, 'Add push notification settings', 'm-marcus', 6, 'Medium', 'in_progress', ['Feature']),
      T(2, p2, 'Fix crash on launch (Android 12)', 'm-alex', 1, 'High', 'in_progress', ['Bug']),
      T(3, p2, 'Dark splash screen', 'm-priya', 9, 'Low', 'todo', ['Design']),
      T(4, p2, 'Offline sync spike', 'm-marcus', 12, 'High', 'todo', ['Feature']),
      T(5, p2, 'Prepare App Store screenshots', 'm-priya', -4, 'Medium', 'done', ['Design']),
      T(6, p2, 'Triage beta feedback', 'm-dana', 2, 'Medium', 'todo'),
      T(1, p3, 'Draft welcome email series', 'm-dana', 4, 'High', 'in_progress', ['Docs']),
      T(2, p3, 'Record product walkthrough', 'm-alex', 8, 'Medium', 'todo'),
      T(3, p3, 'Build in-app checklist', 'm-marcus', 15, 'High', 'todo', ['Feature']),
      T(4, p3, 'Define activation metric', 'm-alex', -1, 'High', 'done'),
      T(5, p3, 'Write customer interview script', 'm-priya', 11, 'Low', 'todo', ['Docs']),
      T(6, p3, 'Update help-center articles', 'm-dana', 20, 'Low', 'todo', ['Docs']),
    ],
    members: [
      { id: 'm-alex', name: 'Alex Demo', email: 'demo@acme-tasks.test', role: 'Owner', status: 'Active' },
      { id: 'm-dana', name: 'Dana Whitfield', email: 'dana@acme-tasks.test', role: 'Admin', status: 'Active' },
      { id: 'm-marcus', name: 'Marcus Lee', email: 'marcus@acme-tasks.test', role: 'Member', status: 'Active' },
      { id: 'm-priya', name: 'Priya Nair', email: 'priya@acme-tasks.test', role: 'Member', status: 'Active' },
    ],
    invoices: [5, 4, 3, 2, 1, 0].map((ago, i) => {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - ago)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      return { id: `INV-${1000 + i}`, date: iso, amount: 48, plan: 'Team' as PlanName, status: 'Paid' as const }
    }).reverse(),
    plan: 'Team',
    profile: { name: 'Alex Demo', initials: 'AD', email: 'demo@acme-tasks.test' },
    notifications: { email: true, desktop: false, weekly: true, mentions: true, dueReminders: false },
    language: 'English',
    integrations: { slack: null, gcal: null },
    savedFilters: [],
    theme: 'light',
  }
}
