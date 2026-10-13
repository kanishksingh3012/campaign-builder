import { Button, Chip, Dropdown, Label } from '@heroui/react'
import { Check, Minus, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { BRAND, PRODUCTS } from '../data/catalogue'
import { FORMATS, GOALS } from '../data/goals'
import { alertFor } from '../lib/alerts'
import { bundleOf } from '../lib/bundle'
import { inr, percent } from '../lib/format'
import { totals } from '../lib/simulate'
import type { Campaign, FormatId } from '../lib/types'
import { PageHeader } from '../shell/Layout'
import { BannerArt, Panel, SimulatedNote, Stat } from '../shell/ui'
import { useStore } from '../state/store'

const CAMPAIGN_REASONS = ['a product is not eligible for ads in a selected city', 'keywords include a competitor brand name', 'budget source is not verified']
const CREATIVE_REASONS = ['text covers more than 30% of the image', 'a claim needs proof', 'image resolution is too low']

function RejectMenu({ label, reasons, onReject }: { label: string; reasons: string[]; onReject: (reason: string) => void }) {
  return (
    <Dropdown>
      <Button size="sm" variant="secondary">
        Reject
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label={`Reason for rejecting ${label}`} onAction={(key) => onReject(String(key))}>
          {reasons.map((reason) => (
            <Dropdown.Item key={reason} id={reason} textValue={reason}>
              <Label>{reason.charAt(0).toUpperCase() + reason.slice(1)}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

/** Automated checks shown to the reviewer, so a human only judges what a machine can't. */
function checks(campaign: Campaign, creativeStatus?: string): { label: string; state: 'pass' | 'fail' | 'na' }[] {
  const goal = GOALS[campaign.goal]
  const outOfStock = PRODUCTS.some((p) => campaign.productIds.includes(p.id) && !p.inStock && !campaign.pausedProductIds.includes(p.id))
  const needsCreative = bundleOf(campaign).some((item) => FORMATS[item.format].needsCreative)
  return [
    { label: `Budget meets the ${goal.name.toLowerCase()} minimum`, state: campaign.budget >= goal.minBudget ? 'pass' : 'fail' },
    { label: 'All products in stock', state: outOfStock ? 'fail' : 'pass' },
    { label: 'Creative approved', state: !needsCreative ? 'na' : creativeStatus === 'approved' ? 'pass' : 'fail' },
  ]
}

export function ReviewQueue() {
  const { campaigns, creatives, dispatch } = useStore()
  const waiting = campaigns.filter((c) => c.status === 'in_review')
  const waitingCreatives = creatives.filter((c) => c.status === 'in_review')

  return (
    <>
      <PageHeader title="Review queue" subtitle="Campaigns and creatives waiting for a decision. Automated checks run first; you judge the rest." />
      <div className="flex flex-col gap-4">
        <Panel title={`Campaigns (${waiting.length})`}>
          {waiting.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing waiting. New submissions appear here.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {waiting.map((campaign) => (
                <li key={campaign.id} className="grid grid-cols-[1fr_20rem_auto] items-center gap-6 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {campaign.name}
                      {campaign.onBehalf && <span className="ml-2 text-xs font-normal text-muted">created by account manager</span>}
                    </p>
                    <p className="tabular text-muted">
                      {BRAND} · {GOALS[campaign.goal].name} · {inr(campaign.budget)} · {campaign.startDate} to {campaign.endDate}
                    </p>
                    <p className="text-muted">{bundleOf(campaign).map((item) => FORMATS[item.format].name).join(', ')}</p>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {checks(campaign, creatives.find((c) => c.id === campaign.creativeId)?.status).map((check) => (
                      <li key={check.label} className={`flex items-center gap-2 ${check.state === 'fail' ? 'text-danger' : check.state === 'na' ? 'text-muted' : ''}`}>
                        {check.state === 'pass' ? <Check size={14} className="text-success" /> : check.state === 'fail' ? <X size={14} /> : <Minus size={14} />}
                        {check.label}
                        {check.state === 'na' && ' (not needed)'}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <RejectMenu label={campaign.name} reasons={CAMPAIGN_REASONS} onReject={(reason) => dispatch({ type: 'review_campaign', id: campaign.id, approve: false, reason })} />
                    <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'review_campaign', id: campaign.id, approve: true })}>
                      Approve
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`Creatives (${waitingCreatives.length})`}>
          {waitingCreatives.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No creatives waiting.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {waitingCreatives.map((creative) => (
                <li key={creative.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                  <BannerArt name={creative.name} className="h-14 w-36 shrink-0" />
                  <span className="flex-1">
                    <span className="font-medium">{creative.name}</span>
                    <span className="block text-muted">{BRAND}</span>
                  </span>
                  <RejectMenu label={creative.name} reasons={CREATIVE_REASONS} onReject={(reason) => dispatch({ type: 'review_creative', id: creative.id, approve: false, reason })} />
                  <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'review_creative', id: creative.id, approve: true })}>
                    Approve
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

// Other brands are static rows so the list reads like a real book of accounts.
const OTHER_ACCOUNTS = [
  { brand: 'Wafello', category: 'Snacks', spend: 912000, balance: 140000, live: 6, attention: 0 },
  { brand: 'Nutkart', category: 'Dry fruits', spend: 1480000, balance: 22000, live: 4, attention: 1 },
  { brand: 'Fizzup', category: 'Beverages', spend: 2310000, balance: 610000, live: 9, attention: 0 },
  { brand: 'Milleto', category: 'Health foods', spend: 86000, balance: 0, live: 0, attention: 2 },
  { brand: 'Glowly', category: 'Home', spend: 204000, balance: 95000, live: 2, attention: 0 },
]
const LOW_BALANCE = 50000

export function Accounts() {
  const navigate = useNavigate()
  const { campaigns, available, dispatch } = useStore()
  const mine = {
    brand: BRAND,
    category: 'Snacks',
    spend: totals(campaigns).spend,
    balance: available,
    live: campaigns.filter((c) => c.status === 'live').length,
    attention: campaigns.filter((c) => alertFor(c)).length,
  }
  const rows = [mine, ...OTHER_ACCOUNTS]
  const atRisk = rows.filter((r) => r.balance < LOW_BALANCE || r.attention > 0)

  return (
    <>
      <PageHeader title="Accounts" subtitle="Your brands, what they spend, and who needs a call today." />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="Brands" value={String(rows.length)} />
        <Stat label="Spend to date" value={inr(rows.reduce((sum, r) => sum + r.spend, 0))} />
        <Stat label="Need follow-up" value={String(atRisk.length)} note="Low balance or open issues" />
      </div>
      <Panel>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">Brand</th>
              <th className="px-3 py-2 text-right font-medium">Spend to date</th>
              <th className="px-3 py-2 text-right font-medium">Available balance</th>
              <th className="px-3 py-2 text-right font-medium">Live campaigns</th>
              <th className="px-3 py-2 font-medium">Health</th>
              <th className="py-2 pl-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map((row) => {
              const lowBalance = row.balance < LOW_BALANCE
              const isDemoBrand = row.brand === BRAND
              return (
                <tr key={row.brand} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium">{row.brand}</span>
                    <span className="block text-xs text-muted">{row.category}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">{inr(row.spend)}</td>
                  <td className="px-3 py-2.5 text-right">{inr(row.balance)}</td>
                  <td className="px-3 py-2.5 text-right">{row.live}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1.5">
                      {row.attention > 0 && (
                        <Chip size="sm" variant="soft" color="danger" className="whitespace-nowrap">
                          {row.attention} open issue{row.attention === 1 ? '' : 's'}
                        </Chip>
                      )}
                      {lowBalance && (
                        <Chip size="sm" variant="soft" color="warning" className="whitespace-nowrap">
                          Low balance
                        </Chip>
                      )}
                      {row.attention === 0 && !lowBalance && (
                        <Chip size="sm" variant="soft" color="success">
                          Healthy
                        </Chip>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    {isDemoBrand ? (
                      <span className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onPress={() => navigate('/campaigns/new')}>
                          Create campaign for them
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => {
                            dispatch({ type: 'set_role', role: 'brand' })
                            navigate('/')
                          }}
                        >
                          View as brand
                        </Button>
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Sample row</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>
      <SimulatedNote />
    </>
  )
}

// Share of each format's daily impressions that is sold. Illustrative.
const INVENTORY: { format: FormatId; daily: number; sold: number; ecpm: number }[] = [
  { format: 'search_ads', daily: 4200000, sold: 0.91, ecpm: 315 },
  { format: 'category_boost', daily: 3100000, sold: 0.78, ecpm: 150 },
  { format: 'home_banner', daily: 2600000, sold: 0.96, ecpm: 180 },
  { format: 'search_banner', daily: 1400000, sold: 0.54, ecpm: 240 },
  { format: 'cart_addon', daily: 900000, sold: 0.47, ecpm: 480 },
  { format: 'buy_again', daily: 700000, sold: 0.62, ecpm: 420 },
]
const UNDERSOLD = 0.65

export function Inventory() {
  const { campaigns } = useStore()
  const totalDaily = INVENTORY.reduce((sum, row) => sum + row.daily, 0)
  const fill = INVENTORY.reduce((sum, row) => sum + row.daily * row.sold, 0) / totalDaily
  const unsoldValue = INVENTORY.reduce((sum, row) => sum + ((row.daily * (1 - row.sold)) / 1000) * row.ecpm, 0)
  const usedBy = (format: FormatId) => campaigns.filter((c) => c.status === 'live' && bundleOf(c).some((item) => item.format === format)).length

  return (
    <>
      <PageHeader title="Inventory" subtitle="How much of each ad placement is sold. Bundles should fill gaps, not fight over what's already full." />
      <div className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="Fill rate, all formats" value={percent(fill)} note="Sold impressions ÷ available" />
        <Stat label="Unsold value per day" value={inr(unsoldValue)} note="At each format's current eCPM" />
        <Stat label="Under-sold formats" value={String(INVENTORY.filter((r) => r.sold < UNDERSOLD).length)} note={`Below ${percent(UNDERSOLD)} sold`} />
      </div>
      <Panel title="By format">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">Format</th>
              <th className="px-3 py-2 text-right font-medium">Daily impressions</th>
              <th className="w-64 px-3 py-2 font-medium">Sold</th>
              <th className="px-3 py-2 text-right font-medium">eCPM</th>
              <th className="px-3 py-2 text-right font-medium">Live campaigns using it</th>
              <th className="py-2 pl-3 font-medium">Read</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {INVENTORY.map((row) => {
              const under = row.sold < UNDERSOLD
              return (
                <tr key={row.format} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium">{FORMATS[row.format].name}</span>
                    <span className="block text-xs text-muted">{FORMATS[row.format].placement}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">{(row.daily / 100000).toFixed(0)} lakh</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-3">
                      <span className="h-2 flex-1 rounded-full bg-default">
                        <span className={`block h-2 rounded-full ${under ? 'bg-warning' : 'bg-accent'}`} style={{ width: `${row.sold * 100}%` }} />
                      </span>
                      <span className="w-9 text-right">{percent(row.sold)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">{inr(row.ecpm)}</td>
                  <td className="px-3 py-2.5 text-right">{usedBy(row.format)}</td>
                  <td className="py-2.5 pl-3">
                    <Chip size="sm" variant="soft" color={under ? 'warning' : row.sold > 0.9 ? 'danger' : 'success'} className="whitespace-nowrap">
                      {under ? 'Room to sell' : row.sold > 0.9 ? 'Nearly full' : 'Balanced'}
                    </Chip>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-muted">
          Why this matters for bundles: the win-back bundle uses cart add-on and buy again, two of the three under-sold formats, so selling it adds revenue without crowding search. An
          awareness bundle leans on home banner, which is nearly full.{' '}
          <Link to="/preview" className="font-medium text-accent hover:underline">
            See the shopper-side trade-off
          </Link>
        </p>
      </Panel>
      <SimulatedNote />
    </>
  )
}
