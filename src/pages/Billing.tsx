import { useState } from 'react'
import { t } from '../lib/copy'
import { act, useStore } from '../lib/store'
import type { PlanName } from '../lib/seed'
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageHeader, useToast } from '../components/ui'
import { downloadFile, money, formatShortDate } from '../lib/util'

const PLANS: { name: PlanName; price: number; blurb: string; features: string[] }[] = [
  { name: 'Free', price: 0, blurb: 'For trying things out.', features: ['3 projects', 'Up to 3 members', 'Community support'] },
  { name: 'Team', price: 12, blurb: 'For growing teams.', features: ['Unlimited projects', 'Integrations', 'Email support'] },
  { name: 'Business', price: 29, blurb: 'For larger organisations.', features: ['Everything in Team', 'Audit log', 'Priority support'] },
]

export default function Billing() {
  const { plan, invoices, members } = useStore()
  const toast = useToast()
  const [pending, setPending] = useState<PlanName | null>(null)
  const seats = members.length
  const current = PLANS.find((p) => p.name === plan)!
  const next = PLANS.find((p) => p.name === pending)

  return (
    <div>
      <PageHeader title={t('nav.billing')} subtitle="Your plan, seats and invoices." />
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Current plan</p>
          <p className="text-xl font-semibold">{current.name} <Badge tone="green">Active</Badge></p>
          <p className="mt-1 text-sm text-muted">{current.price === 0 ? 'Free forever.' : `${money(current.price)} per user / month · ${seats} seats · ${money(current.price * seats)} per month`}</p>
        </div>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Plans</h2>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className={p.name === plan ? 'ring-2 ring-brand' : ''}>
            <h3 className="text-base font-semibold">{p.name}</h3>
            <p className="text-sm text-muted">{p.blurb}</p>
            <p className="my-3 text-2xl font-bold">{money(p.price)}<span className="text-sm font-normal text-muted"> / user / month</span></p>
            <ul className="mb-4 space-y-1 text-sm text-muted">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
            {p.name === plan
              ? <Button disabled className="w-full">Current plan</Button>
              : <Button variant="primary" className="w-full" aria-label={`${t('billing.changePlan')} to ${p.name}`} onClick={() => setPending(p.name)}>{t('billing.changePlan')} to {p.name}</Button>}
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">{t('billing.invoices')}</h2>
      {invoices.length === 0 ? <EmptyState title="No invoices yet" body="Invoices appear here after your first payment." /> : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Download</span></th></tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{i.id}</td>
                  <td className="px-4 py-3">{formatShortDate(i.date)}</td>
                  <td className="px-4 py-3">{i.plan}</td>
                  <td className="px-4 py-3">{money(i.amount)}</td>
                  <td className="px-4 py-3"><Badge tone="green">{i.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" aria-label={`Download invoice ${i.id}`} onClick={() => {
                      downloadFile(`${i.id}.txt`, `Acme Tasks invoice ${i.id}\nDate: ${i.date}\nPlan: ${i.plan}\nAmount: ${money(i.amount)}\nStatus: ${i.status}\n(Demo invoice, not a real document.)\n`, 'text/plain')
                      toast(`Invoice ${i.id} downloaded`)
                    }}>Download</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {next && (
        <ConfirmDialog
          title={`Change to the ${next.name} plan?`}
          confirmLabel="Confirm change"
          message={next.price === 0
            ? 'You will move to the Free plan. Paid features such as integrations stop working at the end of this billing period.'
            : `You will be charged ${money(next.price * seats)} today (${seats} seats at ${money(next.price)} per user), then monthly.`}
          onCancel={() => setPending(null)}
          onConfirm={() => { act.setPlan(next.name, next.price === 0 ? null : next.price * seats); toast(`You're now on the ${next.name} plan`); setPending(null) }}
        />
      )}
    </div>
  )
}
