export type GoalId = 'awareness' | 'new_customers' | 'win_back'

export type FormatId =
  | 'home_banner'
  | 'search_banner'
  | 'category_boost'
  | 'search_ads'
  | 'buy_again'
  | 'cart_addon'

export type CampaignStatus =
  | 'draft'
  | 'in_review'
  | 'live'
  | 'paused'
  | 'out_of_budget'
  | 'rejected'
  | 'ended'

export type Pacing = 'even' | 'front_loaded'

export interface Format {
  id: FormatId
  name: string
  placement: string
  pricing: 'CPC' | 'CPM'
  /** Average cost per click (CPC) or per 1,000 impressions (CPM), in rupees. Simulated. */
  avgCost: number
  /** Typical click-through rate. Simulated. */
  ctr: number
  needsCreative: boolean
}

export interface BundleItem {
  format: FormatId
  reason: string
  /** Minimum rupees this format needs to deliver anything useful. */
  floor: number
  /** Recommended share of budget, in percent. Items in a bundle sum to 100. */
  share: number
}

export interface Goal {
  id: GoalId
  name: string
  promise: string
  judgedOn: string
  headlineMetric: string
  minBudget: number
  minDays: number
  audience: string
  /** Share of a city's shoppers this audience covers. Simulated. */
  audienceShare: number
  bundle: BundleItem[]
}

export interface Product {
  id: string
  name: string
  size: string
  price: number
  inStock: boolean
}

export interface City {
  id: string
  name: string
  /** Monthly active shoppers. Simulated. */
  shoppers: number
}

export interface Creative {
  id: string
  name: string
  status: 'approved' | 'in_review' | 'rejected'
  rejectionReason?: string
}

export interface ActivityEntry {
  date: string
  text: string
}

export interface Campaign {
  id: string
  name: string
  goal: GoalId
  status: CampaignStatus
  productIds: string[]
  /** Products kept in the campaign but paused until back in stock. */
  pausedProductIds: string[]
  cityIds: string[]
  negativeKeywords: string[]
  budget: number
  /** Percent of budget per format in the goal's bundle. */
  split: Partial<Record<FormatId, number>>
  startDate: string
  endDate: string
  pacing: Pacing
  creativeId?: string
  spent: number
  activity: ActivityEntry[]
}

/** A campaign being created or edited in the wizard. Same shape, nothing guaranteed valid yet. */
export type Draft = Omit<Campaign, 'goal' | 'status' | 'spent' | 'activity'> & {
  goal?: GoalId
  duplicatedFrom?: string
}

export type Severity = 'blocker' | 'warning'
export type WizardStep = 'goal' | 'bundle' | 'products' | 'budget' | 'review'

export interface Issue {
  code: string
  step: WizardStep
  field: string
  severity: Severity
  message: string
  /** Extra one-click fixes; the first is the primary action. */
  fixes: { label: string; apply: (draft: Draft) => Draft }[]
}

export interface AdCandidate {
  id: string
  product: string
  brand: string
  price: number
  /** Max rupees per click. */
  bid: number
  /** Predicted click-through rate at the top slot, 0 to 1. */
  pCtr: number
  /** How well the product matches the query, 0 to 1. */
  relevance: number
}

export interface OrganicResult {
  id: string
  product: string
  brand: string
  price: number
  relevance: number
}

export interface QueryScenario {
  id: string
  query: string
  note: string
  ads: AdCandidate[]
  organic: OrganicResult[]
}
