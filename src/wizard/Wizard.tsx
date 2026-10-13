import { Button, Input } from '@heroui/react'
import { AlertTriangle, ArrowLeft, Check, Copy, OctagonAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { TODAY } from '../data/campaigns'
import { PRODUCTS } from '../data/catalogue'
import { FORMATS, GOALS } from '../data/goals'
import { audienceSize } from '../lib/estimate'
import { daysBetween, inr, range } from '../lib/format'
import type { Campaign, Draft, WizardStep } from '../lib/types'
import { addDays, blockers, validate } from '../lib/validate'
import { useStore } from '../state/store'
import { BudgetStep, BundleStep, GoalStep, ProductsStep, ReviewStep } from './steps'

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'goal', label: 'Goal' },
  { id: 'bundle', label: 'Bundle' },
  { id: 'products', label: 'Products & audience' },
  { id: 'budget', label: 'Budget & schedule' },
  { id: 'review', label: 'Review' },
]

const DEFAULT_LENGTH_DAYS = 14

function blankDraft(): Draft {
  const start = addDays(TODAY, 1)
  return {
    id: `cmp-${Date.now()}`,
    name: '',
    productIds: [],
    pausedProductIds: [],
    cityIds: ['blr'],
    negativeKeywords: [],
    budget: 0,
    split: {},
    startDate: start,
    endDate: addDays(start, DEFAULT_LENGTH_DAYS - 1),
    pacing: 'even',
  }
}

/** A copy keeps what describes the campaign and resets what is tied to a moment in time. */
function duplicate(source: Campaign): Draft {
  const blank = blankDraft()
  return {
    ...blank,
    name: `${source.name} (copy)`,
    goal: source.goal,
    productIds: source.productIds,
    cityIds: source.cityIds,
    negativeKeywords: source.negativeKeywords,
    split: source.split,
    pacing: source.pacing,
    creativeId: source.creativeId,
    budget: GOALS[source.goal].minBudget,
    duplicatedFrom: source.name,
  }
}

export function Wizard() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { campaigns, creatives, validationContext, dispatch, submit } = useStore()

  const editing = campaigns.find((c) => c.id === id)
  const source = campaigns.find((c) => c.id === params.get('from'))
  const [draft, setDraft] = useState<Draft>(() => (editing ? { ...editing } : source ? duplicate(source) : blankDraft()))
  const [step, setStep] = useState<WizardStep>(() => {
    const requested = STEPS.find((s) => s.id === params.get('step'))?.id
    return requested ?? (editing || source ? 'budget' : 'goal')
  })
  const [acknowledged, setAcknowledged] = useState(false)

  const ctx = useMemo(() => validationContext(draft.id), [validationContext, draft.id])
  const issues = useMemo(() => validate(draft, ctx), [draft, ctx])
  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const stepIssues = issues.filter((i) => i.step === step)
  const stepBlocked = blockers(stepIssues).length > 0
  const blockerCount = blockers(issues).length
  const warningCount = issues.length - blockerCount
  const goal = draft.goal ? GOALS[draft.goal] : null
  const isLiveEdit = editing && ['live', 'paused'].includes(editing.status)

  function toCampaign(status: Campaign['status'], note: string): Campaign {
    return {
      ...draft,
      goal: draft.goal!,
      name: draft.name.trim() || `${goal!.name} campaign`,
      status,
      spent: editing?.spent ?? 0,
      activity: [...(editing?.activity ?? []), { date: TODAY, text: note }],
    }
  }

  function saveDraft() {
    dispatch({ type: 'upsert', campaign: toCampaign('draft', 'Draft saved') })
    navigate('/campaigns')
  }

  function finish() {
    if (isLiveEdit) dispatch({ type: 'upsert', campaign: toCampaign(editing.status, 'Edited by you') })
    else submit(toCampaign('in_review', 'Submitted for review'))
    navigate('/campaigns')
  }

  const stepProps = { draft, issues, update: (apply: (d: Draft) => Draft) => setDraft(apply) }

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
            placeholder={editing ? 'Campaign name' : 'Name this campaign'}
            className="w-72 font-medium"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        {!isLiveEdit && (
          <Button variant="secondary" isDisabled={!draft.goal} onPress={saveDraft}>
            Save draft
          </Button>
        )}
      </header>

      {draft.duplicatedFrom && (
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
          <Copy size={16} className="mt-0.5 shrink-0" />
          <p>
            Copied from <strong className="font-semibold">{draft.duplicatedFrom}</strong>. Kept: goal, bundle, products, cities, split.
            Reset: dates and budget (set to the goal's minimum). Check them below.
          </p>
        </div>
      )}

      <ol className="mb-5 flex items-center gap-1 text-sm" aria-label="Steps">
        {STEPS.map((s, i) => {
          const reachable = i === 0 || Boolean(draft.goal)
          const hasBlocker = blockers(issues.filter((issue) => issue.step === s.id)).length > 0
          const done = i < stepIndex && !hasBlocker
          return (
            <li key={s.id} className="flex items-center gap-1">
              {i > 0 && <span className="mx-1 h-px w-6 bg-border" aria-hidden />}
              <button
                type="button"
                disabled={!reachable}
                aria-current={s.id === step ? 'step' : undefined}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors disabled:opacity-40 ${
                  s.id === step ? 'bg-accent-soft font-medium text-accent-soft-foreground' : 'text-muted hover:bg-default'
                }`}
              >
                <span
                  className={`tabular grid size-6 place-items-center rounded-full text-xs font-medium ${
                    done ? 'bg-success text-success-foreground' : hasBlocker && i < stepIndex ? 'bg-danger text-danger-foreground' : 'bg-default text-foreground'
                  }`}
                >
                  {done ? <Check size={13} /> : i + 1}
                </span>
                {s.label}
              </button>
            </li>
          )
        })}
      </ol>

      <div className="grid grid-cols-[1fr_17rem] items-start gap-5">
        <div className="min-w-0">
          {step === 'goal' && <GoalStep {...stepProps} creatives={creatives} />}
          {step === 'bundle' && goal && <BundleStep {...stepProps} creatives={creatives} />}
          {step === 'products' && goal && <ProductsStep {...stepProps} />}
          {step === 'budget' && goal && <BudgetStep {...stepProps} available={ctx.availableBalance} />}
          {step === 'review' && goal && (
            <ReviewStep {...stepProps} goTo={setStep} acknowledged={acknowledged} setAcknowledged={setAcknowledged} />
          )}
        </div>

        <aside className="sticky top-6 rounded-2xl border border-border bg-surface p-4 text-sm" aria-label="Summary">
          <h2 className="font-semibold">Summary</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted">Goal</dt>
            <dd className="text-right">{goal?.name ?? '—'}</dd>
            <dt className="text-muted">Formats</dt>
            <dd className="text-right">{goal ? goal.bundle.map((item) => FORMATS[item.format].name).join(', ') : '—'}</dd>
            <dt className="text-muted">Products</dt>
            <dd className="tabular text-right">
              {draft.productIds.length} of {PRODUCTS.length}
            </dd>
            <dt className="text-muted">Audience</dt>
            <dd className="tabular text-right">
              {goal && audienceSize(draft) ? range(audienceSize(draft) * 0.92, audienceSize(draft) * 1.08) : '—'}
            </dd>
            <dt className="text-muted">Budget</dt>
            <dd className="tabular text-right">{draft.budget ? inr(draft.budget) : '—'}</dd>
            <dt className="text-muted">Schedule</dt>
            <dd className="tabular text-right">
              {draft.endDate >= draft.startDate ? `${daysBetween(draft.startDate, draft.endDate)} days` : '—'}
            </dd>
          </dl>
          {goal && (
            <div className="mt-4 border-t border-border pt-3">
              {issues.length === 0 ? (
                <p className="flex items-center gap-2 text-success">
                  <Check size={15} /> Ready to submit
                </p>
              ) : (
                <>
                  <p className="tabular mb-2 text-xs text-muted">
                    {blockerCount} blocker{blockerCount === 1 ? '' : 's'} · {warningCount} warning{warningCount === 1 ? '' : 's'}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {issues.map((issue) => (
                      <li key={issue.code}>
                        <button
                          type="button"
                          onClick={() => setStep(issue.step)}
                          className={`flex items-start gap-2 text-left hover:underline ${issue.severity === 'blocker' ? 'text-danger' : 'text-warning'}`}
                        >
                          {issue.severity === 'blocker' ? (
                            <OctagonAlert size={14} className="mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                          )}
                          <span className="text-foreground">{issue.message.split('.')[0]}.</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </aside>
      </div>

      <footer className="fixed right-0 bottom-0 left-56 border-t border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-3">
          <p className="text-sm text-muted">
            {stepBlocked
              ? `Fix ${blockers(stepIssues).length} blocker${blockers(stepIssues).length === 1 ? '' : 's'} on this step to continue.`
              : step === 'review' && blockerCount > 0
                ? `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} left before you can submit.`
                : step === 'review' && !acknowledged
                  ? 'Tick the box to confirm, then submit.'
                  : `Step ${stepIndex + 1} of ${STEPS.length}`}
          </p>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button variant="secondary" onPress={() => setStep(STEPS[stepIndex - 1].id)}>
                Back
              </Button>
            )}
            {step === 'review' ? (
              <Button variant="primary" isDisabled={blockerCount > 0 || !acknowledged} onPress={finish}>
                {isLiveEdit ? 'Save changes' : 'Submit for review'}
              </Button>
            ) : (
              <Button variant="primary" isDisabled={stepBlocked} onPress={() => setStep(STEPS[stepIndex + 1].id)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
