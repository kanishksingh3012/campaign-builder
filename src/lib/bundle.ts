import { AUDIENCES, CITIES, CUSTOM_FLOOR, GOALS } from '../data/goals'
import type { BundleItem, Draft } from './types'

type HasBundle = Pick<Draft, 'goal' | 'custom'>

/** The formats a campaign runs on: fixed by its goal, or hand-picked for a custom campaign. */
export function bundleOf(source: HasBundle): BundleItem[] {
  if (!source.goal) return []
  if (source.goal !== 'custom') return GOALS[source.goal].bundle
  const formats = source.custom?.formats ?? []
  const even = formats.length ? Math.floor(100 / formats.length) : 0
  return formats.map((format, i) => ({
    format,
    reason: '',
    floor: CUSTOM_FLOOR[format],
    // The first format takes the rounding leftover so shares total 100.
    share: i === 0 ? 100 - even * (formats.length - 1) : even,
  }))
}

/** Shoppers the campaign can reach. Combined audiences are a union, never more than everyone. */
export function audienceSize(source: HasBundle & Pick<Draft, 'cityIds'>): number {
  if (!source.goal) return 0
  const shoppers = CITIES.filter((city) => source.cityIds.includes(city.id)).reduce((sum, city) => sum + city.shoppers, 0)
  if (source.goal !== 'custom') return shoppers * GOALS[source.goal].audienceShare
  const chosen = AUDIENCES.filter((audience) => source.custom?.audiences.includes(audience.id))
  if (chosen.some((audience) => audience.id === 'all')) return shoppers
  // The three purchase-history audiences don't overlap, so their union is the sum.
  return shoppers * Math.min(1, chosen.reduce((sum, audience) => sum + audience.share, 0))
}
