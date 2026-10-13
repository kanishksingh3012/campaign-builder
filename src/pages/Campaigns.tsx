import { Button, Dropdown, Label, SearchField, Tabs, Tooltip } from '@heroui/react'
import { AlertTriangle, MoreHorizontal, OctagonAlert, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { alertFor } from '../lib/alerts'
import { inr } from '../lib/format'
import type { Campaign, CampaignStatus } from '../lib/types'
import { PageHeader } from '../shell/Layout'
import { StatusChip } from '../shell/StatusChip'
import { Bar, GoalTag } from '../shell/ui'
import { useStore } from '../state/store'

type Filter = 'all' | 'live' | 'attention' | 'in_review' | 'paused' | 'draft' | 'ended'

const FILTERS: { id: Filter; label: string; match: (c: Campaign) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'live', label: 'Live', match: (c) => c.status === 'live' },
  { id: 'attention', label: 'Needs attention', match: (c) => alertFor(c) !== null },
  { id: 'in_review', label: 'In review', match: (c) => c.status === 'in_review' },
  { id: 'paused', label: 'Paused', match: (c) => c.status === 'paused' },
  { id: 'draft', label: 'Draft', match: (c) => c.status === 'draft' },
  { id: 'ended', label: 'Ended', match: (c) => c.status === 'ended' },
]

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })

function actionsFor(status: CampaignStatus): { id: string; label: string }[] {
  const view = { id: 'view', label: 'View' }
  const duplicate = { id: 'duplicate', label: 'Duplicate' }
  switch (status) {
    case 'draft':
      return [{ id: 'edit', label: 'Continue editing' }, duplicate, { id: 'delete', label: 'Delete draft' }]
    case 'live':
      return [view, { id: 'edit', label: 'Edit' }, { id: 'pause', label: 'Pause' }, duplicate, { id: 'end', label: 'End now' }]
    case 'paused':
      return [view, { id: 'edit', label: 'Edit' }, { id: 'resume', label: 'Resume' }, duplicate, { id: 'end', label: 'End now' }]
    case 'rejected':
      return [view, { id: 'edit', label: 'Fix and resubmit' }, duplicate]
    default:
      return [view, duplicate]
  }
}

export function Campaigns() {
  const { campaigns, dispatch } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const match = FILTERS.find((f) => f.id === filter)!.match
    const text = query.trim().toLowerCase()
    return campaigns.filter((c) => match(c) && (!text || c.name.toLowerCase().includes(text)))
  }, [campaigns, filter, query])

  function run(action: string, campaign: Campaign) {
    const ids = [campaign.id]
    if (action === 'view') navigate(`/campaigns/${campaign.id}`)
    if (action === 'edit') navigate(`/campaigns/${campaign.id}/edit`)
    if (action === 'duplicate') navigate(`/campaigns/${campaign.goal === 'custom' ? 'custom/' : ''}new?from=${campaign.id}`)
    if (action === 'pause') dispatch({ type: 'set_status', ids, status: 'paused', note: 'Paused by you' })
    if (action === 'resume') dispatch({ type: 'set_status', ids, status: 'live', note: 'Resumed by you' })
    if (action === 'end') dispatch({ type: 'set_status', ids, status: 'ended', note: 'Ended early by you' })
    if (action === 'delete') dispatch({ type: 'remove', id: campaign.id })
  }

  const createButton = (
    <Button variant="primary" onPress={() => navigate('/campaigns/new')}>
      <Plus size={16} />
      Create campaign
    </Button>
  )

  return (
    <>
      <PageHeader title="Campaigns" subtitle={`${campaigns.length} campaigns across ${new Set(campaigns.map((c) => c.goal)).size} goals`} />

      <div className="mb-3 flex items-center justify-between gap-4">
        <Tabs selectedKey={filter} onSelectionChange={(key) => setFilter(key as Filter)}>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Filter by status">
              {FILTERS.map((f) => (
                <Tabs.Tab key={f.id} id={f.id} className="whitespace-nowrap">
                  {f.label}
                  <span className="tabular ml-1.5 text-xs text-muted">{campaigns.filter(f.match).length}</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        <SearchField aria-label="Search campaigns" value={query} onChange={setQuery} className="w-56">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search campaigns" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted">
              <th className="px-4 py-2.5 font-medium">Campaign</th>
              <th className="px-3 py-2.5 font-medium">Goal</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Schedule</th>
              <th className="w-56 px-3 py-2.5 font-medium">Budget used</th>
              <th className="w-12 px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((campaign) => {
              const alert = alertFor(campaign)
              const used = campaign.budget ? campaign.spent / campaign.budget : 0
              return (
                <tr key={campaign.id} className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary">
                  <td className="px-4 py-3">
                    <Link
                      to={campaign.status === 'draft' ? `/campaigns/${campaign.id}/edit` : `/campaigns/${campaign.id}`}
                      className="font-medium hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    {campaign.onBehalf && <span className="ml-2 text-xs text-muted">by your account manager</span>}
                    {alert && (
                      <p className={`mt-0.5 flex items-center gap-1 text-xs ${alert.severity === 'blocker' ? 'text-danger' : 'text-warning'}`}>
                        {alert.severity === 'blocker' ? <OctagonAlert size={12} /> : <AlertTriangle size={12} />}
                        {alert.message}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <GoalTag goal={campaign.goal} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusChip status={campaign.status} />
                  </td>
                  <td className="tabular px-3 py-3 whitespace-nowrap text-muted">
                    {DATE.format(new Date(campaign.startDate))} – {DATE.format(new Date(campaign.endDate))}
                  </td>
                  <td className="px-3 py-3">
                    <Bar value={used * 100} tone={campaign.status === 'out_of_budget' ? 'danger' : 'accent'} />
                    <p className="tabular mt-1 text-xs text-muted">
                      {inr(campaign.spent)} of {inr(campaign.budget)}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Dropdown>
                      <Tooltip delay={600}>
                        <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${campaign.name}`}>
                          <MoreHorizontal size={16} />
                        </Button>
                        <Tooltip.Content>Actions</Tooltip.Content>
                      </Tooltip>
                      <Dropdown.Popover placement="bottom end">
                        <Dropdown.Menu onAction={(key) => run(String(key), campaign)}>
                          {actionsFor(campaign.status).map((action) => (
                            <Dropdown.Item key={action.id} id={action.id} textValue={action.label}>
                              <Label>{action.label}</Label>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium">{campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match'}</p>
            <p className="mt-1 text-sm text-muted">
              {campaigns.length === 0 ? "Pick a goal and we'll set up the rest." : 'Try another filter or clear the search.'}
            </p>
            {campaigns.length === 0 && <div className="mt-4 flex justify-center">{createButton}</div>}
          </div>
        )}
      </div>
    </>
  )
}
