// Shared constants for product categories, sizes, and names
// Used across product creation and stock deduction rule configuration

export const PRODUCT_CATEGORIES = [
  'Teh',
  'Kopi',
  'Matcha',
  'Coklat',
  'Lemon',
] as const;

export const PRODUCT_SIZES = [
  'Kecil',
  'Besar',
  'Jumbo',
] as const;

export const PRODUCT_NAMES = [
  'Es Teh Ori Kecil',
  'Es Teh Ori Besar',
  'Kopi Aren Ori Kecil',
  'Kopi Aren Ori Besar',
  'Creamy Latte Kecil',
  'Creamy Latte Besar',
  'Matcha Latte Kecil',
  'Choco Melt Kecil',
  'Lemon Tea Kecil',
  'Lemon Tea Besar',
  'Lemon Fresh Kecil',
  'Lemon Fresh Besar',
  'Es Batu Cup Besar',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
export type ProductSize = typeof PRODUCT_SIZES[number];
export type ProductName = typeof PRODUCT_NAMES[number];
