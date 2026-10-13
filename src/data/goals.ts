import type { Audience, City, Format, FormatId, Goal, GoalId } from '../lib/types'

// All costs, rates and audience sizes here are illustrative, not real platform data.

export const FORMATS: Record<FormatId, Format> = {
  home_banner: { id: 'home_banner', name: 'Home banner', placement: 'Top of the home page', pricing: 'CPM', avgCost: 180, ctr: 0.012, needsCreative: true },
  search_banner: { id: 'search_banner', name: 'Search banner', placement: 'Above search results for your category', pricing: 'CPM', avgCost: 240, ctr: 0.02, needsCreative: true },
  category_boost: { id: 'category_boost', name: 'Category boost', placement: 'Higher position on the category page', pricing: 'CPC', avgCost: 5, ctr: 0.03, needsCreative: false },
  search_ads: { id: 'search_ads', name: 'Search ads', placement: 'Sponsored slots in search results', pricing: 'CPC', avgCost: 7, ctr: 0.045, needsCreative: false },
  buy_again: { id: 'buy_again', name: 'Buy again slot', placement: 'In the "Your usual items" row', pricing: 'CPC', avgCost: 6, ctr: 0.07, needsCreative: false },
  cart_addon: { id: 'cart_addon', name: 'Cart add-on', placement: '"Did you forget?" row in the cart', pricing: 'CPC', avgCost: 8, ctr: 0.06, needsCreative: false },
}

export const GOALS: Record<GoalId, Goal> = {
  awareness: {
    id: 'awareness',
    name: 'Awareness',
    promise: 'Be seen by as many shoppers as possible',
    judgedOn: 'Reach and frequency',
    headlineMetric: 'Shoppers reached',
    minBudget: 150000,
    minDays: 7,
    audience: 'All shoppers in your cities',
    audienceShare: 1,
    bundle: [
      { format: 'home_banner', reason: 'The widest reach on the app: every session starts here.', floor: 60000, share: 50 },
      { format: 'search_banner', reason: 'Puts the brand in front of shoppers already looking at your category.', floor: 30000, share: 30 },
      { format: 'category_boost', reason: 'Keeps products visible where browsing turns into buying.', floor: 20000, share: 20 },
    ],
  },
  new_customers: {
    id: 'new_customers',
    name: 'New customers',
    promise: 'Win a first purchase from shoppers who have never bought you',
    judgedOn: 'New-to-brand orders',
    headlineMetric: 'New customers',
    minBudget: 75000,
    minDays: 7,
    audience: 'Shoppers who have not bought your brand in the last 12 months',
    audienceShare: 0.62,
    bundle: [
      { format: 'search_ads', reason: 'Highest intent: non-buyers comparing options right now.', floor: 30000, share: 65 },
      { format: 'category_boost', reason: 'Reaches browsers who have not picked a brand yet.', floor: 20000, share: 35 },
    ],
  },
  win_back: {
    id: 'win_back',
    name: 'Win back',
    promise: 'Bring back shoppers who used to buy you',
    judgedOn: 'Repeat orders',
    headlineMetric: 'Returning customers',
    minBudget: 50000,
    minDays: 7,
    audience: 'Shoppers who bought your brand before, but not in the last 60 days',
    audienceShare: 0.09,
    bundle: [
      { format: 'buy_again', reason: 'Sits in the row shoppers use to rebuild their usual basket.', floor: 20000, share: 60 },
      { format: 'cart_addon', reason: 'A last reminder at the moment they are about to pay.', floor: 15000, share: 40 },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    promise: 'Pick formats, audience, keywords and bids yourself',
    judgedOn: 'Orders',
    headlineMetric: 'Orders',
    minBudget: 25000,
    minDays: 3,
    audience: 'Chosen by you',
    audienceShare: 1,
    bundle: [],
  },
}

/** Goal-based options shown in the wizard. Custom campaigns have their own builder. */
export const GOAL_LIST: Goal[] = [GOALS.awareness, GOALS.new_customers, GOALS.win_back]

export const CITIES: City[] = [
  { id: 'blr', name: 'Bengaluru', shoppers: 1400000 },
  { id: 'mum', name: 'Mumbai', shoppers: 1250000 },
  { id: 'del', name: 'Delhi NCR', shoppers: 1600000 },
  { id: 'hyd', name: 'Hyderabad', shoppers: 800000 },
  { id: 'pun', name: 'Pune', shoppers: 550000 },
  { id: 'che', name: 'Chennai', shoppers: 600000 },
]

export const AUDIENCES: Audience[] = [
  { id: 'all', name: 'All shoppers', description: 'Everyone in your cities', share: 1 },
  { id: 'never_bought', name: 'Never bought', description: 'No purchase of your brand in 12 months', share: 0.62 },
  { id: 'lapsed', name: 'Lapsed buyers', description: 'Bought before, but not in the last 60 days', share: 0.09 },
  { id: 'current', name: 'Current buyers', description: 'Bought your brand in the last 60 days', share: 0.29 },
]

/** Minimum rupees a format needs when the advertiser picks formats by hand. */
export const CUSTOM_FLOOR: Record<FormatId, number> = {
  home_banner: 40000,
  search_banner: 20000,
  category_boost: 10000,
  search_ads: 10000,
  buy_again: 10000,
  cart_addon: 10000,
}

/** Lowest bid the auction accepts, as a share of the format's average cost. */
export const BID_FLOOR_RATIO = 0.4
