import { Button, Dropdown, Label } from '@heroui/react'
import { Megaphone, Package, RotateCcw, SlidersHorizontal, UserPlus, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { GOALS } from '../data/goals'
import { inr } from '../lib/format'
import type { Campaign, GoalId } from '../lib/types'
import { useStore } from '../state/store'

export function Panel({ title, hint, aside, children, className = '' }: { title?: string; hint?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${className}`}>
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
    <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-card">
      <p className="text-xs text-muted">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  )
}

export const SimulatedNote = () => <p className="mt-4 text-xs text-muted">All figures on this page are simulated.</p>

export const GOAL_ICON: Record<GoalId, LucideIcon> = {
  awareness: Megaphone,
  new_customers: UserPlus,
  win_back: RotateCcw,
  custom: SlidersHorizontal,
}

/** Sets the goal's hue on an element, for the `.goal-*` classes. */
export const goalStyle = (goal: GoalId) => ({ '--goal': `var(--goal-${goal})` }) as CSSProperties

/** The goal's name in its own colour, so a goal is recognisable at a glance anywhere in the app. */
export function GoalTag({ goal, size = 'sm' }: { goal: GoalId; size?: 'sm' | 'md' }) {
  const Icon = GOAL_ICON[goal]
  return (
    <span
      style={goalStyle(goal)}
      className={`goal-soft inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}`}
    >
      <Icon size={size === 'sm' ? 12 : 14} strokeWidth={2} />
      {GOALS[goal].name}
    </span>
  )
}

/** A tinted product tile; the hue comes from the brand name so each brand keeps its colour. */
export function Thumb({ seed, className = 'h-16' }: { seed: string; className?: string }) {
  let hue = 0
  for (const char of seed) hue = (hue * 31 + char.charCodeAt(0)) % 360
  return (
    <span
      aria-hidden
      className={`grid place-items-center rounded-lg ${className}`}
      style={{ background: `oklch(0.94 0.045 ${hue})`, color: `oklch(0.52 0.11 ${hue})` }}
    >
      <Package size={22} strokeWidth={1.5} />
    </span>
  )
}

/** A stand-in banner creative: a flat colour block with the headline, hue taken from the name. */
export function BannerArt({ name, className = 'h-28' }: { name: string; className?: string }) {
  let hue = 0
  for (const char of name) hue = (hue * 31 + char.charCodeAt(0)) % 360
  return (
    <span
      aria-hidden
      className={`flex flex-col justify-end overflow-hidden rounded-xl px-3 py-2.5 ${className}`}
      style={{ background: `oklch(0.9 0.075 ${hue})`, color: `oklch(0.32 0.09 ${hue})` }}
    >
      <span className="text-xs opacity-75">Crisp &amp; Co</span>
      <span className="truncate text-sm font-semibold">{name}</span>
    </span>
  )
}

/** A number that glides to its new value, so the effect of a control is felt as well as read. */
export function AnimatedNumber({ value, format }: { value: number; format: (value: number) => string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = value
      return setShown(value)
    }
    const start = performance.now()
    const origin = from.current
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 420)
      const eased = 1 - Math.pow(1 - t, 4)
      const current = origin + (value - origin) * eased
      from.current = current
      setShown(current)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{format(shown)}</>
}

/** A horizontal bar whose fill animates to its width. */
export function Bar({ value, tone = 'accent', className = '' }: { value: number; tone?: 'accent' | 'danger' | 'warning' | 'success'; className?: string }) {
  const fill = { accent: 'bg-accent', danger: 'bg-danger', warning: 'bg-warning', success: 'bg-success' }[tone]
  return (
    <span className={`block h-1.5 overflow-hidden rounded-full bg-default ${className}`}>
      <span className={`bar-fill block h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  )
}

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
