import { Button, Chip, Tabs } from '@heroui/react'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FORMATS, GOAL_LIST, GOALS } from '../data/goals'
import { STATUS_LABEL } from '../lib/alerts'
import { count, inr } from '../lib/format'
import { performance, spendByDay } from '../lib/simulate'
import type { Creative, FormatId, GoalId } from '../lib/types'
import { PageHeader } from '../shell/Layout'
import { StatusChip } from '../shell/StatusChip'
import { AddBudgetMenu, BannerArt, GoalTag, Panel, SimulatedNote, Stat } from '../shell/ui'
import { useStore } from '../state/store'

const CREATIVE_STATUS: Record<Creative['status'], { label: string; color: 'success' | 'accent' | 'danger' }> = {
  approved: { label: 'Approved', color: 'success' },
  in_review: { label: 'In review', color: 'accent' },
  rejected: { label: 'Rejected', color: 'danger' },
}

export function Creatives() {
  const { creatives, campaigns, resubmitCreative } = useStore()
  const [filter, setFilter] = useState<'all' | Creative['status']>('all')
  const shown = creatives.filter((c) => filter === 'all' || c.status === filter)

  return (
    <>
      <PageHeader title="Creatives" subtitle="Banner images used by awareness campaigns. Each is reviewed once, then reusable." />
      <Tabs selectedKey={filter} onSelectionChange={(key) => setFilter(key as typeof filter)} className="mb-4">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Filter by review status">
            {(['all', 'approved', 'in_review', 'rejected'] as const).map((id) => (
              <Tabs.Tab key={id} id={id} className="whitespace-nowrap">
                {id === 'all' ? 'All' : CREATIVE_STATUS[id].label}
                <span className="tabular ml-1.5 text-xs text-muted">{creatives.filter((c) => id === 'all' || c.status === id).length}</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <ul className="grid grid-cols-3 gap-4">
        {shown.map((creative) => {
          const usedIn = campaigns.filter((c) => c.creativeId === creative.id)
          const status = CREATIVE_STATUS[creative.status]
          return (
            <li key={creative.id} className="flex flex-col rounded-2xl border border-border bg-surface p-4 text-sm shadow-card">
              <BannerArt name={creative.name} className="mb-3 h-28" />
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{creative.name}</span>
                <Chip size="sm" variant="soft" color={status.color} className="whitespace-nowrap">
                  {status.label}
                </Chip>
              </div>
              <p className="mt-1 text-muted">
                {usedIn.length ? `Used in ${usedIn.map((c) => c.name).join(', ')}` : 'Not used in any campaign'}
              </p>
              {creative.status === 'rejected' && (
                <div className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-danger-soft-foreground">
                  <p>Rejected: {creative.rejectionReason}.</p>
                  <Button size="sm" variant="secondary" className="mt-2" onPress={() => resubmitCreative(creative.id)}>
                    Mark as fixed and resubmit
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {shown.length === 0 && <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">No creatives with this status.</p>}
    </>
  )
}

const DAY = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const day = (date: string) => DAY.format(new Date(date))

export function Reports() {
  const { campaigns } = useStore()
  const [goalId, setGoalId] = useState<GoalId>('new_customers')
  const goal = GOALS[goalId]
  const rows = campaigns.filter((c) => c.goal === goalId && c.spent > 0).map((campaign) => ({ campaign, perf: performance(campaign) }))
  const unit = goalId === 'awareness' ? 1000 : 1
  const costLabel = goalId === 'awareness' ? 'Cost per 1,000 reached' : `Cost per ${goalId === 'new_customers' ? 'new customer' : goalId === 'win_back' ? 'returning customer' : 'order'}`

  const trend = spendByDay(rows.map((r) => r.campaign), 21)
  const formatTotals = new Map<FormatId, { format: FormatId; spend: number; orders: number }>()
  for (const { perf } of rows) {
    for (const row of perf.byFormat) {
      const total = formatTotals.get(row.format) ?? { format: row.format, spend: 0, orders: 0 }
      formatTotals.set(row.format, { format: row.format, spend: total.spend + row.spend, orders: total.orders + row.orders })
    }
  }
  const byFormat = [...formatTotals.values()].sort((a, b) => b.spend - a.spend)
  const maxFormatSpend = Math.max(1, ...byFormat.map((row) => row.spend))
  const costs = rows.filter((r) => r.perf.headline > 0).map((r) => ({ name: r.campaign.name, cost: (r.perf.spend / r.perf.headline) * unit }))
  const maxCost = Math.max(1, ...costs.map((row) => row.cost))
  const bestCost = Math.min(...costs.map((row) => row.cost))

  function exportCsv() {
    const header = ['Campaign', 'Status', 'Spend', 'Impressions', 'Clicks', 'Orders', goal.headlineMetric, costLabel, 'Sales', 'ROAS']
    const lines = rows.map(({ campaign, perf }) =>
      [campaign.name, STATUS_LABEL[campaign.status], perf.spend, perf.impressions, perf.clicks, perf.orders, perf.headline, perf.headline ? Math.round((perf.spend / perf.headline) * unit) : '', perf.sales, perf.roas.toFixed(2)].join(','),
    )
    const url = URL.createObjectURL(new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: `report-${goalId}.csv` })
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Each goal is reported on the metric it was sold on."
        actions={
          <Button variant="secondary" isDisabled={rows.length === 0} onPress={exportCsv}>
            <Download size={15} />
            Export CSV
          </Button>
        }
      />
      <Tabs selectedKey={goalId} onSelectionChange={(key) => setGoalId(key as GoalId)} className="mb-4">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Goal">
            {[...GOAL_LIST, GOALS.custom].map((g) => (
              <Tabs.Tab key={g.id} id={g.id} className="whitespace-nowrap">
                <GoalTag goal={g.id} />
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      {rows.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-4">
          <Panel title="Daily spend" hint="Last 21 days" className="col-span-1">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" tickFormatter={day} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} minTickGap={28} />
                  <YAxis tickFormatter={(v: number) => `₹${v / 1000}k`} tickLine={false} axisLine={false} width={44} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                  <Tooltip
                    formatter={(value) => [inr(Number(value)), 'Spend']}
                    labelFormatter={(label) => day(String(label))}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: 13 }}
                  />
                  <Area isAnimationActive={false} type="monotone" dataKey={goalId} stroke={`var(--goal-${goalId})`} strokeWidth={2} fill={`var(--goal-${goalId})`} fillOpacity={0.14} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Where the money went" hint="Spend and orders by ad format">
            <ul className="flex flex-col gap-3 text-sm">
              {byFormat.map((row) => (
                <li key={row.format}>
                  <div className="tabular mb-1 flex items-baseline justify-between">
                    <span className="font-medium">{FORMATS[row.format].name}</span>
                    <span className="text-muted">
                      {inr(row.spend)} · {count(row.orders)} orders
                    </span>
                  </div>
                  <span className="block h-2 overflow-hidden rounded-full bg-default">
                    <span className="bar-fill block h-full rounded-full" style={{ width: `${(row.spend / maxFormatSpend) * 100}%`, background: `var(--goal-${goalId})` }} />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={costLabel} hint="By campaign. Shorter is better.">
            <ul className="flex flex-col gap-3 text-sm">
              {costs.map((row) => (
                <li key={row.name}>
                  <div className="tabular mb-1 flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">{row.name}</span>
                    <span className={row.cost === bestCost ? 'font-medium text-success' : 'text-muted'}>
                      {inr(row.cost)}
                      {row.cost === bestCost && costs.length > 1 && ' · best'}
                    </span>
                  </div>
                  <span className="block h-2 overflow-hidden rounded-full bg-default">
                    <span className={`bar-fill block h-full rounded-full ${row.cost === bestCost ? 'bg-success' : 'bg-muted'}`} style={{ width: `${(row.cost / maxCost) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <Panel title={`${goal.name}: ${goal.judgedOn.toLowerCase()}`} hint="Orders are attributed to an ad for 7 days after a click.">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No {goal.name.toLowerCase()} campaign has spent yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Campaign</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Spend</th>
                <th className="px-3 py-2 text-right font-medium">Impressions</th>
                <th className="px-3 py-2 text-right font-medium">Clicks</th>
                <th className="px-3 py-2 text-right font-medium">{goal.headlineMetric}</th>
                <th className="px-3 py-2 text-right font-medium">{costLabel}</th>
                <th className="py-2 pl-3 text-right font-medium">Return on ad spend</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {rows.map(({ campaign, perf }) => (
                <tr key={campaign.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-3">
                    <Link to={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                      {campaign.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusChip status={campaign.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right">{inr(perf.spend)}</td>
                  <td className="px-3 py-2.5 text-right">{count(perf.impressions)}</td>
                  <td className="px-3 py-2.5 text-right">{count(perf.clicks)}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{count(perf.headline)}</td>
                  <td className="px-3 py-2.5 text-right">{perf.headline ? inr((perf.spend / perf.headline) * unit) : '—'}</td>
                  <td className="py-2.5 pl-3 text-right">{perf.roas.toFixed(2)}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <SimulatedNote />
    </>
  )
}

export function Budget() {
  const { campaigns, balance, available, committed } = useStore()
  const [showNote, setShowNote] = useState(false)
  const rows = campaigns.filter((c) => !['draft', 'ended', 'rejected'].includes(c.status))

  return (
    <>
      <PageHeader
        title="Budget"
        subtitle="One account balance, shared by every campaign."
        actions={
          <Button variant="secondary" onPress={() => setShowNote(true)}>
            Add funds
          </Button>
        }
      />
      {showNote && <p className="mb-4 rounded-xl bg-default px-4 py-2.5 text-sm">Payments aren't part of this demo. In the full product this opens the funding flow.</p>}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="Account balance" value={inr(balance)} />
        <Stat label="Committed to campaigns" value={inr(committed)} note="Budget that live, paused and in-review campaigns can still spend" />
        <Stat label="Available for new budget" value={inr(available)} />
      </div>
      <Panel title="Where the committed budget sits">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">Campaign</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Budget</th>
              <th className="px-3 py-2 text-right font-medium">Spent</th>
              <th className="px-3 py-2 text-right font-medium">Remaining</th>
              <th className="px-3 py-2 font-medium">Ends</th>
              <th className="py-2 pl-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map((campaign) => (
              <tr key={campaign.id} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-3">
                  <Link to={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                    {campaign.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <StatusChip status={campaign.status} />
                </td>
                <td className="px-3 py-2.5 text-right">{inr(campaign.budget)}</td>
                <td className="px-3 py-2.5 text-right">{inr(campaign.spent)}</td>
                <td className="px-3 py-2.5 text-right font-medium">{inr(Math.max(0, campaign.budget - campaign.spent))}</td>
                <td className="px-3 py-2.5 text-muted">{campaign.endDate}</td>
                <td className="py-2.5 pl-3 text-right">{campaign.status !== 'in_review' && <AddBudgetMenu campaign={campaign} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  )
}
