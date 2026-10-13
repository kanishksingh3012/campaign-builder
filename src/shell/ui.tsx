import { Button, Dropdown, Label } from '@heroui/react'
import type { ReactNode } from 'react'
import { inr } from '../lib/format'
import type { Campaign } from '../lib/types'
import { useStore } from '../state/store'

export function Panel({ title, hint, aside, children, className = '' }: { title?: string; hint?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 ${className}`}>
      {(title || aside) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  )
}

export const SimulatedNote = () => <p className="mt-4 text-xs text-muted">All figures on this page are simulated.</p>

const TOP_UPS = [25000, 50000, 100000]

/** Top up a campaign from the account's available balance. */
export function AddBudgetMenu({ campaign, variant = 'secondary' }: { campaign: Campaign; variant?: 'primary' | 'secondary' }) {
  const { available, dispatch } = useStore()
  return (
    <Dropdown>
      <Button size="sm" variant={variant}>
        Add budget
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label={`Add budget to ${campaign.name}`}
          disabledKeys={TOP_UPS.filter((amount) => amount > available).map(String)}
          onAction={(key) => dispatch({ type: 'add_budget', id: campaign.id, amount: Number(key) })}
        >
          {TOP_UPS.map((amount) => (
            <Dropdown.Item key={amount} id={String(amount)} textValue={inr(amount)}>
              <Label>
                Add {inr(amount)}
                {amount > available && ' (more than available)'}
              </Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
