// One-time snapshot of real quick commerce search results, taken on 14 Oct 2026 for a Bengaluru address.
// The app never fetches this live. Each list is the first ten non-promoted results, in the order returned.
// Names are shortened (brand prefix and marketing claims dropped); price is the selling price of the single pack.

export interface SnapshotProduct {
  name: string
  brand: string
  pack: string
  price: number
  /** Packshot path under IMAGE_BASE. Loaded from the retailer's image host, so the card falls back to a placeholder offline. */
  image: string
}

export const SNAPSHOT_DATE = '14 Oct 2026'
export const IMAGE_BASE = 'https://media-assets.swiggy.com/swiggy/image/upload/w_240,f_auto,q_auto/NI_CATALOG/IMAGES/'

export const CATALOGUE_SNAPSHOT: Record<'chips' | 'diwali-gift' | 'ragi-chips', SnapshotProduct[]> = {
  chips: [
    { name: 'Kerala Banana Chips Original Style', brand: 'Beyond Snack', pack: '70 g', price: 40, image: 'ciw/2025/12/18/db61a3f7-7e64-4cd4-b0f1-81ec7f4aa777_0863A1MJWN_MN_17122025.png' },
    { name: "India's Magic Masala Potato Chips", brand: "Lay's", pack: '52.9 g', price: 19, image: 'CIW/2026/4/24/e23ed9c7-98dd-4b15-bca2-6fbf8b34d4c4_673_1.png' },
    { name: 'American Style Cream & Onion Potato Chips', brand: "Lay's", pack: '58 g', price: 19, image: 'CIW/2026/4/24/04209055-a712-42c0-824d-383d4f50e075_5468_1.png' },
    { name: 'Original Style Chilli Sprinkled Potato Chips', brand: 'Bingo', pack: '43 g', price: 20, image: 'ciw/2026/8/21/ea3c9472-5183-4fae-b3fe-17a705ad6769_mn_bg_removed_AL9_f334838d-1d35-45da-a1d3-6d4478635277.png' },
    { name: 'Chile Limon Potato Chips', brand: "Lay's", pack: '52.9 g', price: 20, image: 'CIW/2026/4/24/79e853a1-1c01-41d9-aa92-3596215fdea7_5445_1.png' },
    { name: 'Sizzling Hot Potato Chips', brand: "Lay's", pack: '40 g', price: 20, image: 'CIW/2026/5/5/e7124755-1dd3-41b5-9ae7-d9c6412706fe_16478_1.png' },
    { name: 'Classic Salted Potato Chips', brand: "Lay's", pack: '58 g', price: 20, image: 'CIW/2026/4/24/dc723a21-ee4f-431f-8bc1-bbf2f0510c12_972123_1.png' },
    { name: 'Peri Peri Banana Chips', brand: "Chheda's", pack: '40 g', price: 9, image: 'ciw/2026/5/19/4b712226-cf19-4508-9c5b-4ef5970d69bf_mn_bg_removed_AL4_9f6d2ce3-a63e-4335-b7aa-d54da192ebcf.png' },
    { name: 'Original Style Chilli Sprinkled Potato Chips', brand: 'Bingo', pack: '78 g', price: 30, image: 'CIW/2026/9/29/54bb9822-1026-4c11-adc4-0bf86d7db581_15290_1.png' },
    { name: 'Spanish Tomato Tango Potato Chips', brand: "Lay's", pack: '58 g', price: 20, image: 'CIW/2026/4/24/853aacc8-7180-48c3-b3b0-5a01c6f2429c_5467_1.png' },
  ],
  'diwali-gift': [
    { name: 'Alpana Ojas Ganesha Reading Book Figurine', brand: 'Home Centre', pack: '1 piece', price: 1228, image: 'ciw/2026/2/20/64a34caa-f884-4159-afc6-130db0c5bc28_18PGIHZIQH_MN_19022026.png' },
    { name: "Men's PU Leather Auto Lock Belt", brand: 'Labnoft', pack: '1 piece', price: 636, image: 'CIW/2026/6/19/32355765-a433-472f-a020-43f1d9db7bc4_89186.jpg' },
    { name: 'Alpana Ojas Rocking Chair Ganesha Figurine', brand: 'Home Centre', pack: '1 piece', price: 1420, image: 'ciw/2026/2/20/4060e709-7238-4737-9479-5fafab653334_SR7HPRP5DG_MN_19022026.png' },
    { name: 'Alpana Ganesha Sitting on Chair Figurine', brand: 'Home Centre', pack: '1 piece', price: 1699, image: 'CIW/2025/12/1/c0d37f12-a31e-4d2e-aba6-cca9eb4d917c_172544_1.png' },
    { name: 'Dry Fruit Gift Box Anand Hamper', brand: 'Happilo', pack: '235 g', price: 420, image: 'CIW/2025/10/16/c33657bd-f7fe-4a9d-850f-d46802395c88_68544_1.png' },
    { name: 'Laxmi Ganesh 999 Silver Coin', brand: 'Kalyan Jewellers', pack: '20 g', price: 5194, image: 'CIW/2026/4/2/71145f08-41ab-4ded-914d-09c0c20d44df_NN0I0XIG40.png' },
    { name: 'Celebration Chocolate Gift Box', brand: 'Open Secret', pack: '150 g', price: 224, image: 'CIW/2026/8/24/0bea7a83-cdb5-47ed-9918-a49a2c62cb43_8218_1.png' },
    { name: 'Glint Fest Ceramic Table Lamp', brand: 'Home Centre', pack: '1 piece', price: 989, image: 'ciw/2025/8/25/694379a2-c480-4518-a8fe-dd19fb00dc21_NPI-023648_1_20250825_124819.png' },
    { name: 'Laxmi Ganesh 999 Silver Coin', brand: 'Kalyan Jewellers', pack: '10 g', price: 2605, image: 'CIW/2026/4/10/95a3c823-c000-48ab-b38b-192e1e89edaf_8BWRGI0CU4.png' },
    { name: 'Mogra Wooden Dry Fruit Gift Box', brand: 'Anand Sweets', pack: '400 g', price: 877, image: 'CIW/2025/9/23/f188e183-a9a3-4f4a-a522-169884882c62_918550_1.png' },
  ],
  'ragi-chips': [
    { name: 'Peri Peri Ragi Chips', brand: 'Snackible', pack: '57 g', price: 32, image: 'CIW/2026/8/12/578099c8-30ab-4fc3-9420-35146217813d_10684_1.png' },
    { name: 'High Protein Ragi Chips', brand: 'Troovy', pack: '70 g', price: 35, image: 'ciw/2026/10/5/b06ed19a-2479-4eb2-b23c-e1c78b68a755_2_MN_c45c27e2-9bb6-44b6-8605-9646fcba1bca.png' },
    { name: 'High Protein Ragi Chips Masala Punch', brand: 'Troovy', pack: '39 g', price: 19, image: 'ciw/2026/10/5/b06ed19a-2479-4eb2-b23c-e1c78b68a755_2_MN_c45c27e2-9bb6-44b6-8605-9646fcba1bca.png' },
    { name: 'Desi Masala Ragi Chips', brand: 'Snackible', pack: '55 g', price: 35, image: 'CIW/2026/8/12/18fc2703-0c51-42d1-9764-b1266620496d_200141_1.png' },
    { name: 'Ragi Crackle Chips Masala', brand: 'NOICE', pack: '100 g', price: 59, image: 'ciw/2025/12/18/a92fcd30-b6c1-4307-86fe-dca7a1360c91_UX7DUSSKCD_MN_17122025.png' },
    { name: 'Ragi Chips', brand: 'Healthy Master', pack: '30 g', price: 28, image: 'CIW/2026/8/24/8e6c74d8-33fb-4b38-a26e-752c168f4fde_848160_1.png' },
    { name: 'Dipsters Peri Peri Ragi Chips with Cheesy Jalapeno Dip', brand: 'Snackible', pack: '56 g', price: 47, image: 'CIW/2026/8/12/67ea1ac6-8345-4d92-b5ec-45a0f42b09d4_25000_1.png' },
    { name: 'Peri Peri Ragi Chips', brand: 'Snackible', pack: '165 g', price: 133, image: 'CIW/2026/8/12/700de177-fb90-4b2c-9e77-9e28aa0dfdb3_583785_1.png' },
    { name: 'Ragi Chips', brand: 'Charliee', pack: '180 g', price: 65, image: 'CIW/2026/4/8/ce448dc7-4fe2-4e04-9d16-c265c39148f3_484129_1.png' },
    { name: 'Dipsters Jalapeno Ragi Chips with Spicy Mayo Dip', brand: 'Snackible', pack: '56 g', price: 47, image: 'CIW/2026/8/12/570ebd1a-f0cb-458b-874a-d6ea501419f1_25001_1.png' },
  ],
}
