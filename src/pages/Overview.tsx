import { Button, ProgressBar } from '@heroui/react'
import { AlertTriangle, Check, OctagonAlert, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { BRAND } from '../data/catalogue'
import { GOALS } from '../data/goals'
import { alertFor } from '../lib/alerts'
import { count, inr, percent } from '../lib/format'
import { performance, timeElapsed, totals } from '../lib/simulate'
import { PageHeader } from '../shell/Layout'
import { StatusChip } from '../shell/StatusChip'
import { AddBudgetMenu, Panel, SimulatedNote, Stat } from '../shell/ui'
import { useStore } from '../state/store'

export function Overview() {
  const navigate = useNavigate()
  const { campaigns, available, committed } = useStore()
  const sum = totals(campaigns)
  const alerts = campaigns.flatMap((campaign) => {
    const alert = alertFor(campaign)
    return alert ? [{ campaign, alert }] : []
  })
  const active = campaigns.filter((c) => ['live', 'paused', 'in_review', 'out_of_budget'].includes(c.status))

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`${BRAND} · all campaigns to date`}
        actions={
          <Button variant="primary" onPress={() => navigate('/campaigns/new')}>
            <Plus size={16} />
            Create campaign
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-4">
        <Stat label="Spend" value={inr(sum.spend)} note={`${inr(committed)} still committed`} />
        <Stat label="Sales from ads" value={inr(sum.sales)} note={`${count(sum.orders)} orders`} />
        <Stat label="Return on ad spend" value={`${sum.roas.toFixed(2)}×`} />
        <Stat label="New customers" value={count(sum.newCustomers)} note="From new-customer campaigns" />
      </div>

      <div className="grid grid-cols-[1fr_20rem] items-start gap-4">
        <div className="flex flex-col gap-4">
          <Panel title={`Needs attention${alerts.length ? ` (${alerts.length})` : ''}`} hint="Each item has the next step beside it.">
            {alerts.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <Check size={16} /> Nothing needs you right now.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {alerts.map(({ campaign, alert }) => (
                  <li key={campaign.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    {alert.severity === 'blocker' ? (
                      <OctagonAlert size={16} className="shrink-0 text-danger" />
                    ) : (
                      <AlertTriangle size={16} className="shrink-0 text-warning" />
                    )}
                    <span className="min-w-0 flex-1">
                      <Link to={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                        {campaign.name}
                      </Link>
                      <span className="block text-muted">{alert.message}</span>
                    </span>
                    {campaign.status === 'out_of_budget' ? (
                      <AddBudgetMenu campaign={campaign} />
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => navigate(`/campaigns/${campaign.id}/edit?step=${campaign.status === 'rejected' ? 'bundle' : 'products'}`)}
                      >
                        {alert.action}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Active campaigns"
            aside={
              <Link to="/campaigns" className="text-sm font-medium text-accent hover:underline">
                View all
              </Link>
            }
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Campaign</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Headline result</th>
                  <th className="w-48 py-2 pl-3 font-medium">Budget vs time</th>
                </tr>
              </thead>
              <tbody>
                {active.map((campaign) => {
                  const goal = GOALS[campaign.goal]
                  const used = campaign.budget ? campaign.spent / campaign.budget : 0
                  return (
                    <tr key={campaign.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link to={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                          {campaign.name}
                        </Link>
                        <span className="block text-xs text-muted">{goal.name}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusChip status={campaign.status} />
                      </td>
                      <td className="tabular px-3 py-2.5 text-right">
                        {campaign.spent ? count(performance(campaign).headline) : '—'}
                        <span className="block text-xs text-muted">{goal.headlineMetric.toLowerCase()}</span>
                      </td>
                      <td className="py-2.5 pl-3">
                        <ProgressBar aria-label={`${campaign.name} budget used`} value={used * 100} size="sm" color={campaign.status === 'out_of_budget' ? 'danger' : 'accent'}>
                          <ProgressBar.Track>
                            <ProgressBar.Fill />
                          </ProgressBar.Track>
                        </ProgressBar>
                        <p className="tabular mt-1 text-xs text-muted">
                          {percent(used)} of budget · {percent(timeElapsed(campaign))} of time
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Panel>
        </div>

        <Panel title="Balance">
          <dl className="tabular grid grid-cols-[1fr_auto] gap-y-2 text-sm">
            <dt className="text-muted">Available</dt>
            <dd className="text-right text-base font-semibold">{inr(available)}</dd>
            <dt className="text-muted">Committed to campaigns</dt>
            <dd className="text-right">{inr(committed)}</dd>
          </dl>
          <p className="mt-4 text-sm text-muted">
            Not sure what an ad costs the shopper?{' '}
            <Link to="/preview" className="font-medium text-accent hover:underline">
              Open the shopper preview
            </Link>
          </p>
        </Panel>
      </div>
      <SimulatedNote />
    </>
  )
}
