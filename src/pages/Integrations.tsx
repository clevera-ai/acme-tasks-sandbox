import { useState, type FormEvent } from 'react'
import flags from '../config/flags.json'
import { t } from '../lib/copy'
import { act, useStore } from '../lib/store'
import { Badge, Button, Card, Modal, PageHeader, SelectField, TextField, useToast } from '../components/ui'

type Kind = 'slack' | 'gcal'

function ConnectDialog({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const { profile } = useStore()
  const toast = useToast()
  const [workspace, setWorkspace] = useState('acme-co')
  const [channel, setChannel] = useState('#general')
  const [account, setAccount] = useState(profile.email)
  const [sync, setSync] = useState(true)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (kind === 'slack') { act.connectSlack(workspace.trim() || 'acme-co', channel); toast(`Slack connected to ${workspace.trim() || 'acme-co'}`) }
    else { act.connectGcal(account.trim() || profile.email, sync); toast('Google Calendar connected') }
    onClose()
  }
  const name = kind === 'slack' ? 'Slack' : 'Google Calendar'
  return (
    <Modal title={`Connect ${name}`} onClose={onClose} onSubmit={submit}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">Authorize {name}</Button></>}>
      <p className="text-sm text-muted">Acme Tasks will ask {name} for permission to {kind === 'slack' ? 'post task updates to a channel' : 'add task due dates to your calendar'}. This is a demo: nothing is sent anywhere.</p>
      {kind === 'slack' ? (<>
        <TextField label="Slack workspace" value={workspace} onChange={(e) => setWorkspace(e.target.value)} autoFocus />
        <SelectField label="Post updates to" value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option>#general</option><option>#engineering</option><option>#product</option>
        </SelectField>
      </>) : (<>
        <TextField label="Google account" type="email" value={account} onChange={(e) => setAccount(e.target.value)} autoFocus />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sync} onChange={(e) => setSync(e.target.checked)} /> Add task due dates to my calendar</label>
      </>)}
    </Modal>
  )
}

export default function Integrations() {
  const { integrations } = useStore()
  const toast = useToast()
  const [connecting, setConnecting] = useState<Kind | null>(null)
  const cards: { kind: Kind; name: string; blurb: string; mark: string; detail: string | null }[] = [
    ...(flags.hideSlack ? [] : [{
      kind: 'slack' as const, name: 'Slack', mark: 'S', blurb: 'Post task updates and due-date nudges to a Slack channel.',
      detail: integrations.slack ? `Workspace ${integrations.slack.workspace} · posting to ${integrations.slack.channel}` : null,
    }]),
    {
      kind: 'gcal', name: 'Google Calendar', mark: 'G', blurb: 'See task due dates on your Google Calendar.',
      detail: integrations.gcal ? `${integrations.gcal.account} · due-date sync ${integrations.gcal.sync ? 'on' : 'off'}` : null,
    },
  ]
  return (
    <div>
      <PageHeader title={t('nav.integrations')} subtitle="Connect Acme Tasks to the tools your team already uses." />
      <ul className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <li key={c.kind}>
            <Card className="flex h-full flex-col">
              <div className="flex items-start gap-3">
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl bg-soft text-lg font-bold text-brand">{c.mark}</span>
                <div className="flex-1">
                  <h2 className="flex items-center gap-2 text-base font-semibold">{c.name} {c.detail ? <Badge tone="green">Connected</Badge> : <Badge>Not connected</Badge>}</h2>
                  <p className="mt-1 text-sm text-muted">{c.blurb}</p>
                  {c.detail && <p className="mt-2 text-sm">{c.detail}</p>}
                </div>
              </div>
              <div className="mt-4">
                {c.detail
                  ? <Button aria-label={`Disconnect ${c.name}`} onClick={() => { act.disconnect(c.kind); toast(`${c.name} disconnected`) }}>Disconnect</Button>
                  : <Button variant="primary" aria-label={`${t('integrations.connect')} ${c.name}`} onClick={() => setConnecting(c.kind)}>{t('integrations.connect')} {c.name}</Button>}
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {connecting && <ConnectDialog kind={connecting} onClose={() => setConnecting(null)} />}
    </div>
  )
}
