import type { Campaign } from '../lib/types'

/** The demo's "today". Seeded dates are relative to this so the data never goes stale. */
export const TODAY = '2026-10-14'
export const ACCOUNT_BALANCE = 600000

// Seeded so every status, alert and guardrail has something to show on first load.
export const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp1', name: 'Diwali awareness', goal: 'awareness', status: 'out_of_budget',
    productIds: ['p7', 'p1', 'p2'], pausedProductIds: [], cityIds: ['blr', 'mum', 'del'], negativeKeywords: [],
    budget: 200000, split: { home_banner: 50, search_banner: 30, category_boost: 20 },
    startDate: '2026-10-01', endDate: '2026-10-20', pacing: 'front_loaded', creativeId: 'c2', spent: 200000,
    activity: [
      { date: '2026-09-29', text: 'Campaign created' },
      { date: '2026-09-30', text: 'Approved and scheduled' },
      { date: '2026-10-13', text: 'Budget used up 7 days early' },
    ],
  },
  {
    id: 'cmp2', name: 'Try Crisp', goal: 'new_customers', status: 'live',
    productIds: ['p1', 'p2', 'p4', 'p5'], pausedProductIds: [], cityIds: ['blr', 'mum'], negativeKeywords: ['free'],
    budget: 90000, split: { search_ads: 65, category_boost: 35 },
    startDate: '2026-10-06', endDate: '2026-10-19', pacing: 'even', spent: 52200,
    activity: [
      { date: '2026-10-04', text: 'Campaign created' },
      { date: '2026-10-05', text: 'Approved' },
      { date: '2026-10-06', text: 'Went live' },
    ],
  },
  {
    id: 'cmp3', name: 'Win-back September buyers', goal: 'win_back', status: 'live',
    productIds: ['p3', 'p5', 'p8'], pausedProductIds: [], cityIds: ['blr', 'hyd'], negativeKeywords: [],
    budget: 60000, split: { buy_again: 60, cart_addon: 40 },
    startDate: '2026-10-08', endDate: '2026-10-28', pacing: 'even', spent: 18600,
    activity: [
      { date: '2026-10-07', text: 'Campaign created' },
      { date: '2026-10-08', text: 'Went live' },
      { date: '2026-10-12', text: '2 products went out of stock' },
    ],
  },
  {
    id: 'cmp4', name: 'New flavours launch', goal: 'awareness', status: 'rejected',
    productIds: ['p3', 'p4'], pausedProductIds: [], cityIds: ['mum', 'pun'], negativeKeywords: [],
    budget: 150000, split: { home_banner: 50, search_banner: 30, category_boost: 20 },
    startDate: '2026-10-16', endDate: '2026-10-30', pacing: 'even', creativeId: 'c3', spent: 0,
    activity: [
      { date: '2026-10-12', text: 'Submitted for review' },
      { date: '2026-10-13', text: 'Rejected: creative text covers more than 30% of the image' },
    ],
  },
  {
    id: 'cmp5', name: 'Makhana health push', goal: 'new_customers', status: 'in_review',
    productIds: ['p6'], pausedProductIds: [], cityIds: ['blr', 'del', 'che'], negativeKeywords: [],
    budget: 75000, split: { search_ads: 65, category_boost: 35 },
    startDate: '2026-10-15', endDate: '2026-10-29', pacing: 'even', spent: 0,
    activity: [{ date: '2026-10-13', text: 'Submitted for review' }],
  },
  {
    id: 'cmp6', name: 'Match day combo', goal: 'awareness', status: 'paused',
    productIds: ['p7', 'p5'], pausedProductIds: [], cityIds: ['mum', 'che'], negativeKeywords: [],
    budget: 160000, split: { home_banner: 45, search_banner: 35, category_boost: 20 },
    startDate: '2026-10-03', endDate: '2026-10-24', pacing: 'even', creativeId: 'c5', spent: 61000,
    activity: [
      { date: '2026-10-03', text: 'Went live' },
      { date: '2026-10-10', text: 'Paused by you' },
    ],
  },
  {
    id: 'cmp7', name: 'Hyderabad trial', goal: 'new_customers', status: 'draft',
    productIds: ['p1', 'p2'], pausedProductIds: [], cityIds: ['hyd'], negativeKeywords: [],
    budget: 40000, split: { search_ads: 60, category_boost: 30 },
    startDate: '2026-10-18', endDate: '2026-10-22', pacing: 'even', spent: 0,
    activity: [{ date: '2026-10-11', text: 'Draft saved' }],
  },
  {
    id: 'cmp8', name: 'Monsoon munchies', goal: 'win_back', status: 'ended',
    productIds: ['p1', 'p2', 'p5'], pausedProductIds: [], cityIds: ['blr', 'mum', 'pun'], negativeKeywords: [],
    budget: 80000, split: { buy_again: 60, cart_addon: 40 },
    startDate: '2026-08-10', endDate: '2026-09-07', pacing: 'even', spent: 79400,
    activity: [
      { date: '2026-08-10', text: 'Went live' },
      { date: '2026-09-07', text: 'Ended on schedule' },
    ],
  },
  {
    id: 'cmp9', name: 'Onam festive reach', goal: 'awareness', status: 'ended',
    productIds: ['p7'], pausedProductIds: [], cityIds: ['che', 'blr'], negativeKeywords: [],
    budget: 150000, split: { home_banner: 50, search_banner: 30, category_boost: 20 },
    startDate: '2026-08-18', endDate: '2026-08-31', pacing: 'front_loaded', creativeId: 'c1', spent: 150000,
    activity: [
      { date: '2026-08-18', text: 'Went live' },
      { date: '2026-08-31', text: 'Ended on schedule' },
    ],
  },
]
