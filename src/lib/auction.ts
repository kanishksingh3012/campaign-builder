import type { AdCandidate, OrganicResult, QueryScenario } from './types'

// A simplified sponsored-search auction. Every constant below is illustrative.

/** Results a shopper realistically scans on one search. */
export const PAGE_SIZE = 10
/** Lowest price a click can clear at, in rupees. */
export const RESERVE_PRICE = 1
/** Search conversion with no ads on the page. */
const BASE_CONVERSION = 0.34
/** Share of searches that click the result in each position, before relevance. */
const POSITION_ATTENTION = [0.3, 0.2, 0.14, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02]
/** Click rate of a perfectly relevant organic result in the top slot. */
const ORGANIC_TOP_CTR = 0.08
/** Where sponsored cards sit in the list for a given slot count (0-indexed). */
const SLOT_POSITIONS = [0, 3, 1, 6, 4]

export interface AuctionSettings {
  /** Sponsored slots offered on the page, 0 to 5. */
  slots: number
  /** Minimum relevance for an ad to be eligible, 0 to 1. */
  relevanceFloor: number
}

export interface RankedAd extends AdCandidate {
  score: number
  rank: number
  /** Rupees charged per click: just enough to beat the next ad (second price). */
  cpc: number
}

export type PageItem =
  | { kind: 'sponsored'; position: number; ad: RankedAd }
  | { kind: 'organic'; position: number; result: OrganicResult }

export interface AuctionResult {
  eligible: RankedAd[]
  filtered: AdCandidate[]
  winners: RankedAd[]
  page: PageItem[]
  fillRate: number
  revenuePer1000: number
  sponsoredCtr: number
  organicCtr: number
  conversion: number
  conversionChange: number
}

/** Expected value of showing an ad once: what it bids times how likely it is clicked. */
export function score(ad: AdCandidate): number {
  return ad.bid * ad.pCtr
}

export function rankAds(ads: AdCandidate[], relevanceFloor: number) {
  const eligible = ads.filter((ad) => ad.relevance >= relevanceFloor).sort((a, b) => score(b) - score(a))
  const filtered = ads.filter((ad) => ad.relevance < relevanceFloor)
  const ranked: RankedAd[] = eligible.map((ad, i) => {
    const next = eligible[i + 1]
    const priceToBeatNext = next ? score(next) / ad.pCtr + 0.01 : RESERVE_PRICE
    const cpc = Math.min(ad.bid, Math.max(RESERVE_PRICE, Math.round(priceToBeatNext * 100) / 100))
    return { ...ad, score: score(ad), rank: i + 1, cpc }
  })
  return { ranked, filtered }
}

export function runAuction(scenario: QueryScenario, settings: AuctionSettings): AuctionResult {
  const slots = Math.max(0, Math.min(SLOT_POSITIONS.length, settings.slots))
  const { ranked, filtered } = rankAds(scenario.ads, settings.relevanceFloor)
  const winners = ranked.slice(0, slots)

  const sponsoredPositions = SLOT_POSITIONS.slice(0, winners.length).sort((a, b) => a - b)
  const organic = [...scenario.organic].sort((a, b) => b.relevance - a.relevance)
  const page: PageItem[] = []
  let nextAd = 0
  let nextOrganic = 0
  for (let position = 0; position < PAGE_SIZE; position++) {
    if (sponsoredPositions.includes(position) && nextAd < winners.length) {
      page.push({ kind: 'sponsored', position, ad: winners[nextAd++] })
    } else if (nextOrganic < organic.length) {
      page.push({ kind: 'organic', position, result: organic[nextOrganic++] })
    }
  }

  // Click rates are compared as if every card sat in the top slot, so position doesn't skew the gap.
  let sponsoredCtrSum = 0
  let organicCtrSum = 0
  let organicCount = 0
  let revenue = 0
  let pageQuality = 0
  for (const item of page) {
    const attention = POSITION_ATTENTION[item.position]
    if (item.kind === 'sponsored') {
      const clicks = item.ad.pCtr * (attention / POSITION_ATTENTION[0])
      sponsoredCtrSum += item.ad.pCtr
      revenue += clicks * item.ad.cpc
      pageQuality += attention * item.ad.relevance
    } else {
      organicCtrSum += item.result.relevance * ORGANIC_TOP_CTR
      organicCount++
      pageQuality += attention * item.result.relevance
    }
  }

  const baselineQuality = organic
    .slice(0, PAGE_SIZE)
    .reduce((sum, result, position) => sum + POSITION_ATTENTION[position] * result.relevance, 0)
  const conversion = BASE_CONVERSION * (pageQuality / baselineQuality)

  return {
    eligible: ranked,
    filtered,
    winners,
    page,
    fillRate: slots === 0 ? 1 : winners.length / slots,
    revenuePer1000: Math.round(revenue * 1000),
    sponsoredCtr: winners.length ? sponsoredCtrSum / winners.length : 0,
    organicCtr: organicCount ? organicCtrSum / organicCount : 0,
    conversion,
    conversionChange: conversion / BASE_CONVERSION - 1,
  }
}

/** Conversion drop the platform will accept in exchange for ad revenue. */
export const CONVERSION_GUARDRAIL = -0.03

export function verdict(result: AuctionResult, baseline: AuctionResult): string {
  const revenueChange = baseline.revenuePer1000
    ? result.revenuePer1000 / baseline.revenuePer1000 - 1
    : result.revenuePer1000 > 0 ? 1 : 0
  const revenue = `Revenue ${signed(revenueChange)}`
  const conversion = `conversion ${signed(result.conversionChange)}`
  if (result.conversionChange < CONVERSION_GUARDRAIL) return `${revenue}, ${conversion}: past the guardrail`
  if (result.fillRate < 1) return `${revenue}, ${conversion}: slots going unfilled`
  return `${revenue}, ${conversion}: within the guardrail`
}

function signed(fraction: number): string {
  const value = Math.round(fraction * 100)
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}%`
}
