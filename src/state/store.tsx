import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { ACCOUNT_BALANCE, SEED_CAMPAIGNS, TODAY } from '../data/campaigns'
import { CREATIVES, PRODUCTS } from '../data/catalogue'
import type { Campaign, CampaignStatus, Creative } from '../lib/types'
import type { ValidationContext } from '../lib/validate'

const STORAGE_KEY = 'campaign-builder:v2'

/** Who is looking: the advertiser, or the platform's own ops and sales team. */
export type Role = 'brand' | 'internal'

interface State {
  campaigns: Campaign[]
  creatives: Creative[]
  balance: number
  role: Role
}

type Action =
  | { type: 'upsert'; campaign: Campaign }
  | { type: 'set_status'; ids: string[]; status: CampaignStatus; note: string }
  | { type: 'add_budget'; id: string; amount: number }
  | { type: 'remove'; id: string }
  | { type: 'set_creative_status'; id: string; status: Creative['status'] }
  | { type: 'set_role'; role: Role }
  | { type: 'review_campaign'; id: string; approve: boolean; reason?: string }
  | { type: 'review_creative'; id: string; approve: boolean; reason?: string }
  | { type: 'auto_approve'; id: string }
  | { type: 'reset' }
  | { type: 'clear' }

const initialState: State = { campaigns: SEED_CAMPAIGNS, creatives: CREATIVES, balance: ACCOUNT_BALANCE, role: 'brand' }

const log = (campaign: Campaign, text: string): Campaign['activity'] => [...campaign.activity, { date: TODAY, text }]

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'upsert': {
      const exists = state.campaigns.some((c) => c.id === action.campaign.id)
      const campaigns = exists
        ? state.campaigns.map((c) => (c.id === action.campaign.id ? action.campaign : c))
        : [action.campaign, ...state.campaigns]
      return { ...state, campaigns }
    }
    case 'set_status':
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          action.ids.includes(c.id)
            ? { ...c, status: action.status, activity: [...c.activity, { date: TODAY, text: action.note }] }
            : c,
        ),
      }
    case 'add_budget':
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          c.id === action.id
            ? {
                ...c,
                budget: c.budget + action.amount,
                status: c.status === 'out_of_budget' ? 'live' : c.status,
                activity: [...c.activity, { date: TODAY, text: `Budget raised by ₹${action.amount.toLocaleString('en-IN')}` }],
              }
            : c,
        ),
      }
    case 'set_creative_status':
      return {
        ...state,
        creatives: state.creatives.map((c) => (c.id === action.id ? { ...c, status: action.status } : c)),
        // A campaign rejected only for its creative goes live once that creative is approved.
        campaigns: state.campaigns.map((c) =>
          action.status === 'approved' && c.status === 'rejected' && c.creativeId === action.id
            ? { ...c, status: 'live', activity: [...c.activity, { date: TODAY, text: 'Creative approved; campaign approved and live' }] }
            : c,
        ),
      }
    case 'remove':
      return { ...state, campaigns: state.campaigns.filter((c) => c.id !== action.id) }
    case 'set_role':
      return { ...state, role: action.role }
    case 'auto_approve':
      return {
        ...state,
        campaigns: state.campaigns.map((c) =>
          c.id === action.id && c.status === 'in_review' ? { ...c, status: 'live', activity: log(c, 'Approved and live') } : c,
        ),
      }
    case 'review_campaign':
      return {
        ...state,
        campaigns: state.campaigns.map((c) => {
          if (c.id !== action.id) return c
          return action.approve
            ? { ...c, status: 'live', rejectionReason: undefined, activity: log(c, 'Approved by the review team') }
            : { ...c, status: 'rejected', rejectionReason: action.reason, activity: log(c, `Rejected by the review team: ${action.reason}`) }
        }),
      }
    case 'review_creative':
      return {
        ...state,
        creatives: state.creatives.map((c) =>
          c.id === action.id ? { ...c, status: action.approve ? 'approved' : 'rejected', rejectionReason: action.approve ? undefined : action.reason } : c,
        ),
        // A campaign waiting on this creative follows its outcome.
        campaigns: state.campaigns.map((c) => {
          if (c.creativeId !== action.id) return c
          if (action.approve && c.status === 'rejected' && !c.rejectionReason) return { ...c, status: 'live', activity: log(c, 'Creative approved; campaign live') }
          if (!action.approve && c.status === 'in_review') return { ...c, status: 'rejected', activity: log(c, `Rejected: creative ${action.reason}`) }
          return c
        }),
      }
    case 'reset':
      return { ...initialState, role: state.role }
    case 'clear':
      return { ...initialState, campaigns: [], role: state.role }
  }
}

function load(): State {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as State) : initialState
  } catch {
    return initialState
  }
}

/** Budget promised to campaigns that can still spend. */
export function committed(campaigns: Campaign[]): number {
  return campaigns
    .filter((c) => ['live', 'in_review', 'paused'].includes(c.status))
    .reduce((sum, c) => sum + Math.max(0, c.budget - c.spent), 0)
}

interface Store extends State {
  dispatch: (action: Action) => void
  committed: number
  available: number
  /** Validation context for a draft; its own committed budget is handed back as available. */
  validationContext: (draftId?: string) => ValidationContext
  /** Send a campaign to review. The demo approves it a few seconds later. */
  submit: (campaign: Campaign) => void
  /** Send a rejected creative back to review; the demo approves it a few seconds later. */
  resubmitCreative: (id: string) => void
}

/** How long the simulated review takes. */
const REVIEW_MS = 6000

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const roleRef = useRef(state.role)
  roleRef.current = state.role

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage can be unavailable (private window); the demo still works for the session.
    }
  }, [state])

  const store = useMemo<Store>(() => {
    const total = committed(state.campaigns)
    return {
      ...state,
      dispatch,
      committed: total,
      available: state.balance - total,
      submit: (campaign) => {
        dispatch({ type: 'upsert', campaign: { ...campaign, status: 'in_review' } })
        // In the brand view the demo approves on its own; in the internal view it waits in the review queue.
        setTimeout(() => {
          if (roleRef.current === 'brand') dispatch({ type: 'auto_approve', id: campaign.id })
        }, REVIEW_MS)
      },
      resubmitCreative: (id) => {
        dispatch({ type: 'set_creative_status', id, status: 'in_review' })
        setTimeout(() => {
          if (roleRef.current === 'brand') dispatch({ type: 'set_creative_status', id, status: 'approved' })
        }, REVIEW_MS)
      },
      validationContext: (draftId) => {
        const others = state.campaigns.filter((c) => c.id !== draftId)
        return {
          products: PRODUCTS,
          creatives: state.creatives,
          campaigns: others,
          availableBalance: state.balance - committed(others),
          alreadySpent: state.campaigns.find((c) => c.id === draftId)?.spent,
        }
      },
    }
  }, [state])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
