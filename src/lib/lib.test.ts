import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/ads'
import { SEED_CAMPAIGNS } from '../data/campaigns'
import { CREATIVES, PRODUCTS } from '../data/catalogue'
import { GOAL_LIST } from '../data/goals'
import { rankAds, runAuction } from './auction'
import { estimate } from './estimate'
import { count, inr } from './format'
import type { Draft } from './types'
import { blockers, splitTotal, validate, type ValidationContext } from './validate'

const ctx: ValidationContext = { products: PRODUCTS, creatives: CREATIVES, campaigns: [], availableBalance: 500000 }

const validDraft: Draft = {
  id: 'new', name: 'Test', goal: 'new_customers',
  productIds: ['p1', 'p2'], pausedProductIds: [], cityIds: ['blr'], negativeKeywords: [],
  budget: 100000, split: { search_ads: 65, category_boost: 35 },
  startDate: '2026-11-01', endDate: '2026-11-14', pacing: 'even',
}

/** Apply an issue's primary fix and re-validate. */
function fix(draft: Draft, code: string, context = ctx) {
  const issue = validate(draft, context).find((i) => i.code === code)!
  const fixed = issue.fixes[0].apply(draft)
  return { fixed, codes: validate(fixed, context).map((i) => i.code) }
}

describe('format', () => {
  it('uses Indian digit grouping', () => {
    expect(inr(150000)).toBe('₹1,50,000')
    expect(count(130000)).toBe('1.3 lakh')
  })
})

describe('goals', () => {
  it('every bundle has shares summing to 100 and floors within the minimum budget', () => {
    for (const goal of GOAL_LIST) {
      expect(goal.bundle.reduce((sum, item) => sum + item.share, 0)).toBe(100)
      for (const item of goal.bundle) {
        expect((goal.minBudget * item.share) / 100).toBeGreaterThanOrEqual(item.floor)
      }
    }
  })
})

describe('auction', () => {
  const chips = SCENARIOS[0]

  it('ranks by bid × predicted click rate, so a lower bid can win', () => {
    const { ranked } = rankAds(chips.ads, 0)
    const top = ranked[0]
    expect(ranked.some((ad) => ad.bid > top.bid)).toBe(true)
    expect(ranked.map((ad) => ad.score)).toEqual([...ranked.map((ad) => ad.score)].sort((a, b) => b - a))
  })

  it('never charges more than the bid', () => {
    for (const ad of rankAds(chips.ads, 0).ranked) expect(ad.cpc).toBeLessThanOrEqual(ad.bid)
  })

  it('a relevance floor removes ads and can leave slots unfilled', () => {
    const niche = SCENARIOS[2]
    const strict = runAuction(niche, { slots: 4, relevanceFloor: 0.7 })
    expect(strict.winners.length).toBe(1)
    expect(strict.fillRate).toBe(0.25)
    expect(strict.filtered.length).toBe(niche.ads.length - 1)
  })

  it('more ad load raises revenue and lowers conversion when ads are less relevant than organic', () => {
    const festive = SCENARIOS[1]
    const light = runAuction(festive, { slots: 1, relevanceFloor: 0 })
    const heavy = runAuction(festive, { slots: 5, relevanceFloor: 0 })
    expect(heavy.revenuePer1000).toBeGreaterThan(light.revenuePer1000)
    expect(heavy.conversion).toBeLessThan(light.conversion)
  })

  it('zero slots leaves conversion at baseline', () => {
    expect(runAuction(chips, { slots: 0, relevanceFloor: 0 }).conversionChange).toBeCloseTo(0)
  })
})

describe('validate', () => {
  it('passes a valid draft', () => {
    expect(validate(validDraft, ctx)).toEqual([])
  })

  it('blocks a budget below the goal minimum and fixes it in one step', () => {
    const { fixed, codes } = fix({ ...validDraft, budget: 60000 }, 'below_min_budget')
    expect(fixed.budget).toBe(75000)
    expect(codes).not.toContain('below_min_budget')
  })

  it('blocks a split that does not total 100 and redistributes it', () => {
    const { fixed, codes } = fix({ ...validDraft, split: { search_ads: 60, category_boost: 30 } }, 'split_total')
    expect(splitTotal(fixed)).toBe(100)
    expect(codes).not.toContain('split_total')
  })

  it('warns when a format is under its floor and raises it', () => {
    const draft = { ...validDraft, budget: 80000, split: { search_ads: 80, category_boost: 20 } }
    const { fixed, codes } = fix(draft, 'below_floor:category_boost')
    expect(splitTotal(fixed)).toBe(100)
    expect(codes).toEqual([])
  })

  it('warns about out-of-stock products with remove and keep-paused options', () => {
    const draft = { ...validDraft, productIds: ['p1', 'p3'] }
    const issue = validate(draft, ctx).find((i) => i.code === 'out_of_stock:p3')!
    expect(issue.severity).toBe('warning')
    expect(issue.fixes[0].apply(draft).productIds).toEqual(['p1'])
    expect(validate(issue.fixes[1].apply(draft), ctx)).toEqual([])
  })

  it('blocks a budget above the available balance', () => {
    const { fixed } = fix({ ...validDraft, budget: 300000 }, 'over_balance', { ...ctx, availableBalance: 200000 })
    expect(fixed.budget).toBe(200000)
  })

  it('warns on a short schedule but does not block', () => {
    const issues = validate({ ...validDraft, endDate: '2026-11-03' }, ctx)
    expect(issues.map((i) => i.code)).toEqual(['short_schedule'])
    expect(blockers(issues)).toEqual([])
  })

  it('warns when dates overlap a live campaign with the same goal and products', () => {
    const live = SEED_CAMPAIGNS.find((c) => c.id === 'cmp2')!
    const draft = { ...validDraft, startDate: '2026-10-10', endDate: '2026-10-23' }
    const { fixed, codes } = fix(draft, 'overlap', { ...ctx, campaigns: [live] })
    expect(fixed.startDate > live.endDate).toBe(true)
    expect(codes).not.toContain('overlap')
  })

  it('blocks a rejected creative on banner goals and swaps it', () => {
    const draft: Draft = { ...validDraft, goal: 'awareness', budget: 150000, split: { home_banner: 50, search_banner: 30, category_boost: 20 }, creativeId: 'c3' }
    const { codes } = fix(draft, 'rejected_creative')
    expect(codes).toEqual([])
  })

  it('flags the seeded draft with the issues the demo relies on', () => {
    const { goal, status, spent, activity, ...rest } = SEED_CAMPAIGNS.find((c) => c.id === 'cmp7')!
    void status; void spent; void activity
    const codes = validate({ ...rest, goal }, ctx).map((i) => i.code)
    expect(codes).toEqual(expect.arrayContaining(['below_min_budget', 'split_total', 'short_schedule']))
  })
})

describe('estimate', () => {
  it('scales with budget', () => {
    const small = estimate(validDraft)!
    const large = estimate({ ...validDraft, budget: 200000 })!
    expect(large.clicks[0]).toBeGreaterThan(small.clicks[0])
    expect(small.orders[0]).toBeLessThan(small.clicks[0])
  })
})
