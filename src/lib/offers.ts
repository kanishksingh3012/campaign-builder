import { TODAY } from '../data/campaigns'
import { daysBetween, inr } from './format'
import type { Product } from './types'
import { addDays } from './validate'

// Brand-funded offers a brand can configure without an app release: the app already knows how to
// render these three templates, so an offer is only data.

export type OfferTemplate = 'bxgy' | 'percent' | 'bundle'
export type OfferStatus = 'draft' | 'scheduled' | 'live' | 'paused' | 'ended'

export interface Offer {
  id: string
  name: string
  template: OfferTemplate
  productIds: string[]
  /** Buy X get Y free. */
  buyQty: number
  getQty: number
  /** Percent off each unit. */
  percent: number
  /** Price for all selected products together. */
  bundlePrice: number
  /** Most the brand will fund in discounts before the offer stops. */
  budgetCap: number
  /** Discounts funded so far. Simulated. */
  funded: number
  cityIds: string[]
  startDate: string
  endDate: string
  status: OfferStatus
}

export interface OfferIssue {
  code: string
  field: 'products' | 'terms' | 'budget' | 'schedule' | 'cities'
  severity: 'blocker' | 'warning'
  message: string
  fixes: { label: string; apply: (offer: Offer) => Offer }[]
}

export const TEMPLATES: Record<OfferTemplate, { name: string; example: string; needs: string }> = {
  bxgy: { name: 'Buy X, get Y free', example: 'Buy 2, get 1 free', needs: 'One product' },
  percent: { name: 'Percent off', example: '20% off', needs: 'One or more products' },
  bundle: { name: 'Bundle price', example: 'Any 3 for ₹99', needs: 'Two or more products' },
}

/** Deepest discount the platform lets a brand run. */
export const MAX_PERCENT = 50
/** Below this, shoppers rarely notice the offer. */
export const MIN_PERCENT = 5
export const MIN_BUDGET_CAP = 10000
export const MAX_DAYS = 30

const chosen = (offer: Offer, products: Product[]) => products.filter((p) => offer.productIds.includes(p.id))

/** What the shopper sees on the product card. */
export function offerLabel(offer: Offer): string {
  if (offer.template === 'bxgy') return `Buy ${offer.buyQty}, get ${offer.getQty} free`
  if (offer.template === 'percent') return `${offer.percent}% off`
  return `${offer.productIds.length} for ${inr(offer.bundlePrice)}`
}

/** One redemption as a cart would show it. */
export function redemption(offer: Offer, products: Product[]): { units: number; full: number; pays: number; saves: number } {
  const items = chosen(offer, products)
  if (items.length === 0) return { units: 0, full: 0, pays: 0, saves: 0 }
  if (offer.template === 'bxgy') {
    const price = items[0].price
    const units = offer.buyQty + offer.getQty
    return { units, full: units * price, pays: offer.buyQty * price, saves: offer.getQty * price }
  }
  if (offer.template === 'percent') {
    const full = items.reduce((sum, p) => sum + p.price, 0) / items.length
    const saves = Math.round((full * offer.percent) / 100)
    return { units: 1, full: Math.round(full), pays: Math.round(full) - saves, saves }
  }
  const full = items.reduce((sum, p) => sum + p.price, 0)
  return { units: items.length, full, pays: offer.bundlePrice, saves: Math.max(0, full - offer.bundlePrice) }
}

/** Share of the shelf price the shopper keeps, 0 to 1. */
export function depth(offer: Offer, products: Product[]): number {
  const r = redemption(offer, products)
  return r.full ? r.saves / r.full : 0
}

/** How many times the offer can be redeemed before the budget cap stops it. */
export function redemptionsCovered(offer: Offer, products: Product[]): number {
  const saves = redemption(offer, products).saves
  return saves > 0 ? Math.floor(offer.budgetCap / saves) : 0
}

export function validateOffer(offer: Offer, products: Product[], others: Offer[]): OfferIssue[] {
  const issues: OfferIssue[] = []
  const items = chosen(offer, products)

  if (items.length === 0) {
    issues.push({ code: 'no_products', field: 'products', severity: 'blocker', message: 'Choose the products this offer applies to.', fixes: [] })
  } else if (offer.template === 'bxgy' && items.length > 1) {
    issues.push({
      code: 'bxgy_one_product', field: 'products', severity: 'blocker',
      message: '"Buy X, get Y" works on one product at a time, so the free item is never in doubt.',
      fixes: [{ label: `Keep only ${items[0].name}`, apply: (o) => ({ ...o, productIds: [items[0].id] }) }],
    })
  } else if (offer.template === 'bundle' && items.length < 2) {
    issues.push({ code: 'bundle_two_products', field: 'products', severity: 'blocker', message: 'A bundle needs at least two products.', fixes: [] })
  }
  for (const product of items.filter((p) => !p.inStock)) {
    issues.push({
      code: `out_of_stock:${product.id}`, field: 'products', severity: 'warning',
      message: `${product.name} is out of stock. Shoppers would see an offer they can't use.`,
      fixes: [{ label: 'Remove', apply: (o) => ({ ...o, productIds: o.productIds.filter((id) => id !== product.id) }) }],
    })
  }

  // Terms
  if (offer.template === 'bxgy') {
    if (offer.buyQty < 1 || offer.getQty < 1) {
      issues.push({
        code: 'bxgy_quantities', field: 'terms', severity: 'blocker', message: 'Both quantities must be at least 1.',
        fixes: [{ label: 'Use buy 2, get 1', apply: (o) => ({ ...o, buyQty: 2, getQty: 1 }) }],
      })
    } else if (offer.getQty > offer.buyQty) {
      issues.push({
        code: 'bxgy_too_generous', field: 'terms', severity: 'blocker',
        message: `Giving away ${offer.getQty} for every ${offer.buyQty} bought is more than ${MAX_PERCENT}% off, the deepest discount allowed.`,
        fixes: [{ label: `Set free items to ${offer.buyQty}`, apply: (o) => ({ ...o, getQty: o.buyQty }) }],
      })
    }
  }
  if (offer.template === 'percent') {
    if (offer.percent > MAX_PERCENT) {
      issues.push({
        code: 'percent_too_deep', field: 'terms', severity: 'blocker', message: `The deepest discount allowed is ${MAX_PERCENT}%.`,
        fixes: [{ label: `Set to ${MAX_PERCENT}%`, apply: (o) => ({ ...o, percent: MAX_PERCENT }) }],
      })
    } else if (offer.percent < MIN_PERCENT) {
      issues.push({
        code: 'percent_too_small', field: 'terms', severity: offer.percent <= 0 ? 'blocker' : 'warning',
        message: offer.percent <= 0 ? 'Enter a discount.' : `Shoppers rarely notice less than ${MIN_PERCENT}% off.`,
        fixes: [{ label: `Set to ${MIN_PERCENT}%`, apply: (o) => ({ ...o, percent: MIN_PERCENT }) }],
      })
    }
  }
  if (offer.template === 'bundle' && items.length >= 2) {
    const full = items.reduce((sum, p) => sum + p.price, 0)
    const tenOff = Math.round(full * 0.9)
    if (offer.bundlePrice >= full || offer.bundlePrice <= 0) {
      issues.push({
        code: 'bundle_no_saving', field: 'terms', severity: 'blocker',
        message: `Bought separately these cost ${inr(full)}. The bundle price has to be lower.`,
        fixes: [{ label: `Set to ${inr(tenOff)} (10% off)`, apply: (o) => ({ ...o, bundlePrice: tenOff }) }],
      })
    } else if (offer.bundlePrice < full * (1 - MAX_PERCENT / 100)) {
      const floor = Math.ceil(full * (1 - MAX_PERCENT / 100))
      issues.push({
        code: 'bundle_too_deep', field: 'terms', severity: 'blocker',
        message: `That is more than ${MAX_PERCENT}% off the ${inr(full)} shelf price.`,
        fixes: [{ label: `Set to ${inr(floor)}`, apply: (o) => ({ ...o, bundlePrice: floor }) }],
      })
    }
  }

  // Budget cap
  if (offer.budgetCap < MIN_BUDGET_CAP) {
    issues.push({
      code: 'cap_too_low', field: 'budget', severity: 'blocker',
      message: `Set a cap of at least ${inr(MIN_BUDGET_CAP)}, so the offer doesn't end within hours.`,
      fixes: [{ label: `Set to ${inr(MIN_BUDGET_CAP)}`, apply: (o) => ({ ...o, budgetCap: MIN_BUDGET_CAP }) }],
    })
  }

  if (offer.cityIds.length === 0) {
    issues.push({ code: 'no_cities', field: 'cities', severity: 'blocker', message: 'Choose at least one city.', fixes: [] })
  }

  // Schedule
  if (offer.endDate < offer.startDate) {
    issues.push({
      code: 'dates_reversed', field: 'schedule', severity: 'blocker', message: 'End date is before the start date.',
      fixes: [{ label: 'Swap dates', apply: (o) => ({ ...o, startDate: o.endDate, endDate: o.startDate }) }],
    })
  } else {
    if (offer.startDate < TODAY && offer.status === 'draft') {
      issues.push({
        code: 'starts_in_past', field: 'schedule', severity: 'blocker', message: 'The start date has already passed.',
        fixes: [{ label: 'Start today', apply: (o) => ({ ...o, startDate: TODAY }) }],
      })
    }
    if (daysBetween(offer.startDate, offer.endDate) > MAX_DAYS) {
      issues.push({
        code: 'too_long', field: 'schedule', severity: 'warning',
        message: `Offers longer than ${MAX_DAYS} days stop feeling like offers and reset the price shoppers expect.`,
        fixes: [{ label: `Shorten to ${MAX_DAYS} days`, apply: (o) => ({ ...o, endDate: addDays(o.startDate, MAX_DAYS - 1) }) }],
      })
    }
    const clash = others.find(
      (other) =>
        other.id !== offer.id &&
        ['live', 'scheduled', 'paused'].includes(other.status) &&
        other.startDate <= offer.endDate &&
        other.endDate >= offer.startDate &&
        other.cityIds.some((id) => offer.cityIds.includes(id)) &&
        other.productIds.some((id) => offer.productIds.includes(id)),
    )
    if (clash) {
      const shared = items.filter((p) => clash.productIds.includes(p.id))
      const fixes: OfferIssue['fixes'] = [{
        label: 'Start after it ends',
        apply: (o) => {
          const length = daysBetween(o.startDate, o.endDate)
          const start = addDays(clash.endDate, 1)
          return { ...o, startDate: start, endDate: addDays(start, length - 1) }
        },
      }]
      if (shared.length < items.length) {
        fixes.push({ label: `Remove ${shared.map((p) => p.name).join(', ')}`, apply: (o) => ({ ...o, productIds: o.productIds.filter((id) => !clash.productIds.includes(id)) }) })
      }
      issues.push({
        code: 'offer_overlap', field: 'schedule', severity: 'blocker',
        message: `${shared.map((p) => p.name).join(', ')} already ${shared.length === 1 ? 'has' : 'have'} "${clash.name}" running then. Two offers on one product would stack.`,
        fixes,
      })
    }
  }
  return issues
}

/** A new offer goes live straight away when its start date is today; otherwise it waits. */
export function publishedStatus(offer: Offer): OfferStatus {
  return offer.startDate <= TODAY ? 'live' : 'scheduled'
}

export const SEED_OFFERS: Offer[] = [
  { id: 'off1', name: 'Diwali party pack deal', template: 'percent', productIds: ['p7'], buyQty: 2, getQty: 1, percent: 15, bundlePrice: 0, budgetCap: 60000, funded: 41200, cityIds: ['blr', 'mum', 'del'], startDate: '2026-10-05', endDate: '2026-10-21', status: 'live' },
  { id: 'off2', name: 'Classic Salted 2+1', template: 'bxgy', productIds: ['p1'], buyQty: 2, getQty: 1, percent: 0, bundlePrice: 0, budgetCap: 30000, funded: 0, cityIds: ['blr'], startDate: '2026-10-20', endDate: '2026-10-31', status: 'scheduled' },
  { id: 'off3', name: 'Monsoon snack trio', template: 'bundle', productIds: ['p2', 'p4', 'p5'], buyQty: 2, getQty: 1, percent: 0, bundlePrice: 79, budgetCap: 25000, funded: 25000, cityIds: ['mum', 'pun'], startDate: '2026-08-12', endDate: '2026-09-05', status: 'ended' },
]

export function blankOffer(): Offer {
  return {
    id: `off-${Date.now()}`, name: '', template: 'percent', productIds: [], buyQty: 2, getQty: 1, percent: 15, bundlePrice: 0,
    budgetCap: 25000, funded: 0, cityIds: ['blr'], startDate: TODAY, endDate: addDays(TODAY, 9), status: 'draft',
  }
}
