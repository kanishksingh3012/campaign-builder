import { Button } from '@heroui/react'
import { AlertTriangle, Check, GraduationCap, OctagonAlert, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bar as RechartsBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BRAND } from '../data/catalogue'
import { GOALS } from '../data/goals'
import { alertFor } from '../lib/alerts'
import { count, inr, percent } from '../lib/format'
import { performance, spendByDay, timeElapsed, totals } from '../lib/simulate'
import type { GoalId } from '../lib/types'
import { PageHeader } from '../shell/Layout'
import { StatusChip } from '../shell/StatusChip'
import { AddBudgetMenu, Bar, GoalTag, Panel, SimulatedNote } from '../shell/ui'
import { useStore } from '../state/store'

const GOAL_ORDER: GoalId[] = ['awareness', 'new_customers', 'win_back', 'custom']
const DAY = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const day = (date: string) => DAY.format(new Date(date))

const BANNER_KEY = 'endcap:learn-banner-dismissed'

/** A one-line way in for someone who has just arrived. Stays dismissed, even after a demo reset. */
function LearnBanner() {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(BANNER_KEY) === '1'
    } catch {
      return false
    }
  })
  if (hidden) return null
  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(BANNER_KEY, '1')
    } catch {
      // Storage can be unavailable; the banner simply returns next visit.
    }
  }
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
      <GraduationCap size={18} className="shrink-0" />
      <p className="flex-1">
        <span className="font-medium">New to retail ads?</span> This is a practice playground with a fictional brand and simulated numbers. Three short exercises show how goals, budgets and the ad
        auction work.
      </p>
      <Link to="/learn" className="shrink-0 font-medium underline-offset-2 hover:underline">
        Start learning
      </Link>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-lg p-1 hover:bg-surface/50">
        <X size={15} />
      </button>
    </div>
  )
}

export function Overview() {
  const navigate = useNavigate()
  const { campaigns, available, committed } = useStore()
  const sum = totals(campaigns)
  const alerts = campaigns.flatMap((campaign) => {
    const alert = alertFor(campaign)
    return alert ? [{ campaign, alert }] : []
  })
  const active = campaigns.filter((c) => ['live', 'paused', 'in_review', 'out_of_budget'].includes(c.status))

  if (campaigns.length === 0) {
    return (
      <>
        <PageHeader title={`Welcome, ${BRAND}`} subtitle="You have no campaigns yet. Here is how the first one works." />
        <Panel>
          <ol className="grid grid-cols-3 gap-6 text-sm">
            {[
              ['Pick a goal', 'Awareness, new customers or win back. The goal decides everything else.'],
              ['Get a bundle', 'We choose the ad formats, audience and keywords that fit the goal. You choose products and cities.'],
              ['Set a budget', `You have ${inr(available)} available. Each goal has a minimum so it can deliver enough to judge.`],
            ].map(([title, text], i) => (
              <li key={title}>
                <span className="tabular mb-2 grid size-7 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-foreground">{i + 1}</span>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-muted">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-center gap-4">
            <Button variant="primary" onPress={() => navigate('/campaigns/new')}>
              <Plus size={16} />
              Create your first campaign
            </Button>
            <Link to="/preview" className="text-sm font-medium text-accent hover:underline">
              See where ads appear to shoppers
            </Link>
          </div>
        </Panel>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Overview" subtitle={`${BRAND} · last 14 days of spend, all campaigns to date`} />
      <LearnBanner />

      <Panel className="mb-4">
        <div className="grid grid-cols-[1fr_17rem] gap-8">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Daily spend by goal</h2>
              <ul className="flex gap-3 text-xs">
                {GOAL_ORDER.map((goal) => (
                  <li key={goal} className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-full" style={{ background: `var(--goal-${goal})` }} />
                    {GOALS[goal].name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendByDay(campaigns)} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" tickFormatter={day} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} minTickGap={20} />
                  <YAxis tickFormatter={(v: number) => `₹${v / 1000}k`} tickLine={false} axisLine={false} width={48} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--color-default)' }}
                    formatter={(value, name) => [inr(Number(value)), GOALS[name as GoalId].name]}
                    labelFormatter={(label) => day(String(label))}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: 13 }}
                  />
                  {GOAL_ORDER.map((goal, i) => (
                    <RechartsBar isAnimationActive={false} key={goal} dataKey={goal} stackId="spend" fill={`var(--goal-${goal})`} radius={i === GOAL_ORDER.length - 1 ? [4, 4, 0, 0] : 0} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <dl className="tabular flex flex-col justify-between border-l border-border pl-8">
            {[
              ['Spend', inr(sum.spend), `${inr(committed)} still committed`],
              ['Sales from ads', inr(sum.sales), `${count(sum.orders)} orders`],
              ['Return on ad spend', `${sum.roas.toFixed(2)}×`, 'Sales ÷ spend'],
              ['New customers', count(sum.newCustomers), 'From new-customer campaigns'],
            ].map(([label, value, note]) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-muted">
                  {label}
                  <span className="block text-xs">{note}</span>
                </dt>
                <dd className="text-lg font-semibold tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Panel>

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
                        <span className="mt-1 block">
                          <GoalTag goal={campaign.goal} />
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusChip status={campaign.status} />
                      </td>
                      <td className="tabular px-3 py-2.5 text-right">
                        {campaign.spent ? count(performance(campaign).headline) : '—'}
                        <span className="block text-xs text-muted">{goal.headlineMetric.toLowerCase()}</span>
                      </td>
                      <td className="py-2.5 pl-3">
                        <Bar value={used * 100} tone={campaign.status === 'out_of_budget' ? 'danger' : 'accent'} />
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
