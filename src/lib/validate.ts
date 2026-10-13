import { FORMATS, GOALS } from '../data/goals'
import { daysBetween, inr } from './format'
import type { Campaign, Creative, Draft, FormatId, Issue, Product } from './types'

export interface ValidationContext {
  products: Product[]
  creatives: Creative[]
  campaigns: Campaign[]
  /** Rupees not yet committed to other campaigns. */
  availableBalance: number
}

export function splitTotal(draft: Pick<Draft, 'goal' | 'split'>): number {
  if (!draft.goal) return 0
  return GOALS[draft.goal].bundle.reduce((sum, item) => sum + (draft.split[item.format] ?? 0), 0)
}

export function recommendedSplit(goal: NonNullable<Draft['goal']>): Partial<Record<FormatId, number>> {
  return Object.fromEntries(GOALS[goal].bundle.map((item) => [item.format, item.share]))
}

/** Every problem with a draft, each carrying the fix the UI offers beside it. */
export function validate(draft: Draft, ctx: ValidationContext): Issue[] {
  const issues: Issue[] = []
  if (!draft.goal) {
    issues.push({ code: 'no_goal', step: 'goal', field: 'goal', severity: 'blocker', message: 'Choose a goal to continue.', fixes: [] })
    return issues
  }
  const goal = GOALS[draft.goal]

  // Products
  const selected = ctx.products.filter((product) => draft.productIds.includes(product.id))
  if (selected.length === 0) {
    issues.push({ code: 'no_products', step: 'products', field: 'products', severity: 'blocker', message: 'Select at least one product. Ads need something to promote.', fixes: [] })
  }
  for (const product of selected) {
    if (product.inStock || draft.pausedProductIds.includes(product.id)) continue
    issues.push({
      code: `out_of_stock:${product.id}`,
      step: 'products',
      field: `product:${product.id}`,
      severity: 'warning',
      message: `${product.name} is out of stock, so its ads would lead nowhere.`,
      fixes: [
        { label: 'Remove', apply: (d) => ({ ...d, productIds: d.productIds.filter((id) => id !== product.id) }) },
        { label: 'Keep, pause until restocked', apply: (d) => ({ ...d, pausedProductIds: [...d.pausedProductIds, product.id] }) },
      ],
    })
  }
  if (draft.cityIds.length === 0) {
    issues.push({ code: 'no_cities', step: 'products', field: 'cities', severity: 'blocker', message: 'Choose at least one city.', fixes: [] })
  }

  // Creative
  const needsCreative = goal.bundle.some((item) => FORMATS[item.format].needsCreative)
  const creative = ctx.creatives.find((c) => c.id === draft.creativeId)
  const approved = ctx.creatives.find((c) => c.status === 'approved')
  if (needsCreative && !creative) {
    issues.push({
      code: 'no_creative', step: 'bundle', field: 'creative', severity: 'blocker',
      message: 'Banner formats need a creative.',
      fixes: approved ? [{ label: `Use "${approved.name}"`, apply: (d) => ({ ...d, creativeId: approved.id }) }] : [],
    })
  } else if (needsCreative && creative?.status === 'rejected') {
    issues.push({
      code: 'rejected_creative', step: 'bundle', field: 'creative', severity: 'blocker',
      message: `"${creative.name}" was rejected: ${creative.rejectionReason ?? 'does not meet guidelines'}.`,
      fixes: approved ? [{ label: `Swap to "${approved.name}"`, apply: (d) => ({ ...d, creativeId: approved.id }) }] : [],
    })
  }

  // Budget
  if (draft.budget < goal.minBudget) {
    issues.push({
      code: 'below_min_budget', step: 'budget', field: 'budget', severity: 'blocker',
      message: `Minimum for ${goal.name} is ${inr(goal.minBudget)}. Below that, the bundle can't deliver enough to judge.`,
      fixes: [{ label: `Set to ${inr(goal.minBudget)}`, apply: (d) => ({ ...d, budget: goal.minBudget }) }],
    })
  } else if (draft.budget > ctx.availableBalance) {
    const shortfall = draft.budget - ctx.availableBalance
    const fixes = ctx.availableBalance >= goal.minBudget
      ? [{ label: `Lower to ${inr(ctx.availableBalance)}`, apply: (d: Draft) => ({ ...d, budget: ctx.availableBalance }) }]
      : []
    issues.push({
      code: 'over_balance', step: 'budget', field: 'budget', severity: 'blocker',
      message: `This is ${inr(shortfall)} more than your available balance of ${inr(ctx.availableBalance)}.`,
      fixes,
    })
  }

  // Split
  const total = splitTotal(draft)
  if (total !== 100) {
    const remaining = 100 - total
    issues.push({
      code: 'split_total', step: 'budget', field: 'split', severity: 'blocker',
      message: remaining > 0 ? `Split must add up to 100%. ${remaining}% is unassigned.` : `Split must add up to 100%. You are ${-remaining}% over.`,
      fixes: [
        { label: remaining > 0 ? 'Distribute remaining' : 'Scale down to 100%', apply: (d) => ({ ...d, split: rebalance(d) }) },
        { label: 'Use recommended split', apply: (d) => ({ ...d, split: recommendedSplit(goal.id) }) },
      ],
    })
  } else if (draft.budget >= goal.minBudget) {
    for (const item of goal.bundle) {
      const rupees = (draft.budget * (draft.split[item.format] ?? 0)) / 100
      if (rupees >= item.floor) continue
      issues.push({
        code: `below_floor:${item.format}`, step: 'budget', field: `split:${item.format}`, severity: 'warning',
        message: `${FORMATS[item.format].name} gets ${inr(rupees)}, below the ${inr(item.floor)} it needs to deliver.`,
        fixes: [{ label: 'Raise to floor', apply: (d) => ({ ...d, split: raiseToFloor(d, item.format) }) }],
      })
    }
  }

  // Schedule
  if (!draft.startDate || !draft.endDate) {
    issues.push({ code: 'no_dates', step: 'budget', field: 'schedule', severity: 'blocker', message: 'Choose start and end dates.', fixes: [] })
  } else if (draft.endDate < draft.startDate) {
    issues.push({
      code: 'dates_reversed', step: 'budget', field: 'schedule', severity: 'blocker',
      message: 'End date is before the start date.',
      fixes: [{ label: 'Swap dates', apply: (d) => ({ ...d, startDate: d.endDate, endDate: d.startDate }) }],
    })
  } else {
    const days = daysBetween(draft.startDate, draft.endDate)
    if (days < goal.minDays) {
      issues.push({
        code: 'short_schedule', step: 'budget', field: 'schedule', severity: 'warning',
        message: `${days} day${days === 1 ? '' : 's'} may be too short to learn what works. ${goal.minDays} or more is recommended.`,
        fixes: [{ label: `Extend to ${goal.minDays} days`, apply: (d) => ({ ...d, endDate: addDays(d.startDate, goal.minDays - 1) }) }],
      })
    }
    const clash = ctx.campaigns.find(
      (other) =>
        other.id !== draft.id &&
        other.goal === draft.goal &&
        ['live', 'in_review', 'paused'].includes(other.status) &&
        other.startDate <= draft.endDate &&
        other.endDate >= draft.startDate &&
        other.productIds.some((id) => draft.productIds.includes(id)),
    )
    if (clash) {
      issues.push({
        code: 'overlap', step: 'budget', field: 'schedule', severity: 'warning',
        message: `Overlaps with "${clash.name}" (same goal and products). The two would bid against each other.`,
        fixes: [{
          label: `Start after it ends`,
          apply: (d) => {
            const length = daysBetween(d.startDate, d.endDate)
            const start = addDays(clash.endDate, 1)
            return { ...d, startDate: start, endDate: addDays(start, length - 1) }
          },
        }],
      })
    }
  }

  return issues
}

export function blockers(issues: Issue[]): Issue[] {
  return issues.filter((issue) => issue.severity === 'blocker')
}

/** Scale the current split to total exactly 100, keeping proportions. Falls back to the recommended split. */
function rebalance(draft: Draft): Draft['split'] {
  const goal = GOALS[draft.goal!]
  const total = splitTotal(draft)
  if (total === 0) return recommendedSplit(goal.id)
  const formats = goal.bundle.map((item) => item.format)
  const scaled = formats.map((format) => Math.floor(((draft.split[format] ?? 0) * 100) / total))
  // Hand out the rounding leftover to the largest share.
  const leftover = 100 - scaled.reduce((sum, n) => sum + n, 0)
  scaled[scaled.indexOf(Math.max(...scaled))] += leftover
  return Object.fromEntries(formats.map((format, i) => [format, scaled[i]]))
}

/** Lift one format to its floor, taking the difference from the format with the most headroom. */
function raiseToFloor(draft: Draft, target: FormatId): Draft['split'] {
  const goal = GOALS[draft.goal!]
  const floorOf = (format: FormatId) => goal.bundle.find((item) => item.format === format)!.floor
  const needed = Math.ceil((floorOf(target) / draft.budget) * 100)
  const gap = needed - (draft.split[target] ?? 0)
  const headroom = (format: FormatId) => (draft.split[format] ?? 0) - Math.ceil((floorOf(format) / draft.budget) * 100)
  const donor = goal.bundle
    .map((item) => item.format)
    .filter((format) => format !== target)
    .sort((a, b) => headroom(b) - headroom(a))[0]
  if (!donor || headroom(donor) < gap) return recommendedSplit(goal.id)
  return { ...draft.split, [target]: needed, [donor]: (draft.split[donor] ?? 0) - gap }
}

export function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
