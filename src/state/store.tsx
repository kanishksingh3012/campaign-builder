import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { ACCOUNT_BALANCE, SEED_CAMPAIGNS, TODAY } from '../data/campaigns'
import { CREATIVES, PRODUCTS } from '../data/catalogue'
import type { Campaign, CampaignStatus, Creative } from '../lib/types'
import type { ValidationContext } from '../lib/validate'

const STORAGE_KEY = 'campaign-builder:v1'

interface State {
  campaigns: Campaign[]
  creatives: Creative[]
  balance: number
}

type Action =
  | { type: 'upsert'; campaign: Campaign }
  | { type: 'set_status'; ids: string[]; status: CampaignStatus; note: string }
  | { type: 'add_budget'; id: string; amount: number }
  | { type: 'remove'; id: string }
  | { type: 'set_creative_status'; id: string; status: Creative['status'] }
  | { type: 'reset' }

const initialState: State = { campaigns: SEED_CAMPAIGNS, creatives: CREATIVES, balance: ACCOUNT_BALANCE }

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
      return { ...state, creatives: state.creatives.map((c) => (c.id === action.id ? { ...c, status: action.status } : c)) }
    case 'remove':
      return { ...state, campaigns: state.campaigns.filter((c) => c.id !== action.id) }
    case 'reset':
      return initialState
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
        setTimeout(
          () => dispatch({ type: 'set_status', ids: [campaign.id], status: 'live', note: 'Approved and live' }),
          REVIEW_MS,
        )
      },
      resubmitCreative: (id) => {
        dispatch({ type: 'set_creative_status', id, status: 'in_review' })
        setTimeout(() => dispatch({ type: 'set_creative_status', id, status: 'approved' }), REVIEW_MS)
      },
      validationContext: (draftId) => {
        const others = state.campaigns.filter((c) => c.id !== draftId)
        return {
          products: PRODUCTS,
          creatives: state.creatives,
          campaigns: others,
          availableBalance: state.balance - committed(others),
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
