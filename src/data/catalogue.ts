import type { Creative, Product } from '../lib/types'

// Fictional brand and products.
/** Placeholder until the platform is named. */
export const APP_NAME = 'Ads Manager'
export const BRAND = 'Crisp & Co'

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Classic Salted', size: '52 g', price: 20, inStock: true },
  { id: 'p2', name: 'Masala Crunch', size: '52 g', price: 20, inStock: true },
  { id: 'p3', name: 'Peri Peri', size: '90 g', price: 40, inStock: false },
  { id: 'p4', name: 'Cheese Rings', size: '60 g', price: 30, inStock: true },
  { id: 'p5', name: 'Cream & Onion', size: '90 g', price: 40, inStock: true },
  { id: 'p6', name: 'Roasted Makhana', size: '70 g', price: 99, inStock: true },
  { id: 'p7', name: 'Party Pack Assorted', size: '6 × 52 g', price: 110, inStock: true },
  { id: 'p8', name: 'Baked Ragi Chips', size: '75 g', price: 60, inStock: false },
]

export const CREATIVES: Creative[] = [
  { id: 'c1', name: 'Crunch time banner', status: 'approved' },
  { id: 'c2', name: 'Festive party pack', status: 'approved' },
  { id: 'c3', name: 'New flavours launch', status: 'rejected', rejectionReason: 'text covers more than 30% of the image' },
  { id: 'c4', name: 'Makhana healthy snacking', status: 'in_review' },
  { id: 'c5', name: 'Match day combo', status: 'approved' },
]

/** Keywords the platform picks automatically for the brand's category. */
export const AUTO_KEYWORDS = [
  'chips', 'namkeen', 'snacks', 'wafers', 'party snacks', 'masala chips', 'salted chips', 'makhana',
  'healthy snacks', 'munchies', 'kurkure', 'nachos', 'movie snacks', 'tea time snacks', 'baked chips',
  'cheese balls', 'evening snacks',
]
