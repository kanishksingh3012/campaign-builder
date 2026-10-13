// One-time snapshot of real quick commerce search results, taken on 14 Oct 2026 for a Bengaluru address.
// The app never fetches this live. Each list is the first ten non-promoted results, in the order returned.
// Only names, brands, pack sizes and prices are kept: no product photos, so the app shows a drawn pack for every card.
// Names are shortened (brand prefix and marketing claims dropped); price is the selling price of the single pack.

export interface SnapshotProduct {
  name: string
  brand: string
  pack: string
  price: number
}

export const SNAPSHOT_DATE = '14 Oct 2026'

export const CATALOGUE_SNAPSHOT: Record<'chips' | 'diwali-gift' | 'ragi-chips', SnapshotProduct[]> = {
  chips: [
    { name: 'Kerala Banana Chips Original Style', brand: 'Beyond Snack', pack: '70 g', price: 40 },
    { name: "India's Magic Masala Potato Chips", brand: "Lay's", pack: '52.9 g', price: 19 },
    { name: 'American Style Cream & Onion Potato Chips', brand: "Lay's", pack: '58 g', price: 19 },
    { name: 'Original Style Chilli Sprinkled Potato Chips', brand: 'Bingo', pack: '43 g', price: 20 },
    { name: 'Chile Limon Potato Chips', brand: "Lay's", pack: '52.9 g', price: 20 },
    { name: 'Sizzling Hot Potato Chips', brand: "Lay's", pack: '40 g', price: 20 },
    { name: 'Classic Salted Potato Chips', brand: "Lay's", pack: '58 g', price: 20 },
    { name: 'Peri Peri Banana Chips', brand: "Chheda's", pack: '40 g', price: 9 },
    { name: 'Original Style Chilli Sprinkled Potato Chips', brand: 'Bingo', pack: '78 g', price: 30 },
    { name: 'Spanish Tomato Tango Potato Chips', brand: "Lay's", pack: '58 g', price: 20 },
  ],
  'diwali-gift': [
    { name: 'Alpana Ojas Ganesha Reading Book Figurine', brand: 'Home Centre', pack: '1 piece', price: 1228 },
    { name: "Men's PU Leather Auto Lock Belt", brand: 'Labnoft', pack: '1 piece', price: 636 },
    { name: 'Alpana Ojas Rocking Chair Ganesha Figurine', brand: 'Home Centre', pack: '1 piece', price: 1420 },
    { name: 'Alpana Ganesha Sitting on Chair Figurine', brand: 'Home Centre', pack: '1 piece', price: 1699 },
    { name: 'Dry Fruit Gift Box Anand Hamper', brand: 'Happilo', pack: '235 g', price: 420 },
    { name: 'Laxmi Ganesh 999 Silver Coin', brand: 'Kalyan Jewellers', pack: '20 g', price: 5194 },
    { name: 'Celebration Chocolate Gift Box', brand: 'Open Secret', pack: '150 g', price: 224 },
    { name: 'Glint Fest Ceramic Table Lamp', brand: 'Home Centre', pack: '1 piece', price: 989 },
    { name: 'Laxmi Ganesh 999 Silver Coin', brand: 'Kalyan Jewellers', pack: '10 g', price: 2605 },
    { name: 'Mogra Wooden Dry Fruit Gift Box', brand: 'Anand Sweets', pack: '400 g', price: 877 },
  ],
  'ragi-chips': [
    { name: 'Peri Peri Ragi Chips', brand: 'Snackible', pack: '57 g', price: 32 },
    { name: 'High Protein Ragi Chips', brand: 'Troovy', pack: '70 g', price: 35 },
    { name: 'High Protein Ragi Chips Masala Punch', brand: 'Troovy', pack: '39 g', price: 19 },
    { name: 'Desi Masala Ragi Chips', brand: 'Snackible', pack: '55 g', price: 35 },
    { name: 'Ragi Crackle Chips Masala', brand: 'NOICE', pack: '100 g', price: 59 },
    { name: 'Ragi Chips', brand: 'Healthy Master', pack: '30 g', price: 28 },
    { name: 'Dipsters Peri Peri Ragi Chips with Cheesy Jalapeno Dip', brand: 'Snackible', pack: '56 g', price: 47 },
    { name: 'Peri Peri Ragi Chips', brand: 'Snackible', pack: '165 g', price: 133 },
    { name: 'Ragi Chips', brand: 'Charliee', pack: '180 g', price: 65 },
    { name: 'Dipsters Jalapeno Ragi Chips with Spicy Mayo Dip', brand: 'Snackible', pack: '56 g', price: 47 },
  ],
}
