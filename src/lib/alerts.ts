import { PRODUCTS } from '../data/catalogue'
import type { Campaign, CampaignStatus } from './types'

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  live: 'Live',
  paused: 'Paused',
  out_of_budget: 'Out of budget',
  rejected: 'Rejected',
  ended: 'Ended',
}

export interface CampaignAlert {
  campaignId: string
  severity: 'blocker' | 'warning'
  message: string
  action: string
}

/** Products in a campaign that are out of stock and not deliberately kept paused. */
export function outOfStock(campaign: Campaign): string[] {
  return PRODUCTS.filter(
    (p) => campaign.productIds.includes(p.id) && !p.inStock && !campaign.pausedProductIds.includes(p.id),
  ).map((p) => p.name)
}

/** What needs the advertiser's attention on a campaign, with the next step to offer. */
export function alertFor(campaign: Campaign): CampaignAlert | null {
  const base = { campaignId: campaign.id }
  if (campaign.status === 'out_of_budget') {
    return { ...base, severity: 'blocker', message: 'Out of budget before its end date', action: 'Add budget' }
  }
  if (campaign.status === 'rejected') {
    return campaign.rejectionReason
      ? { ...base, severity: 'blocker', message: `Rejected in review: ${campaign.rejectionReason}`, action: 'Edit and resubmit' }
      : { ...base, severity: 'blocker', message: 'Creative rejected in review', action: 'Fix creative' }
  }
  if (campaign.status === 'live') {
    const missing = outOfStock(campaign)
    if (missing.length) {
      return {
        ...base,
        severity: 'warning',
        message: `${missing.length} product${missing.length === 1 ? '' : 's'} out of stock`,
        action: 'Review',
      }
    }
  }
  return null
}
