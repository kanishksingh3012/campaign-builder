import { Button, Checkbox, Chip, Input } from '@heroui/react'
import { AlertTriangle, ArrowLeft, Check, Copy, OctagonAlert, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { TODAY } from '../data/campaigns'
import { AUTO_KEYWORDS } from '../data/catalogue'
import { AUDIENCES, FORMATS, GOALS } from '../data/goals'
import { audienceSize, bundleOf } from '../lib/bundle'
import { inr, range } from '../lib/format'
import type { AudienceId, Campaign, CustomSetup, Draft, FormatId, Issue } from '../lib/types'
import { blockers, recommendedSplit, validate } from '../lib/validate'
import { useStore } from '../state/store'
import { IssueList } from './IssueNote'
import { BudgetStep, CreativePicker, ProductsStep } from './steps'
import { blankDraft, duplicate } from './Wizard'

const FORMAT_ORDER: FormatId[] = ['search_ads', 'category_boost', 'cart_addon', 'buy_again', 'search_banner', 'home_banner']
const EMPTY_SETUP: CustomSetup = { formats: [], audiences: ['all'], bids: {}, keywords: [], match: 'broad' }

const SECTIONS = [
  { id: 'formats', label: 'Formats' },
  { id: 'targeting', label: 'Targeting' },
  { id: 'bids', label: 'Bids' },
  { id: 'budget', label: 'Budget & schedule' },
]

/** Where each issue lives on the page, so the summary can jump to it. */
function sectionOf(issue: Issue): string {
  if (issue.field === 'formats' || issue.field === 'creative') return 'formats'
  if (issue.field.startsWith('bid:')) return 'bids'
  if (issue.step === 'budget') return 'budget'
  return 'targeting'
}

function Card({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Format-first builder: the advertiser picks formats, audiences, keywords and bids by hand. */
export function CustomBuilder() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { campaigns, creatives, validationContext, dispatch, submit, role } = useStore()

  const editing = campaigns.find((c) => c.id === id)
  const source = campaigns.find((c) => c.id === params.get('from'))
  const [draft, setDraft] = useState<Draft>(() => {
    if (editing) return { ...editing }
    if (source) return duplicate(source)
    return { ...blankDraft(), goal: 'custom', custom: EMPTY_SETUP, budget: GOALS.custom.minBudget }
  })
  const [keyword, setKeyword] = useState('')
  const custom = draft.custom ?? EMPTY_SETUP
  const bundle = bundleOf(draft)

  const ctx = useMemo(() => validationContext(draft.id), [validationContext, draft.id])
  const issues = useMemo(() => validate(draft, ctx), [draft, ctx])
  const blockerCount = blockers(issues).length
  const isLiveEdit = editing && ['live', 'paused'].includes(editing.status)
  const update = (apply: (d: Draft) => Draft) => setDraft(apply)
  const setCustom = (change: Partial<CustomSetup>) => update((d) => ({ ...d, custom: { ...(d.custom ?? EMPTY_SETUP), ...change } }))
  const at = (prefix: string) => issues.filter((i) => i.field === prefix || i.field.startsWith(`${prefix}:`))

  function toggleFormat(format: FormatId) {
    update((d) => {
      const current = d.custom ?? EMPTY_SETUP
      const formats = current.formats.includes(format) ? current.formats.filter((f) => f !== format) : [...current.formats, format]
      const bids = { ...current.bids, [format]: current.bids[format] ?? FORMATS[format].avgCost }
      const next = { ...d, custom: { ...current, formats, bids } }
      const needsCreative = formats.some((f) => FORMATS[f].needsCreative)
      return {
        ...next,
        // Changing the format list makes the old split meaningless, so start from an even one.
        split: recommendedSplit(next),
        creativeId: needsCreative ? (d.creativeId ?? creatives.find((c) => c.status === 'approved')?.id) : undefined,
      }
    })
  }

  function toggleAudience(audience: AudienceId) {
    const has = custom.audiences.includes(audience)
    // "All shoppers" already contains every other audience, so it can't be combined with them.
    if (audience === 'all') return setCustom({ audiences: has ? [] : ['all'] })
    const rest = custom.audiences.filter((a) => a !== 'all')
    setCustom({ audiences: has ? rest.filter((a) => a !== audience) : [...rest, audience] })
  }

  function addKeyword() {
    const value = keyword.trim().toLowerCase()
    if (value) setCustom({ keywords: [...new Set([...custom.keywords, value])] })
    setKeyword('')
  }

  function toCampaign(status: Campaign['status'], note: string): Campaign {
    return {
      ...draft,
      goal: 'custom',
      name: draft.name.trim() || 'Custom campaign',
      status,
      onBehalf: editing?.onBehalf ?? role === 'internal',
      spent: editing?.spent ?? 0,
      activity: [...(editing?.activity ?? []), { date: TODAY, text: role === 'internal' ? `${note} by account manager` : note }],
    }
  }

  function finish() {
    if (isLiveEdit) dispatch({ type: 'upsert', campaign: toCampaign(editing.status, 'Edited') })
    else submit(toCampaign('in_review', 'Submitted for review'))
    navigate(role === 'internal' ? '/internal/review' : '/campaigns')
  }

  const usesSearch = custom.formats.some((f) => f === 'search_ads' || f === 'search_banner')
  const needsCreative = custom.formats.some((f) => FORMATS[f].needsCreative)
  const size = audienceSize(draft)
  const stepProps = { draft, issues, update }

  return (
    <div className="pb-20">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/campaigns" aria-label="Back to campaigns" className="rounded-lg p-1.5 text-muted hover:bg-default">
            <ArrowLeft size={18} />
          </Link>
          <Input
            aria-label="Campaign name"
            value={draft.name}
            placeholder="Name this campaign"
            className="w-72 font-medium"
            onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
          />
          <Chip size="sm" variant="soft" className="whitespace-nowrap">
            Custom campaign
          </Chip>
        </div>
        {!isLiveEdit && (
          <Button
            variant="secondary"
            onPress={() => {
              dispatch({ type: 'upsert', campaign: toCampaign('draft', 'Draft saved') })
              navigate('/campaigns')
            }}
          >
            Save draft
          </Button>
        )}
      </header>

      <p className="mb-4 rounded-xl bg-default px-4 py-2.5 text-sm">
        You choose everything here, so nothing is checked against a goal.{' '}
        <Link to="/campaigns/new" className="font-medium text-accent hover:underline">
          Use a goal-based campaign instead
        </Link>{' '}
        if you'd rather state an outcome and let the platform pick the tactics.
      </p>

      {draft.duplicatedFrom && (
        <p className="mb-4 flex items-start gap-3 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
          <Copy size={16} className="mt-0.5 shrink-0" />
          <span>
            Copied from <strong className="font-semibold">{draft.duplicatedFrom}</strong>. Kept: formats, audiences, keywords, bids, products, cities.
            Reset: dates and budget.
          </span>
        </p>
      )}

      <div className="grid grid-cols-[1fr_17rem] items-start gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          <Card id="formats" title="Ad formats" hint="Pick any combination. Each has its own price model and minimum budget.">
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_ORDER.map((formatId) => {
                const format = FORMATS[formatId]
                return (
                  <div key={formatId} className="rounded-xl border border-border px-3 py-2.5">
                    <Checkbox className="flex-row items-start gap-2.5" isSelected={custom.formats.includes(formatId)} onChange={() => toggleFormat(formatId)}>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <span className="text-sm">
                          <span className="font-medium">{format.name}</span>
                          <span className="block text-muted">{format.placement}</span>
                          <span className="tabular block text-xs text-muted">
                            Pay per {format.pricing === 'CPC' ? 'click' : '1,000 views'} · usually {inr(format.avgCost)}
                          </span>
                        </span>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 empty:hidden">
              <IssueList issues={at('formats')} onFix={update} />
            </div>
            {needsCreative && (
              <div className="mt-4">
                <CreativePicker {...stepProps} creatives={creatives} />
              </div>
            )}
          </Card>

          <div id="targeting" className="flex scroll-mt-6 flex-col gap-4">
            <ProductsStep
              {...stepProps}
              audiencePicker={
                <div role="group" aria-label="Audiences" className="flex flex-col gap-1.5">
                  {AUDIENCES.map((audience) => {
                    const on = custom.audiences.includes(audience.id)
                    return (
                      <button
                        key={audience.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleAudience(audience.id)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                          on ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-secondary'
                        }`}
                      >
                        <span className="flex items-center justify-between font-medium">
                          {audience.name}
                          {on && <Check size={14} className="text-accent" />}
                        </span>
                        <span className="text-muted">{audience.description}</span>
                      </button>
                    )
                  })}
                  {custom.audiences.length > 1 && (
                    <p className="text-xs text-muted">Combined: a shopper in any of these {custom.audiences.length} groups can see the ads.</p>
                  )}
                </div>
              }
            />

            {usesSearch && (
              <Card id="keywords" title="Keywords" hint="Searches your search formats can show for.">
                <div className="mb-3 flex items-center gap-3 text-sm">
                  <span className="font-medium">Match</span>
                  <span role="radiogroup" aria-label="Keyword match type" className="flex rounded-xl border border-border p-0.5">
                    {(['broad', 'exact'] as const).map((match) => (
                      <button
                        key={match}
                        type="button"
                        role="radio"
                        aria-checked={custom.match === match}
                        onClick={() => setCustom({ match })}
                        className={`rounded-lg px-3 py-1 capitalize transition-colors ${custom.match === match ? 'bg-accent-soft font-medium text-accent-soft-foreground' : 'text-muted'}`}
                      >
                        {match}
                      </button>
                    ))}
                  </span>
                  <span className="text-muted">
                    {custom.match === 'broad' ? 'Also shows for related searches. More reach, less precise.' : 'Shows only for these exact searches. Precise, less reach.'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    aria-label="Add a keyword"
                    value={keyword}
                    placeholder="e.g. masala chips"
                    className="w-64"
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <Button variant="secondary" onPress={addKeyword}>
                    Add
                  </Button>
                  {custom.keywords.length > 0 && custom.keywords.length < AUTO_KEYWORDS.length && (
                    <Button variant="ghost" onPress={() => setCustom({ keywords: [...new Set([...custom.keywords, ...AUTO_KEYWORDS.slice(0, 8)])] })}>
                      Add suggested
                    </Button>
                  )}
                </div>
                {custom.keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {custom.keywords.map((word) => (
                      <Chip key={word} size="sm" variant="secondary">
                        {word}
                        <button type="button" aria-label={`Remove ${word}`} onClick={() => setCustom({ keywords: custom.keywords.filter((w) => w !== word) })}>
                          <X size={12} />
                        </button>
                      </Chip>
                    ))}
                  </div>
                )}
                <div className="mt-3 empty:hidden">
                  <IssueList issues={at('keywords')} onFix={update} />
                </div>
              </Card>
            )}
          </div>

          <Card id="bids" title="Bids" hint="The most you'll pay. You're charged just enough to beat the next advertiser, never more than your bid.">
            {bundle.length === 0 ? (
              <p className="text-sm text-muted">Choose a format to set its bid.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {bundle.map((item) => {
                  const format = FORMATS[item.format]
                  return (
                    <div key={item.format}>
                      <div className="grid grid-cols-[10rem_auto_1fr] items-center gap-4 text-sm">
                        <span className="font-medium">{format.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted">₹</span>
                          <Input
                            aria-label={`${format.name} bid in rupees`}
                            inputMode="numeric"
                            className="tabular w-24"
                            value={custom.bids[item.format] ?? ''}
                            onChange={(e) => setCustom({ bids: { ...custom.bids, [item.format]: Number(e.target.value.replace(/\D/g, '')) } })}
                          />
                        </span>
                        <span className="tabular text-muted">
                          {format.pricing === 'CPC' ? 'per click' : 'per 1,000 views'} · suggested {inr(format.avgCost)}
                        </span>
                      </div>
                      <div className="mt-2 empty:hidden">
                        <IssueList issues={at(`bid:${item.format}`)} onFix={update} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <div id="budget" className="scroll-mt-6">
            {bundle.length > 0 ? (
              <BudgetStep {...stepProps} available={ctx.availableBalance} />
            ) : (
              <Card id="budget-empty" title="Budget and schedule">
                <p className="text-sm text-muted">Choose a format first; the budget is split across the formats you pick.</p>
              </Card>
            )}
          </div>
        </div>

        <aside className="sticky top-6 rounded-2xl border border-border bg-surface p-4 text-sm shadow-card" aria-label="Summary">
          <nav aria-label="Sections" className="mb-3 flex flex-wrap gap-1.5">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted hover:bg-surface-secondary">
                {section.label}
              </a>
            ))}
          </nav>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted">Formats</dt>
            <dd className="text-right">{bundle.map((item) => FORMATS[item.format].name).join(', ') || '—'}</dd>
            <dt className="text-muted">Audience</dt>
            <dd className="tabular text-right">{size ? range(size * 0.92, size * 1.08) : '—'}</dd>
            <dt className="text-muted">Keywords</dt>
            <dd className="tabular text-right">{usesSearch ? `${custom.keywords.length}, ${custom.match}` : 'Not needed'}</dd>
            <dt className="text-muted">Budget</dt>
            <dd className="tabular text-right">{draft.budget ? inr(draft.budget) : '—'}</dd>
          </dl>
          <div className="mt-4 border-t border-border pt-3">
            {issues.length === 0 ? (
              <p className="flex items-center gap-2 text-success">
                <Check size={15} /> Ready to submit
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {issues.map((issue) => (
                  <li key={issue.code}>
                    <a href={`#${sectionOf(issue)}`} className={`flex items-start gap-2 hover:underline ${issue.severity === 'blocker' ? 'text-danger' : 'text-warning'}`}>
                      {issue.severity === 'blocker' ? <OctagonAlert size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                      <span className="text-foreground">{issue.message.split('.')[0]}.</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <footer className="fixed right-0 bottom-0 left-56 border-t border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-3">
          <p className="text-sm text-muted">
            {blockerCount > 0 ? `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} to fix before you can submit.` : 'No blockers. Warnings are your call.'}
          </p>
          <Button variant="primary" isDisabled={blockerCount > 0} onPress={finish}>
            {isLiveEdit ? 'Save changes' : 'Submit for review'}
          </Button>
        </div>
      </footer>
    </div>
  )
}
