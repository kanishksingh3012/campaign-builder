import { Button, Checkbox, Chip, Input, Slider } from '@heroui/react'
import { Check, Lock, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { AUTO_KEYWORDS, BRAND, PRODUCTS } from '../data/catalogue'
import { CITIES, FORMATS, GOAL_LIST, GOALS } from '../data/goals'
import { audienceSize, estimate } from '../lib/estimate'
import { count, daysBetween, inr, range } from '../lib/format'
import type { Creative, Draft, GoalId, Issue, WizardStep } from '../lib/types'
import { recommendedSplit, splitTotal } from '../lib/validate'
import { IssueList } from './IssueNote'

export interface StepProps {
  draft: Draft
  issues: Issue[]
  update: (apply: (draft: Draft) => Draft) => void
}

const forField = (issues: Issue[], prefix: string) => issues.filter((i) => i.field === prefix || i.field.startsWith(`${prefix}:`))

function Section({ title, hint, aside, children }: { title: string; hint?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

const LockedTag = () => (
  <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
    <Lock size={12} /> Set by goal
  </span>
)

/** Picking a goal fills in sensible defaults, so the later steps start valid. */
export function chooseGoal(draft: Draft, goalId: GoalId, creatives: Creative[]): Draft {
  const goal = GOALS[goalId]
  const needsCreative = goal.bundle.some((item) => FORMATS[item.format].needsCreative)
  return {
    ...draft,
    goal: goalId,
    split: recommendedSplit(goalId),
    budget: Math.max(draft.budget, goal.minBudget),
    creativeId: needsCreative ? (draft.creativeId ?? creatives.find((c) => c.status === 'approved')?.id) : undefined,
  }
}

export function GoalStep({ draft, update, creatives }: StepProps & { creatives: Creative[] }) {
  const [showCustomNote, setShowCustomNote] = useState(false)
  return (
    <Section title="What do you want this campaign to do?" hint="Your goal decides the ad formats, the audience and how results are judged.">
      <div role="radiogroup" aria-label="Campaign goal" className="grid grid-cols-3 gap-3">
        {GOAL_LIST.map((goal) => {
          const selected = draft.goal === goal.id
          return (
            <button
              key={goal.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => update((d) => chooseGoal(d, goal.id, creatives))}
              className={`flex flex-col rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                selected ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-secondary'
              }`}
            >
              <span className="flex items-center justify-between text-sm font-semibold">
                {goal.name}
                {selected && <Check size={16} className="text-accent" />}
              </span>
              <span className="mt-1 text-sm text-muted">{goal.promise}</span>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted">Judged on</dt>
                <dd>{goal.judgedOn}</dd>
                <dt className="text-muted">Formats</dt>
                <dd>{goal.bundle.map((item) => FORMATS[item.format].name).join(', ')}</dd>
                <dt className="text-muted">Minimum</dt>
                <dd className="tabular">{inr(goal.minBudget)}</dd>
              </dl>
            </button>
          )
        })}
      </div>
      <div className="mt-4 text-sm text-muted">
        Want to pick formats and bids yourself?{' '}
        <button type="button" className="font-medium text-accent hover:underline" onClick={() => setShowCustomNote(true)}>
          Build a custom campaign
        </button>
        {showCustomNote && (
          <p className="mt-2 rounded-xl bg-default px-3 py-2">
            Custom campaigns aren't part of this demo. In the full product this opens a format-first builder for advertisers who want manual control.
          </p>
        )}
      </div>
    </Section>
  )
}

export function BundleStep({ draft, issues, update, creatives }: StepProps & { creatives: Creative[] }) {
  const goal = GOALS[draft.goal!]
  const [keyword, setKeyword] = useState('')
  const [showAllKeywords, setShowAllKeywords] = useState(false)
  const needsCreative = goal.bundle.some((item) => FORMATS[item.format].needsCreative)
  const usesKeywords = goal.bundle.some((item) => item.format === 'search_ads' || item.format === 'search_banner')
  const keywords = showAllKeywords ? AUTO_KEYWORDS : AUTO_KEYWORDS.slice(0, 6)

  function addNegative() {
    const value = keyword.trim().toLowerCase()
    if (value) update((d) => ({ ...d, negativeKeywords: [...new Set([...d.negativeKeywords, value])] }))
    setKeyword('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title={`Your bundle for ${goal.name.toLowerCase()}`} hint="These formats work together for this goal, so they come as a set." aside={<LockedTag />}>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {goal.bundle.map((item) => {
            const format = FORMATS[item.format]
            return (
              <li key={item.format} className="grid grid-cols-[11rem_1fr_auto] items-start gap-4 px-4 py-3 text-sm">
                <span className="font-medium">{format.name}</span>
                <span>
                  {format.placement}
                  <span className="mt-0.5 block text-muted">Why: {item.reason}</span>
                </span>
                <Chip size="sm" variant="soft" className="whitespace-nowrap">
                  Pay per {format.pricing === 'CPC' ? 'click' : '1,000 views'}
                </Chip>
              </li>
            )
          })}
        </ul>
      </Section>

      {needsCreative && (
        <Section title="Banner creative" hint="Banner formats in this bundle need one approved creative.">
          <div className="grid grid-cols-3 gap-3">
            {creatives.map((creative) => {
              const selected = draft.creativeId === creative.id
              return (
                <button
                  key={creative.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update((d) => ({ ...d, creativeId: creative.id }))}
                  className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                    selected ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-secondary'
                  }`}
                >
                  <span className="mb-2 block h-14 rounded-lg bg-default" aria-hidden />
                  <span className="block font-medium">{creative.name}</span>
                  <span className={`text-xs ${creative.status === 'rejected' ? 'text-danger' : 'text-muted'}`}>
                    {creative.status === 'approved' ? 'Approved' : creative.status === 'in_review' ? 'In review' : 'Rejected'}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-3">
            <IssueList issues={forField(issues, 'creative')} onFix={update} />
          </div>
        </Section>
      )}

      {usesKeywords && (
        <Section title="Keywords" hint={`Chosen automatically from what shoppers search in ${BRAND}'s category.`} aside={<LockedTag />}>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((word) => (
              <Chip key={word} size="sm" variant="secondary">
                {word}
              </Chip>
            ))}
            {!showAllKeywords && (
              <button type="button" className="text-sm font-medium text-accent hover:underline" onClick={() => setShowAllKeywords(true)}>
                +{AUTO_KEYWORDS.length - keywords.length} more
              </button>
            )}
          </div>
          <label htmlFor="negative-keyword" className="mt-4 block text-sm font-medium">
            Never show for
          </label>
          <p className="text-sm text-muted">The one control you keep: searches you don't want your ads on.</p>
          <div className="mt-2 flex gap-2">
            <Input
              id="negative-keyword"
              value={keyword}
              placeholder="e.g. free, cheap"
              className="w-64"
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNegative()}
            />
            <Button variant="secondary" onPress={addNegative}>
              Add
            </Button>
          </div>
          {draft.negativeKeywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {draft.negativeKeywords.map((word) => (
                <Chip key={word} size="sm" variant="soft" color="danger">
                  {word}
                  <button
                    type="button"
                    aria-label={`Remove ${word}`}
                    onClick={() => update((d) => ({ ...d, negativeKeywords: d.negativeKeywords.filter((w) => w !== word) }))}
                  >
                    <X size={12} />
                  </button>
                </Chip>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}

export function ProductsStep({ draft, issues, update }: StepProps) {
  const goal = GOALS[draft.goal!]
  const size = audienceSize(draft)
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  return (
    <div className="grid grid-cols-[1fr_20rem] items-start gap-4">
      <Section title="Products to promote" hint={`${draft.productIds.length} of ${PRODUCTS.length} selected`}>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {PRODUCTS.map((product) => {
            const selected = draft.productIds.includes(product.id)
            const kept = draft.pausedProductIds.includes(product.id)
            return (
              <li key={product.id} className="px-4 py-2.5">
                <Checkbox
                  isSelected={selected}
                  onChange={() =>
                    update((d) => ({
                      ...d,
                      productIds: toggle(d.productIds, product.id),
                      pausedProductIds: d.pausedProductIds.filter((id) => id !== product.id),
                    }))
                  }
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <span className="flex w-full items-center gap-3 text-sm">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-muted">{product.size}</span>
                      <span className="tabular text-muted">{inr(product.price)}</span>
                      {!product.inStock && (
                        <Chip size="sm" variant="soft" color="warning">
                          {selected && kept ? 'Paused until restocked' : 'Out of stock'}
                        </Chip>
                      )}
                    </span>
                  </Checkbox.Content>
                </Checkbox>
                <div className="mt-2 empty:hidden">
                  <IssueList issues={forField(issues, `product:${product.id}`)} onFix={update} />
                </div>
              </li>
            )
          })}
        </ul>
        <div className="mt-3 empty:hidden">
          <IssueList issues={forField(issues, 'products')} onFix={update} />
        </div>
      </Section>

      <Section title="Audience" aside={<LockedTag />}>
        <p className="text-sm">{goal.audience}</p>
        <p className="mt-3 text-xs text-muted">Estimated size (simulated)</p>
        <p className="tabular text-lg font-semibold">{size ? range(size * 0.92, size * 1.08) : '—'}</p>
        <p className="mt-4 text-sm font-medium">Cities</p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Cities">
          {CITIES.map((city) => {
            const on = draft.cityIds.includes(city.id)
            return (
              <button
                key={city.id}
                type="button"
                aria-pressed={on}
                onClick={() => update((d) => ({ ...d, cityIds: toggle(d.cityIds, city.id) }))}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  on ? 'border-accent bg-accent-soft text-accent-soft-foreground' : 'border-border text-muted hover:bg-surface-secondary'
                }`}
              >
                {city.name}
              </button>
            )
          })}
        </div>
        <div className="mt-3 empty:hidden">
          <IssueList issues={forField(issues, 'cities')} onFix={update} />
        </div>
      </Section>
    </div>
  )
}

export function BudgetStep({ draft, issues, update, available }: StepProps & { available: number }) {
  const goal = GOALS[draft.goal!]
  const total = splitTotal(draft)
  const forecast = estimate(draft)
  const days = draft.startDate && draft.endDate && draft.endDate >= draft.startDate ? daysBetween(draft.startDate, draft.endDate) : 0

  return (
    <div className="flex flex-col gap-4">
      <Section title="Total budget" hint={`Minimum for ${goal.name.toLowerCase()} is ${inr(goal.minBudget)}. You have ${inr(available)} available.`}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">₹</span>
          <Input
            aria-label="Total budget in rupees"
            inputMode="numeric"
            className="tabular w-48"
            value={draft.budget ? draft.budget.toLocaleString('en-IN') : ''}
            onChange={(e) => {
              const value = Number(e.target.value.replace(/\D/g, ''))
              update((d) => ({ ...d, budget: value }))
            }}
          />
          {days > 0 && draft.budget > 0 && <span className="tabular text-sm text-muted">about {inr(draft.budget / days)} a day</span>}
        </div>
        <div className="mt-3 empty:hidden">
          <IssueList issues={forField(issues, 'budget')} onFix={update} />
        </div>
      </Section>

      <Section
        title="Split across formats"
        hint="Move budget between the formats in your bundle."
        aside={
          <span className={`tabular text-sm font-medium ${total === 100 ? 'text-muted' : 'text-danger'}`}>
            {total === 100 ? '100% assigned' : total < 100 ? `${100 - total}% unassigned` : `${total - 100}% over`}
          </span>
        }
      >
        <div className="flex flex-col gap-4">
          {goal.bundle.map((item) => {
            const share = draft.split[item.format] ?? 0
            return (
              <div key={item.format}>
                <div className="grid grid-cols-[10rem_1fr_3.5rem_6.5rem] items-center gap-4 text-sm">
                  <span className="font-medium">{FORMATS[item.format].name}</span>
                  <Slider
                    aria-label={`${FORMATS[item.format].name} share`}
                    value={share}
                    minValue={0}
                    maxValue={100}
                    step={5}
                    onChange={(value) => update((d) => ({ ...d, split: { ...d.split, [item.format]: value as number } }))}
                  >
                    <Slider.Track>
                      <Slider.Fill />
                      <Slider.Thumb />
                    </Slider.Track>
                  </Slider>
                  <span className="tabular text-right">{share}%</span>
                  <span className="tabular text-right text-muted">{inr((draft.budget * share) / 100)}</span>
                </div>
                <div className="mt-2 empty:hidden">
                  <IssueList issues={forField(issues, `split:${item.format}`)} onFix={update} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <IssueList issues={issues.filter((i) => i.field === 'split')} onFix={update} />
          {total === 100 && (
            <Button size="sm" variant="ghost" className="self-start" onPress={() => update((d) => ({ ...d, split: recommendedSplit(goal.id) }))}>
              Use recommended split ({goal.bundle.map((item) => item.share).join(' / ')})
            </Button>
          )}
        </div>
      </Section>

      <Section title="Schedule" hint={days > 0 ? `${days} days` : undefined}>
        <div className="flex flex-wrap items-end gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Starts</span>
            <Input type="date" value={draft.startDate} onChange={(e) => update((d) => ({ ...d, startDate: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Ends</span>
            <Input type="date" value={draft.endDate} onChange={(e) => update((d) => ({ ...d, endDate: e.target.value }))} />
          </label>
          <div role="radiogroup" aria-label="Pacing" className="flex flex-col gap-1">
            <span className="font-medium">Daily pacing</span>
            <span className="flex rounded-xl border border-border p-0.5">
              {(['even', 'front_loaded'] as const).map((pacing) => (
                <button
                  key={pacing}
                  type="button"
                  role="radio"
                  aria-checked={draft.pacing === pacing}
                  onClick={() => update((d) => ({ ...d, pacing }))}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${draft.pacing === pacing ? 'bg-accent-soft font-medium text-accent-soft-foreground' : 'text-muted'}`}
                >
                  {pacing === 'even' ? 'Even' : 'Front-loaded'}
                </button>
              ))}
            </span>
          </div>
        </div>
        <div className="mt-3 empty:hidden">
          <IssueList issues={forField(issues, 'schedule')} onFix={update} />
        </div>
      </Section>

      {forecast && total === 100 && (
        <Section title="Estimated results" hint="Simulated. Ranges, not promises.">
          <dl className="grid grid-cols-4 gap-4 text-sm">
            <Stat label="Impressions" value={range(...forecast.impressions)} />
            <Stat label="Clicks" value={range(...forecast.clicks)} />
            <Stat label={goal.id === 'awareness' ? 'Orders' : goal.headlineMetric} value={range(...forecast.orders)} />
            <Stat label="Audience reached" value={`${Math.round(forecast.coverage * 100)}%`} />
          </dl>
        </Section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tabular mt-0.5 text-base font-semibold">{value}</dd>
    </div>
  )
}

export function ReviewStep({
  draft,
  issues,
  update,
  goTo,
  acknowledged,
  setAcknowledged,
}: StepProps & { goTo: (step: WizardStep) => void; acknowledged: boolean; setAcknowledged: (value: boolean) => void }) {
  const goal = GOALS[draft.goal!]
  const forecast = estimate(draft)
  const days = draft.endDate >= draft.startDate ? daysBetween(draft.startDate, draft.endDate) : 0
  const size = audienceSize(draft)
  const cities = CITIES.filter((c) => draft.cityIds.includes(c.id)).map((c) => c.name)
  const rows: { label: string; value: string; step: WizardStep }[] = [
    { label: 'Goal', value: `${goal.name}, judged on ${goal.judgedOn.toLowerCase()}`, step: 'goal' },
    { label: 'Bundle', value: goal.bundle.map((item) => `${FORMATS[item.format].name} ${draft.split[item.format] ?? 0}%`).join(' · '), step: 'bundle' },
    { label: 'Products', value: PRODUCTS.filter((p) => draft.productIds.includes(p.id)).map((p) => p.name).join(', ') || 'None', step: 'products' },
    { label: 'Audience', value: `${goal.audience} in ${cities.join(', ') || 'no cities'}`, step: 'products' },
    { label: 'Budget', value: `${inr(draft.budget)}, ${draft.pacing === 'even' ? 'spent evenly' : 'front-loaded'}`, step: 'budget' },
    { label: 'Schedule', value: `${draft.startDate} to ${draft.endDate} (${days} days)`, step: 'budget' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Section title="Review and submit">
        <p className="text-base">
          You'll spend <strong className="tabular font-semibold">{inr(draft.budget)}</strong> over{' '}
          <strong className="font-semibold">{days} days</strong> to reach about{' '}
          <strong className="font-semibold">{count(size * (forecast?.coverage ?? 0))}</strong> of the{' '}
          {goal.audience.charAt(0).toLowerCase() + goal.audience.slice(1)}.
        </p>
        <dl className="mt-4 divide-y divide-border rounded-xl border border-border text-sm">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-4 px-4 py-2.5">
              <dt className="text-muted">{row.label}</dt>
              <dd>{row.value}</dd>
              <Button size="sm" variant="ghost" onPress={() => goTo(row.step)} aria-label={`Edit ${row.label.toLowerCase()}`}>
                Edit
              </Button>
            </div>
          ))}
        </dl>
      </Section>

      {issues.length > 0 && (
        <Section title="Before you submit" hint="Blockers must be fixed. Warnings are your call.">
          <IssueList issues={issues} onFix={update} />
        </Section>
      )}

      <Checkbox isSelected={acknowledged} onChange={setAcknowledged}>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>
          <span className="text-sm">I understand the formats and audience are fixed for this goal.</span>
        </Checkbox.Content>
      </Checkbox>
    </div>
  )
}
