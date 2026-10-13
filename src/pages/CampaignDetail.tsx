import { Button, Chip, Tabs } from '@heroui/react'
import { AlertTriangle, ArrowLeft, OctagonAlert } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CREATIVES, PRODUCTS } from '../data/catalogue'
import { CITIES, FORMATS, GOALS } from '../data/goals'
import { alertFor } from '../lib/alerts'
import { count, inr, percent } from '../lib/format'
import { dailySpend, performance, timeElapsed } from '../lib/simulate'
import type { Campaign } from '../lib/types'
import { PageHeader } from '../shell/Layout'
import { StatusChip } from '../shell/StatusChip'
import { AddBudgetMenu, Panel, SimulatedNote, Stat } from '../shell/ui'
import { useStore } from '../state/store'

const DAY = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const day = (date: string) => DAY.format(new Date(date))

export function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { campaigns, dispatch } = useStore()
  const campaign = campaigns.find((c) => c.id === id)

  if (!campaign) {
    return (
      <>
        <PageHeader title="Campaign not found" />
        <Link to="/campaigns" className="text-sm font-medium text-accent hover:underline">
          Back to campaigns
        </Link>
      </>
    )
  }

  const goal = GOALS[campaign.goal]
  const perf = performance(campaign)
  const alert = alertFor(campaign)
  const used = campaign.budget ? campaign.spent / campaign.budget : 0
  const elapsed = timeElapsed(campaign)
  const pacing = campaign.spent === 0 ? 'Not started' : used > elapsed + 0.15 ? 'Spending fast' : used < elapsed - 0.15 ? 'Spending slowly' : 'On track'
  const setStatus = (status: Campaign['status'], note: string) => dispatch({ type: 'set_status', ids: [campaign.id], status, note })

  return (
    <>
      <Link to="/campaigns" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Campaigns
      </Link>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{campaign.name}</h1>
            <StatusChip status={campaign.status} />
          </div>
          <p className="tabular mt-1 text-sm text-muted">
            {goal.name} · {day(campaign.startDate)} – {day(campaign.endDate)} · {inr(campaign.spent)} of {inr(campaign.budget)} spent ({percent(used)}) · {pacing}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {campaign.status === 'live' && (
            <Button size="sm" variant="secondary" onPress={() => setStatus('paused', 'Paused by you')}>
              Pause
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button size="sm" variant="secondary" onPress={() => setStatus('live', 'Resumed by you')}>
              Resume
            </Button>
          )}
          {['live', 'paused', 'out_of_budget'].includes(campaign.status) && <AddBudgetMenu campaign={campaign} />}
          {['live', 'paused', 'draft', 'rejected'].includes(campaign.status) && (
            <Button size="sm" variant="secondary" onPress={() => navigate(`/campaigns/${campaign.id}/edit`)}>
              Edit
            </Button>
          )}
          <Button size="sm" variant="secondary" onPress={() => navigate(`/campaigns/new?from=${campaign.id}`)}>
            Duplicate
          </Button>
        </div>
      </header>

      {alert && (
        <div
          role="alert"
          className={`mb-4 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm ${
            alert.severity === 'blocker' ? 'bg-danger-soft text-danger-soft-foreground' : 'bg-warning-soft text-warning-soft-foreground'
          }`}
        >
          {alert.severity === 'blocker' ? <OctagonAlert size={16} /> : <AlertTriangle size={16} />}
          <span className="flex-1">
            {alert.message}.{' '}
            {campaign.status === 'out_of_budget' && 'Ads have stopped showing. Add budget to resume straight away.'}
            {campaign.status === 'rejected' && 'Swap the creative for an approved one and resubmit.'}
            {campaign.status === 'live' && 'Their ads are still running and lead to an unavailable product.'}
          </span>
          {campaign.status === 'out_of_budget' ? (
            <AddBudgetMenu campaign={campaign} variant="primary" />
          ) : (
            <Button size="sm" variant="secondary" onPress={() => navigate(`/campaigns/${campaign.id}/edit?step=${campaign.status === 'rejected' ? 'bundle' : 'products'}`)}>
              {alert.action}
            </Button>
          )}
        </div>
      )}

      <Tabs defaultSelectedKey="performance">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Campaign sections">
            {['Performance', 'Bundle', 'Setup', 'Activity'].map((label) => (
              <Tabs.Tab key={label} id={label.toLowerCase()}>
                {label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="performance" className="flex flex-col gap-4 pt-4">
          {campaign.spent === 0 ? (
            <Panel>
              <p className="py-8 text-center text-sm text-muted">No results yet. Numbers appear once the campaign is live and spending.</p>
            </Panel>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4">
                <Stat label={goal.headlineMetric} value={count(perf.headline)} note={`Judged on ${goal.judgedOn.toLowerCase()}`} />
                <Stat label={`Cost per ${goal.id === 'awareness' ? '1,000 reached' : goal.id === 'new_customers' ? 'new customer' : 'returning customer'}`} value={perf.headline ? inr((perf.spend / perf.headline) * (goal.id === 'awareness' ? 1000 : 1)) : '—'} />
                <Stat label="Sales from ads" value={inr(perf.sales)} />
                <Stat label="Return on ad spend" value={`${perf.roas.toFixed(2)}×`} />
              </div>
              <div className="grid grid-cols-[1fr_22rem] gap-4">
                <Panel title="Daily spend">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailySpend(campaign)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--color-border)" />
                        <XAxis dataKey="date" tickFormatter={day} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} minTickGap={24} />
                        <YAxis tickFormatter={(v: number) => `₹${v / 1000}k`} tickLine={false} axisLine={false} width={48} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
                        <Tooltip
                          formatter={(value) => [inr(Number(value)), 'Spend']}
                          labelFormatter={(label) => day(String(label))}
                          contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: 13 }}
                        />
                        <Area isAnimationActive={false} type="monotone" dataKey="spend" stroke="var(--color-accent)" strokeWidth={2} fill="var(--color-accent)" fillOpacity={0.12} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
                <Panel title="Funnel">
                  <Funnel
                    steps={[
                      { label: 'Impressions', value: perf.impressions },
                      { label: 'Clicks', value: perf.clicks },
                      { label: 'Add to cart', value: perf.addToCarts },
                      { label: 'Orders', value: perf.orders },
                      ...(goal.id === 'awareness' ? [] : [{ label: goal.headlineMetric, value: perf.headline }]),
                    ]}
                  />
                </Panel>
              </div>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="bundle" className="pt-4">
          <Panel title="Formats in this bundle" hint="Fixed by the goal. Budget share is the one thing you control.">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Format</th>
                  <th className="px-3 py-2 text-right font-medium">Budget share</th>
                  <th className="px-3 py-2 text-right font-medium">Spend</th>
                  <th className="px-3 py-2 text-right font-medium">Impressions</th>
                  <th className="px-3 py-2 text-right font-medium">Clicks</th>
                  <th className="px-3 py-2 text-right font-medium">Click rate</th>
                  <th className="py-2 pl-3 text-right font-medium">Orders</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {perf.byFormat.map((row) => (
                  <tr key={row.format} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{FORMATS[row.format].name}</span>
                      <span className="block text-xs text-muted">{FORMATS[row.format].placement}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">{campaign.split[row.format] ?? 0}%</td>
                    <td className="px-3 py-2.5 text-right">{inr(row.spend)}</td>
                    <td className="px-3 py-2.5 text-right">{count(row.impressions)}</td>
                    <td className="px-3 py-2.5 text-right">{count(row.clicks)}</td>
                    <td className="px-3 py-2.5 text-right">{row.impressions ? percent(row.clicks / row.impressions, 1) : '—'}</td>
                    <td className="py-2.5 pl-3 text-right">{count(row.orders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </Tabs.Panel>

        <Tabs.Panel id="setup" className="pt-4">
          <Panel title="Setup">
            <dl className="grid grid-cols-[9rem_1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted">Audience</dt>
              <dd>{goal.audience}</dd>
              <dt className="text-muted">Cities</dt>
              <dd>{CITIES.filter((c) => campaign.cityIds.includes(c.id)).map((c) => c.name).join(', ')}</dd>
              <dt className="text-muted">Products</dt>
              <dd className="flex flex-wrap gap-1.5">
                {PRODUCTS.filter((p) => campaign.productIds.includes(p.id)).map((p) => (
                  <Chip key={p.id} size="sm" variant="soft" color={p.inStock ? 'default' : 'warning'}>
                    {p.name}
                    {!p.inStock && ' (out of stock)'}
                  </Chip>
                ))}
              </dd>
              {campaign.creativeId && (
                <>
                  <dt className="text-muted">Creative</dt>
                  <dd>{CREATIVES.find((c) => c.id === campaign.creativeId)?.name}</dd>
                </>
              )}
              <dt className="text-muted">Pacing</dt>
              <dd>{campaign.pacing === 'even' ? 'Even' : 'Front-loaded'}</dd>
              <dt className="text-muted">Never show for</dt>
              <dd>{campaign.negativeKeywords.join(', ') || 'Nothing excluded'}</dd>
            </dl>
          </Panel>
        </Tabs.Panel>

        <Tabs.Panel id="activity" className="pt-4">
          <Panel title="Activity">
            <ol className="flex flex-col gap-3 text-sm">
              {[...campaign.activity].reverse().map((entry, i) => (
                <li key={i} className="grid grid-cols-[5rem_1fr] gap-4">
                  <span className="tabular text-muted">{day(entry.date)}</span>
                  {entry.text}
                </li>
              ))}
            </ol>
          </Panel>
        </Tabs.Panel>
      </Tabs>
      <SimulatedNote />
    </>
  )
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = steps[0].value || 1
  return (
    <ol className="flex flex-col gap-3 text-sm">
      {steps.map((step, i) => (
        <li key={step.label}>
          <div className="mb-1 flex items-baseline justify-between">
            <span>{step.label}</span>
            <span className="tabular">
              <span className="font-medium">{count(step.value)}</span>
              {i > 0 && steps[i - 1].value > 0 && <span className="ml-2 text-xs text-muted">{percent(step.value / steps[i - 1].value, 1)} of previous</span>}
            </span>
          </div>
          {/* Square-root scale so the small late steps stay visible next to impressions. */}
          <div className="h-2 rounded-full bg-default">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(2, Math.sqrt(step.value / top) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  )
}
