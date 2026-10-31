import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import flags from '../config/flags.json'
import { t } from '../lib/copy'
import { act, memberName, useStore } from '../lib/store'
import type { Priority, Status, Task } from '../lib/seed'
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, Modal, PageHeader, SelectField, TextField, cx, useToast } from '../components/ui'
import { LABELS, shortDate, todayIso } from '../lib/util'

const STATUS_LABEL: Record<Status, string> = { todo: 'To do', in_progress: 'In progress', done: 'Done' }
const PRIORITY_TONE = { High: 'red', Medium: 'amber', Low: 'gray' } as const

function TaskDialog({ projectId, task, onClose }: { projectId: string; task?: Task; onClose: () => void }) {
  const { members } = useStore()
  const toast = useToast()
  const [title, setTitle] = useState(task?.title ?? '')
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '')
  const [due, setDue] = useState(task?.due ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'Medium')
  const [status, setStatus] = useState<Status>(task?.status ?? 'todo')
  const [labels, setLabels] = useState<string[]>(task?.labels ?? [])
  const [error, setError] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setError('Give the task a title.')
    const data = { title: title.trim(), assigneeId, due, priority, status, labels: flags.taskLabels ? labels : task?.labels ?? [] }
    if (task) { act.editTask(task.id, data); toast('Task updated') }
    else { act.addTask({ ...data, projectId }); toast(`Task "${data.title}" created`) }
    onClose()
  }
  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose} onSubmit={submit}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{task ? 'Save task' : 'Create task'}</Button></>}>
      <TextField label="Title" value={title} autoFocus placeholder="What needs to be done?" error={error} onChange={(e) => { setTitle(e.target.value); setError('') }} />
      <SelectField label="Assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
        <option value="">Unassigned</option>
        {members.filter((m) => m.status === 'Active').map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <SelectField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option>Low</option><option>Medium</option><option>High</option>
        </SelectField>
      </div>
      {task && (
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </SelectField>
      )}
      {flags.taskLabels && (
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Labels</legend>
          <div className="flex flex-wrap gap-3">
            {LABELS.map((l) => (
              <label key={l} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={labels.includes(l)} onChange={(e) => setLabels(e.target.checked ? [...labels, l] : labels.filter((x) => x !== l))} /> {l}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </Modal>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const state = useStore()
  const toast = useToast()
  const [assignee, setAssignee] = useState('all')
  const [status, setStatus] = useState('all')
  const [dialog, setDialog] = useState<null | 'create' | Task>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [savingFilter, setSavingFilter] = useState(false)
  const [filterName, setFilterName] = useState('')

  const project = state.projects.find((p) => p.id === id)
  if (!project) {
    return <EmptyState title="Project not found" body="This project doesn't exist or was removed." action={<Link to="/projects" className="text-sm font-medium text-brand hover:underline">Back to projects</Link>} />
  }
  const all = state.tasks.filter((x) => x.projectId === project.id)
  const tasks = all.filter((x) =>
    (assignee === 'all' || (assignee === 'none' ? x.assigneeId === '' : x.assigneeId === assignee)) &&
    (status === 'all' || x.status === status))
  const visibleSelected = selected.filter((s) => tasks.some((x) => x.id === s))
  const filtered = assignee !== 'all' || status !== 'all'

  return (
    <div>
      <p className="mb-2 text-sm"><Link to="/projects" className="text-muted hover:text-ink">← Projects</Link></p>
      <PageHeader
        title={project.name}
        subtitle={<>
          {flags.projectDescription && project.description ? <span className="mb-1 block">{project.description}</span> : null}
          {all.length} tasks · {all.filter((x) => x.status === 'done').length} done {project.archived && <Badge tone="amber">Archived</Badge>}
        </>}
        actions={!project.archived && <Button variant="primary" onClick={() => setDialog('create')}>{t('tasks.create')}</Button>}
      />
      {project.archived && <p className="mb-4 rounded-ui border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">This project is archived. Unarchive it from the Projects page to add or change tasks.</p>}

      {flags.savedFilters && (
        <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="Saved filters">
          <span className="text-sm font-medium text-muted">Saved filters:</span>
          <button className="rounded-full border border-line bg-surface px-3 py-1 text-sm hover:bg-soft" onClick={() => { setAssignee('all'); setStatus('all') }}>All tasks</button>
          {state.savedFilters.map((f) => (
            <span key={f.id} className="inline-flex items-center rounded-full border border-line bg-surface text-sm">
              <button className="rounded-l-full px-3 py-1 hover:bg-soft" onClick={() => { setAssignee(f.assignee); setStatus(f.status); toast(`Applied filter "${f.name}"`) }}>{f.name}</button>
              <button aria-label={`Delete saved filter ${f.name}`} className="rounded-r-full px-2 py-1 text-muted hover:bg-soft hover:text-ink" onClick={() => { act.removeSavedFilter(f.id); toast(`Deleted filter "${f.name}"`) }}>×</button>
            </span>
          ))}
          <Button size="sm" disabled={!filtered} onClick={() => setSavingFilter(true)}>Save current filter</Button>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-end gap-3">
        <SelectField label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-48">
          <option value="all">All assignees</option>
          <option value="none">Unassigned</option>
          {state.members.filter((m) => m.status === 'Active').map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </SelectField>
        {flags.savedFilters && (
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="all">Any status</option>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </SelectField>
        )}
        {flags.bulkDelete && visibleSelected.length > 0 && (
          <Button variant="danger" onClick={() => setBulkConfirm(true)}>Delete selected ({visibleSelected.length})</Button>
        )}
      </div>

      {all.length === 0 ? (
        <EmptyState title="No tasks yet" body="Add the first task to start tracking work in this project." action={!project.archived && <Button variant="primary" onClick={() => setDialog('create')}>{t('tasks.create')}</Button>} />
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks match this filter" body="Try another assignee, or clear the filter to see every task." action={<Button onClick={() => { setAssignee('all'); setStatus('all') }}>Clear filter</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">{t('tasks.heading')} in {project.name}</caption>
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                {flags.bulkDelete && (
                  <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all tasks"
                    checked={visibleSelected.length === tasks.length} onChange={(e) => setSelected(e.target.checked ? tasks.map((x) => x.id) : [])} /></th>
                )}
                <th className="px-4 py-3">{t('tasks.heading')}</th><th className="px-4 py-3">Assignee</th><th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((x) => {
                const overdue = x.due && x.due < todayIso() && x.status !== 'done'
                return (
                  <tr key={x.id} className="border-b border-line last:border-0">
                    {flags.bulkDelete && (
                      <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${x.title}`} checked={selected.includes(x.id)}
                        onChange={(e) => setSelected(e.target.checked ? [...selected, x.id] : selected.filter((s) => s !== x.id))} /></td>
                    )}
                    <td className="px-4 py-3">
                      <span className={cx('font-medium', x.status === 'done' && 'text-muted line-through')}>{x.title}</span>
                      {flags.taskLabels && x.labels.length > 0 && <span className="ml-2 inline-flex gap-1">{x.labels.map((l) => <Badge key={l} tone="blue">{l}</Badge>)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {x.assigneeId ? <span className="flex items-center gap-2"><Avatar name={memberName(state, x.assigneeId)} size={24} />{memberName(state, x.assigneeId)}</span> : <span className="text-muted">Unassigned</span>}
                    </td>
                    <td className={cx('px-4 py-3 whitespace-nowrap', overdue && 'font-medium text-red-600')}>{shortDate(x.due)}{overdue && ' (overdue)'}</td>
                    <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[x.priority]}>{x.priority}</Badge></td>
                    <td className="px-4 py-3">
                      <select aria-label={`Status for ${x.title}`} value={x.status} disabled={project.archived}
                        className="rounded-ui border border-line bg-surface px-2 py-1 text-sm"
                        onChange={(e) => { act.editTask(x.id, { status: e.target.value as Status }); toast(`"${x.title}" moved to ${STATUS_LABEL[e.target.value as Status]}`) }}>
                        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" disabled={project.archived} onClick={() => setDialog(x)} aria-label={`Edit ${x.title}`}>Edit</Button>
                      <Button size="sm" variant="ghost" disabled={project.archived} onClick={() => setDeleting(x)} aria-label={`Delete ${x.title}`}>Delete</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog && <TaskDialog projectId={project.id} task={dialog === 'create' ? undefined : dialog} onClose={() => setDialog(null)} />}
      {deleting && (
        <ConfirmDialog title="Delete task?" danger confirmLabel="Delete task" message={`"${deleting.title}" will be permanently deleted.`}
          onCancel={() => setDeleting(null)} onConfirm={() => { act.deleteTasks([deleting.id]); toast('Task deleted'); setDeleting(null) }} />
      )}
      {bulkConfirm && (
        <ConfirmDialog title={`Delete ${visibleSelected.length} tasks?`} danger confirmLabel={`Delete ${visibleSelected.length} tasks`} message="The selected tasks will be permanently deleted."
          onCancel={() => setBulkConfirm(false)} onConfirm={() => { act.deleteTasks(visibleSelected); toast(`${visibleSelected.length} tasks deleted`); setSelected([]); setBulkConfirm(false) }} />
      )}
      {savingFilter && (
        <Modal title="Save filter" onClose={() => setSavingFilter(false)}
          onSubmit={(e) => { e.preventDefault(); if (!filterName.trim()) return; act.addSavedFilter({ name: filterName.trim(), assignee, status }); toast(`Saved filter "${filterName.trim()}"`); setFilterName(''); setSavingFilter(false) }}
          footer={<><Button onClick={() => setSavingFilter(false)}>Cancel</Button><Button type="submit" variant="primary">Save filter</Button></>}>
          <TextField label="Filter name" value={filterName} autoFocus placeholder="e.g. My open tasks" onChange={(e) => setFilterName(e.target.value)} />
        </Modal>
      )}
    </div>
  )
}
