import { CITIES, FORMATS, GOALS } from '../data/goals'
import type { Draft, FormatId } from './types'

// Illustrative forecasting: enough to make budget changes feel real, not a real model.

/** Share of clicks that become an order, by format. */
export const ORDER_RATE: Record<FormatId, number> = {
  home_banner: 0.06,
  search_banner: 0.09,
  category_boost: 0.14,
  search_ads: 0.18,
  buy_again: 0.3,
  cart_addon: 0.26,
}
/** Forecasts are shown as a range this far either side of the midpoint. */
const SPREAD = 0.12

export interface Estimate {
  audience: [number, number]
  impressions: [number, number]
  clicks: [number, number]
  orders: [number, number]
  /** Share of the audience the budget can reach, 0 to 1. */
  coverage: number
}

export function audienceSize(draft: Pick<Draft, 'goal' | 'cityIds'>): number {
  if (!draft.goal) return 0
  const shoppers = CITIES.filter((city) => draft.cityIds.includes(city.id)).reduce((sum, city) => sum + city.shoppers, 0)
  return shoppers * GOALS[draft.goal].audienceShare
}

export function estimate(draft: Pick<Draft, 'goal' | 'cityIds' | 'budget' | 'split'>): Estimate | null {
  if (!draft.goal || draft.budget <= 0) return null
  let impressions = 0
  let clicks = 0
  let orders = 0
  for (const item of GOALS[draft.goal].bundle) {
    const format = FORMATS[item.format]
    const rupees = (draft.budget * (draft.split[item.format] ?? 0)) / 100
    const formatClicks = format.pricing === 'CPC' ? rupees / format.avgCost : (rupees / format.avgCost) * 1000 * format.ctr
    const formatImpressions = format.pricing === 'CPM' ? (rupees / format.avgCost) * 1000 : formatClicks / format.ctr
    impressions += formatImpressions
    clicks += formatClicks
    orders += formatClicks * ORDER_RATE[item.format]
  }
  const audience = audienceSize(draft)
  // Assume each reached shopper sees about three impressions over the campaign.
  const coverage = audience ? Math.min(1, impressions / 3 / audience) : 0
  return {
    audience: spread(audience),
    impressions: spread(impressions),
    clicks: spread(clicks),
    orders: spread(orders),
    coverage,
  }
}

function spread(mid: number): [number, number] {
  return [Math.round(mid * (1 - SPREAD)), Math.round(mid * (1 + SPREAD))]
}
