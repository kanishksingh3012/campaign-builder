import { TODAY } from '../data/campaigns'
import { AUTO_KEYWORDS } from '../data/catalogue'
import { FORMATS } from '../data/goals'
import { bundleOf } from './bundle'
import { ORDER_RATE } from './estimate'
import { daysBetween } from './format'
import type { Campaign, FormatId } from './types'
import { addDays } from './validate'

// Turns a campaign's spend into plausible performance numbers. Deterministic, so the demo looks the same every load.

/** Clicks that reach the cart, relative to clicks that become orders. */
const CART_TO_ORDER = 0.55
/** Average rupees of the brand's products in an order that an ad led to. */
const SALES_PER_ORDER = 165
/** Share of orders that count toward each goal's headline metric. */
const HEADLINE_SHARE = { awareness: 0, new_customers: 0.82, win_back: 0.74, custom: 1 } as const
/** Impressions a reached shopper sees on average. */
const FREQUENCY = 3

export interface FormatPerformance {
  format: FormatId
  spend: number
  impressions: number
  clicks: number
  orders: number
}

export interface Performance {
  spend: number
  impressions: number
  clicks: number
  addToCarts: number
  orders: number
  sales: number
  roas: number
  /** The number the campaign's goal is judged on. */
  headline: number
  byFormat: FormatPerformance[]
}

export function performance(campaign: Campaign): Performance {
  const byFormat = bundleOf(campaign).map((item) => {
    const format = FORMATS[item.format]
    const spend = (campaign.spent * (campaign.split[item.format] ?? item.share)) / 100
    const clicks = format.pricing === 'CPC' ? spend / format.avgCost : (spend / format.avgCost) * 1000 * format.ctr
    const impressions = format.pricing === 'CPM' ? (spend / format.avgCost) * 1000 : clicks / format.ctr
    return { format: item.format, spend, impressions: Math.round(impressions), clicks: Math.round(clicks), orders: Math.round(clicks * ORDER_RATE[item.format]) }
  })
  const sum = (key: keyof Omit<FormatPerformance, 'format'>) => byFormat.reduce((total, row) => total + row[key], 0)
  const orders = sum('orders')
  const impressions = sum('impressions')
  const sales = orders * SALES_PER_ORDER
  return {
    spend: campaign.spent,
    impressions,
    clicks: sum('clicks'),
    addToCarts: Math.round(orders / CART_TO_ORDER),
    orders,
    sales,
    roas: campaign.spent ? sales / campaign.spent : 0,
    headline: campaign.goal === 'awareness' ? Math.round(impressions / FREQUENCY) : Math.round(orders * HEADLINE_SHARE[campaign.goal]),
    byFormat,
  }
}

export function totals(campaigns: Campaign[]) {
  const all = campaigns.map(performance)
  const spend = all.reduce((sum, p) => sum + p.spend, 0)
  const sales = all.reduce((sum, p) => sum + p.sales, 0)
  const newCustomers = campaigns.reduce((sum, c, i) => sum + (c.goal === 'new_customers' ? all[i].headline : 0), 0)
  return { spend, sales, roas: spend ? sales / spend : 0, orders: all.reduce((sum, p) => sum + p.orders, 0), newCustomers }
}

/** Spend per day from the start date until today (or the end date), summing to what the campaign has spent. */
export function dailySpend(campaign: Campaign): { date: string; spend: number }[] {
  const last = campaign.endDate < TODAY ? campaign.endDate : TODAY
  if (campaign.spent === 0 || campaign.startDate > last) return []
  const days = daysBetween(campaign.startDate, last)
  const weights = Array.from({ length: days }, (_, i) => {
    const trend = campaign.pacing === 'front_loaded' ? 1.6 - i / days : 1
    return trend * (0.8 + 0.4 * noise(campaign.id, i))
  })
  const total = weights.reduce((sum, w) => sum + w, 0)
  return weights.map((w, i) => ({ date: addDays(campaign.startDate, i), spend: Math.round((campaign.spent * w) / total) }))
}

/** Share of the schedule that has passed, 0 to 1. */
export function timeElapsed(campaign: Campaign): number {
  const total = daysBetween(campaign.startDate, campaign.endDate)
  const passed = daysBetween(campaign.startDate, TODAY)
  return Math.max(0, Math.min(1, passed / total))
}

/** Stable pseudo-random number in 0..1 from a string and an index. */
function noise(seed: string, index: number): number {
  let hash = index + 7
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9973
  return hash / 9973
}

export interface KeywordPerformance {
  keyword: string
  spend: number
  clicks: number
  orders: number
}

/** Search-format results split by keyword. Popular keywords get more clicks; niche ones convert better. */
export function keywordPerformance(campaign: Campaign): KeywordPerformance[] {
  const search = performance(campaign).byFormat.filter((row) => row.format === 'search_ads' || row.format === 'search_banner')
  const clicks = search.reduce((sum, row) => sum + row.clicks, 0)
  const spend = search.reduce((sum, row) => sum + row.spend, 0)
  if (clicks === 0) return []
  const keywords = AUTO_KEYWORDS.filter((keyword) => !campaign.negativeKeywords.includes(keyword))
  const weights = keywords.map((_, i) => 1 / (i + 1.5))
  const total = weights.reduce((sum, w) => sum + w, 0)
  return keywords.map((keyword, i) => {
    const share = weights[i] / total
    const keywordClicks = Math.round(clicks * share)
    const orderRate = 0.08 + 0.22 * noise(keyword, i)
    return { keyword, spend: Math.round(spend * share), clicks: keywordClicks, orders: Math.round(keywordClicks * orderRate) }
  })
}
