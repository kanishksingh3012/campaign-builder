import { Chip } from '@heroui/react'
import { STATUS_LABEL } from '../lib/alerts'
import type { CampaignStatus } from '../lib/types'

const COLOR: Record<CampaignStatus, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  draft: 'default',
  in_review: 'accent',
  live: 'success',
  paused: 'warning',
  out_of_budget: 'danger',
  rejected: 'danger',
  ended: 'default',
}

export function StatusChip({ status }: { status: CampaignStatus }) {
  return (
    <Chip size="sm" variant="soft" color={COLOR[status]} className="whitespace-nowrap">
      {STATUS_LABEL[status]}
    </Chip>
  )
}
