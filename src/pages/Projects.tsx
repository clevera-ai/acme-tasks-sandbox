import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import flags from '../config/flags.json'
import { t } from '../lib/copy'
import { act, useStore } from '../lib/store'
import type { Project } from '../lib/seed'
import { Button, Card, ColorPicker, EmptyState, Modal, PageHeader, TextArea, TextField, cx, useToast } from '../components/ui'
import { PROJECT_COLORS, downloadFile, toCsv } from '../lib/util'

function ProjectDialog({ project, onClose }: { project?: Project; onClose: () => void }) {
  const toast = useToast()
  const [name, setName] = useState(project?.name ?? '')
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0].value)
  const [description, setDescription] = useState(project?.description ?? '')
  const [error, setError] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Give the project a name.')
    if (project) {
      act.editProject(project.id, { name: name.trim(), ...(flags.projectDescription ? { description } : {}) })
      toast(`Project renamed to "${name.trim()}"`)
    } else {
      act.addProject(name.trim(), color, flags.projectDescription ? description : '')
      toast(`Project "${name.trim()}" created`)
    }
    onClose()
  }
  return (
    <Modal
      title={project ? 'Rename project' : t('projects.create')} onClose={onClose} onSubmit={submit}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{project ? 'Save name' : t('projects.create')}</Button></>}
    >
      <TextField label="Project name" value={name} autoFocus placeholder="e.g. Q1 Planning" error={error}
        onChange={(e) => { setName(e.target.value); setError('') }} />
      {!project && <ColorPicker value={color} onChange={setColor} />}
      {flags.projectDescription && <TextArea label="Description" value={description} placeholder="What is this project about?" onChange={(e) => setDescription(e.target.value)} />}
    </Modal>
  )
}

export default function Projects() {
  const { projects, tasks } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [dialog, setDialog] = useState<null | 'create' | Project>(null)
  const shown = projects.filter((p) => p.archived === (tab === 'archived'))
  const activeCount = projects.filter((p) => !p.archived).length
  const archivedCount = projects.length - activeCount

  const exportCsv = () => {
    const rows: (string | number)[][] = [['Name', 'Colour', 'Status', 'Tasks', 'Done', 'Created']]
    for (const p of projects) {
      const pt = tasks.filter((x) => x.projectId === p.id)
      const colour = PROJECT_COLORS.find((c) => c.value === p.color)?.name ?? p.color
      rows.push([p.name, colour, p.archived ? 'Archived' : 'Active', pt.length, pt.filter((x) => x.status === 'done').length, p.createdAt])
    }
    downloadFile('acme-tasks-projects.csv', toCsv(rows), 'text/csv;charset=utf-8')
    toast(`Exported ${projects.length} projects to acme-tasks-projects.csv`)
  }

  return (
    <div>
      <PageHeader
        title={t('projects.heading')}
        subtitle="Everything your team is working on, in one place."
        actions={<>
          {flags.exportCsv && <Button onClick={exportCsv}>{t('projects.exportCsv')}</Button>}
          <Button variant="primary" onClick={() => setDialog('create')}>{t('projects.create')}</Button>
        </>}
      />
      <div role="tablist" aria-label="Project status" className="mb-4 inline-flex rounded-ui border border-line bg-surface p-1">
        {([['active', `Active (${activeCount})`], ['archived', `Archived (${archivedCount})`]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cx('rounded-lg px-3 py-1.5 text-sm font-medium', tab === k ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>{label}</button>
        ))}
      </div>
      {shown.length === 0 ? (
        tab === 'active'
          ? <EmptyState title="No projects yet" body="Projects keep related tasks together. Create your first one to get started." action={<Button variant="primary" onClick={() => setDialog('create')}>{t('projects.create')}</Button>} />
          : <EmptyState title="No archived projects" body="Projects you archive show up here. You can unarchive them any time." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const pt = tasks.filter((x) => x.projectId === p.id)
            const done = pt.filter((x) => x.status === 'done').length
            return (
              <li key={p.id}>
                <Card className="flex h-full flex-col">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: p.color }} aria-hidden />
                    <h2 className="truncate text-base font-semibold"><Link to={`/projects/${p.id}`} className="hover:underline">{p.name}</Link></h2>
                  </div>
                  {flags.projectDescription && p.description && <p className="mt-2 text-sm text-muted">{p.description}</p>}
                  <p className="mt-2 text-sm text-muted">{pt.length} tasks · {done} done</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full" style={{ width: pt.length ? `${(done / pt.length) * 100}%` : 0, background: p.color }} /></div>
                  <div className="mt-4 flex flex-wrap gap-2 pt-1">
                    <Link to={`/projects/${p.id}`} className="inline-flex items-center rounded-ui border border-line bg-surface px-2.5 py-1 text-sm font-medium hover:bg-soft">Open</Link>
                    <Button size="sm" onClick={() => setDialog(p)}>Rename</Button>
                    <Button size="sm" onClick={() => { act.editProject(p.id, { archived: !p.archived }); toast(p.archived ? `"${p.name}" restored to Active` : `"${p.name}" archived`) }}>
                      {p.archived ? 'Unarchive' : 'Archive'}
                    </Button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
      {dialog && <ProjectDialog project={dialog === 'create' ? undefined : dialog} onClose={() => setDialog(null)} />}
    </div>
  )
}
