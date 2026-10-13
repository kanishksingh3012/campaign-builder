import { Button, Dropdown, Label } from '@heroui/react'
import {
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Eraser,
  Image,
  Layers,
  LayoutDashboard,
  Megaphone,
  Moon,
  Plus,
  RotateCcw,
  Smartphone,
  Sun,
  Tag,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { APP_NAME, BRAND } from '../data/catalogue'
import { inr } from '../lib/format'
import { useStore } from '../state/store'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const BRAND_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Run',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard },
      { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
      { to: '/offers', label: 'Offers', icon: Tag },
      { to: '/creatives', label: 'Creatives', icon: Image },
    ],
  },
  {
    group: 'Measure',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/budget', label: 'Budget', icon: Wallet },
    ],
  },
  { group: 'Understand', items: [{ to: '/preview', label: 'Shopper preview', icon: Smartphone }] },
]

// The internal view uses the same shell and page pattern, so brand and internal tools read as one product.
const INTERNAL_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Operate',
    items: [
      { to: '/internal/review', label: 'Review queue', icon: ClipboardCheck },
      { to: '/internal/accounts', label: 'Accounts', icon: Building2 },
      { to: '/internal/inventory', label: 'Inventory', icon: Layers },
    ],
  },
  { group: 'Understand', items: [{ to: '/preview', label: 'Shopper preview', icon: Smartphone }] },
]

const THEME_KEY = 'endcap:theme'
type Theme = 'light' | 'dark'

/** Light or dark, remembered per browser; the first visit follows the system setting. */
function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      // Storage unavailable: fall through to the system setting.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Not remembered this session; the toggle still works.
    }
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

export function Layout({ children }: { children: ReactNode }) {
  const [theme, toggleTheme] = useTheme()
  const { available, dispatch, role, campaigns, creatives } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // An internal page opened by link shows the internal menu, whatever view was last used.
  // Checked once per page change only, so switching back to the brand view isn't undone mid-navigation.
  const checkedPath = useRef<string | null>(null)
  useEffect(() => {
    if (checkedPath.current === pathname) return
    checkedPath.current = pathname
    if (pathname.startsWith('/internal') && role !== 'internal') dispatch({ type: 'set_role', role: 'internal' })
  }, [pathname, role, dispatch])
  const nav = role === 'internal' ? INTERNAL_NAV : BRAND_NAV
  const waiting = campaigns.filter((c) => c.status === 'in_review').length + creatives.filter((c) => c.status === 'in_review').length
  const switchTo = (next: typeof role) => {
    dispatch({ type: 'set_role', role: next })
    navigate(next === 'internal' ? '/internal/review' : '/')
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 shrink-0 flex-col bg-ink px-3 py-4 text-ink-text">
        <div className="flex items-center gap-2.5 px-2 pb-6">
          <span className="grid size-8 place-items-center rounded-[0.6rem] bg-accent text-accent-foreground" aria-hidden>
            <EndcapMark />
          </span>
          <span className="text-[0.95rem] font-semibold tracking-tight text-white">{APP_NAME}</span>
        </div>

        <nav className="flex flex-col gap-5" aria-label="Main">
          {nav.map(({ group, items }) => (
            <div key={group}>
              <p className="mb-1 px-2.5 text-xs text-ink-muted">{group}</p>
              <div className="flex flex-col gap-0.5">
                {items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        isActive ? 'bg-ink-raised font-medium text-white' : 'hover:bg-ink-raised/60 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} strokeWidth={1.75} className={isActive ? 'text-accent' : 'text-ink-muted group-hover:text-ink-text'} />
                        {label}
                        {to === '/internal/review' && waiting > 0 && (
                          <span className="tabular ml-auto rounded-full bg-accent px-1.5 text-xs font-medium text-accent-foreground">{waiting}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-ink-line pt-3">
          <p className="px-2.5 pb-1 text-xs text-ink-muted">Demo controls</p>
          <SidebarAction icon={RotateCcw} label="Reset demo data" onPress={() => dispatch({ type: 'reset' })} />
          <SidebarAction icon={Eraser} label="Start as a new account" onPress={() => dispatch({ type: 'clear' })} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-8">
          <div role="radiogroup" aria-label="View as" className="flex rounded-full bg-default p-0.5 text-sm">
            {(['brand', 'internal'] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={role === option}
                onClick={() => switchTo(option)}
                className={`rounded-full px-3.5 py-1 transition-colors ${
                  role === option ? 'bg-surface font-medium shadow-card' : 'text-muted hover:text-foreground'
                }`}
              >
                {option === 'brand' ? 'Brand view' : 'Internal view'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {role === 'brand' ? (
              <NavLink to="/budget" className="tabular flex items-baseline gap-2 text-sm hover:underline">
                <span className="text-muted">Available</span>
                <span className="font-semibold">{inr(available)}</span>
              </NavLink>
            ) : (
              <span className="text-sm text-muted">Ads ops and sales</span>
            )}
            <Button isIconOnly variant="ghost" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onPress={toggleTheme}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <Dropdown>
              <Button variant="primary">
                <Plus size={16} />
                Create
                <ChevronDown size={14} />
              </Button>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu aria-label="Create" onAction={(key) => navigate(String(key))}>
                  <Dropdown.Item id="/campaigns/new" textValue="Goal-based campaign">
                    <Label>Goal-based campaign{role === 'internal' && ` for ${BRAND}`}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="/campaigns/custom/new" textValue="Custom campaign">
                    <Label>Custom campaign</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="/offers/new" textValue="Offer">
                    <Label>Offer</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
            <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-foreground" title={role === 'brand' ? BRAND : 'Internal team'}>
              {role === 'brand' ? 'CC' : 'IN'}
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl min-w-[60rem] px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

function SidebarAction({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <button type="button" onClick={onPress} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-ink-raised/60 hover:text-white">
      <Icon size={14} />
      {label}
    </button>
  )
}

/** The mark: shelves seen from the aisle, with the end display picked out. */
function EndcapMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="3" width="8" height="2.5" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="2" y="7.75" width="8" height="2.5" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="2" y="12.5" width="8" height="2.5" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="12" y="3" width="4" height="12" rx="1.25" fill="currentColor" />
    </svg>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
