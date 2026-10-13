import type { OrganicResult, QueryScenario } from '../lib/types'
import { CATALOGUE_SNAPSHOT, type SnapshotProduct } from './catalogueSnapshot'

/** Organic results are real products in snapshot order; relevance is illustrative and falls with rank. */
function organicFrom(prefix: string, products: SnapshotProduct[], relevance: number[]): OrganicResult[] {
  return products.map((p, i) => ({ id: `${prefix}${i + 1}`, product: p.name, pack: p.pack, brand: p.brand, price: p.price, relevance: relevance[i] }))
}

// Three searches with different relevance spreads. Organic results come from the catalogue snapshot.
// Every sponsored ad is fictional: brands, bids, click rates and relevance.
export const SCENARIOS: QueryScenario[] = [
  {
    id: 'chips',
    query: 'chips',
    note: 'Many relevant advertisers: slots fill easily even with a high relevance floor.',
    ads: [
      { id: 'a1', product: 'Classic Salted', pack: '52 g', brand: 'Crisp & Co', price: 20, bid: 6, pCtr: 0.075, relevance: 0.95 },
      { id: 'a2', product: 'Tangy Tomato Wafers', pack: '50 g', brand: 'Wafello', price: 20, bid: 9, pCtr: 0.06, relevance: 0.9 },
      { id: 'a3', product: 'Nacho Cheese Triangles', pack: '70 g', brand: 'Mexito', price: 45, bid: 8, pCtr: 0.05, relevance: 0.8 },
      { id: 'a4', product: 'Masala Banana Chips', pack: '100 g', brand: 'Keraleaf', price: 55, bid: 5, pCtr: 0.055, relevance: 0.85 },
      { id: 'a5', product: 'Cola', pack: '750 ml', brand: 'Fizzup', price: 40, bid: 14, pCtr: 0.022, relevance: 0.35 },
      { id: 'a6', product: 'Salsa Dip', pack: '200 g', brand: 'Mexito', price: 120, bid: 10, pCtr: 0.03, relevance: 0.5 },
      { id: 'a7', product: 'Instant Noodles', pack: '4 pack', brand: 'Slurpy', price: 56, bid: 16, pCtr: 0.012, relevance: 0.15 },
      { id: 'a8', product: 'Protein Chips', pack: '40 g', brand: 'Fitbite', price: 60, bid: 7, pCtr: 0.04, relevance: 0.75 },
    ],
    organic: organicFrom('o', CATALOGUE_SNAPSHOT.chips, [0.97, 0.96, 0.93, 0.9, 0.88, 0.84, 0.8, 0.75, 0.74, 0.7]),
  },
  {
    id: 'diwali-gift',
    query: 'diwali gift',
    note: 'Festive query: high bids from loosely related brands. Relevance is where the damage happens.',
    ads: [
      { id: 'b1', product: 'Dry Fruit Gift Box', pack: '500 g', brand: 'Nutkart', price: 899, bid: 18, pCtr: 0.07, relevance: 0.95 },
      { id: 'b2', product: 'Assorted Chocolate Hamper', brand: 'Cocoro', price: 649, bid: 22, pCtr: 0.06, relevance: 0.9 },
      { id: 'b3', product: 'Party Pack Assorted', pack: '6 × 52 g', brand: 'Crisp & Co', price: 110, bid: 12, pCtr: 0.03, relevance: 0.5 },
      { id: 'b4', product: 'Cola', pack: '2 L', brand: 'Fizzup', price: 95, bid: 30, pCtr: 0.015, relevance: 0.2 },
      { id: 'b5', product: 'Dish Wash Gel', pack: '1 L', brand: 'Sparko', price: 199, bid: 35, pCtr: 0.008, relevance: 0.05 },
      { id: 'b6', product: 'Scented Candle Set', brand: 'Glowly', price: 349, bid: 15, pCtr: 0.055, relevance: 0.85 },
      { id: 'b7', product: 'Instant Noodles', pack: '12 pack', brand: 'Slurpy', price: 168, bid: 28, pCtr: 0.01, relevance: 0.1 },
    ],
    organic: organicFrom('q', CATALOGUE_SNAPSHOT['diwali-gift'], [0.96, 0.94, 0.92, 0.9, 0.86, 0.84, 0.82, 0.78, 0.72, 0.68]),
  },
  {
    id: 'ragi-chips',
    query: 'ragi chips',
    note: 'Niche query: few relevant advertisers. A high floor leaves slots empty; a low one fills them with noise.',
    ads: [
      { id: 'c1', product: 'Baked Ragi Chips', pack: '75 g', brand: 'Crisp & Co', price: 60, bid: 5, pCtr: 0.09, relevance: 0.98 },
      { id: 'c2', product: 'Protein Chips', pack: '40 g', brand: 'Fitbite', price: 60, bid: 7, pCtr: 0.035, relevance: 0.6 },
      { id: 'c3', product: 'Tangy Tomato Wafers', pack: '50 g', brand: 'Wafello', price: 20, bid: 9, pCtr: 0.02, relevance: 0.4 },
      { id: 'c4', product: 'Cola', pack: '750 ml', brand: 'Fizzup', price: 40, bid: 14, pCtr: 0.008, relevance: 0.1 },
      { id: 'c5', product: 'Millet Cookies', pack: '150 g', brand: 'Bakewell', price: 90, bid: 6, pCtr: 0.03, relevance: 0.55 },
    ],
    organic: organicFrom('r', CATALOGUE_SNAPSHOT['ragi-chips'], [0.98, 0.95, 0.8, 0.76, 0.66, 0.6, 0.6, 0.5, 0.45, 0.4]),
  },
]
