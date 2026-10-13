import { Button } from '@heroui/react'
import { BarChart3, Building2, ClipboardCheck, Eraser, Image, Layers, LayoutDashboard, Megaphone, RotateCcw, Smartphone, Tag, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { APP_NAME, BRAND } from '../data/catalogue'
import { inr } from '../lib/format'
import { useStore } from '../state/store'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/offers', label: 'Offers', icon: Tag },
  { to: '/creatives', label: 'Creatives', icon: Image },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/preview', label: 'Shopper preview', icon: Smartphone },
]

// The internal view uses the same shell and page pattern, so brand and internal tools read as one product.
const INTERNAL_NAV = [
  { to: '/internal/review', label: 'Review queue', icon: ClipboardCheck },
  { to: '/internal/accounts', label: 'Accounts', icon: Building2 },
  { to: '/internal/inventory', label: 'Inventory', icon: Layers },
  { to: '/preview', label: 'Shopper preview', icon: Smartphone },
]

export function Layout({ children }: { children: ReactNode }) {
  const { available, dispatch, role, campaigns, creatives } = useStore()
  const navigate = useNavigate()
  const nav = role === 'internal' ? INTERNAL_NAV : NAV
  const waiting = campaigns.filter((c) => c.status === 'in_review').length + creatives.filter((c) => c.status === 'in_review').length
  const switchTo = (next: typeof role) => {
    dispatch({ type: 'set_role', role: next })
    navigate(next === 'internal' ? '/internal/review' : '/')
  }
  return (
    <div className="flex h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-4">
        <div className="flex items-center gap-2 px-2 pb-5">
          <span className="grid size-7 place-items-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
            {APP_NAME[0]}
          </span>
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </div>
        <div role="radiogroup" aria-label="View as" className="mb-4 flex rounded-xl border border-border p-0.5 text-xs">
          {(['brand', 'internal'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={role === option}
              onClick={() => switchTo(option)}
              className={`flex-1 rounded-lg px-2 py-1.5 transition-colors ${role === option ? 'bg-accent-soft font-medium text-accent-soft-foreground' : 'text-muted hover:text-foreground'}`}
            >
              {option === 'brand' ? 'Brand' : 'Internal'}
            </button>
          ))}
        </div>
        <nav className="flex flex-col gap-0.5" aria-label="Main">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  isActive ? 'bg-accent-soft font-medium text-accent-soft-foreground' : 'text-muted hover:bg-default hover:text-foreground'
                }`
              }
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
              {to === '/internal/review' && waiting > 0 && <span className="tabular ml-auto text-xs">{waiting}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-xl border border-border px-3 py-2.5">
            {role === 'internal' ? (
              <>
                <p className="text-sm font-medium">Ads ops and sales</p>
                <p className="mt-1 text-xs text-muted">Internal view of {BRAND} and other brands</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">{BRAND}</p>
                <p className="mt-1 text-xs text-muted">Available balance</p>
                <p className="tabular text-sm font-semibold">{inr(available)}</p>
              </>
            )}
          </div>
          <Button size="sm" variant="ghost" className="justify-start text-muted" onPress={() => dispatch({ type: 'reset' })}>
            <RotateCcw size={14} />
            Reset demo data
          </Button>
          <Button size="sm" variant="ghost" className="-mt-2 justify-start text-muted" onPress={() => dispatch({ type: 'clear' })}>
            <Eraser size={14} />
            Start as a new account
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl min-w-[60rem] px-8 py-6">{children}</div>
      </main>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
