// Shared constants for product categories and sizes
// Used across product creation and stock deduction rule configuration

export const PRODUCT_CATEGORIES = [
  'Minuman',
  'Makanan',
  'Snack',
  'Lainnya',
] as const;

export const PRODUCT_SIZES = [
  'Small',
  'Medium',
  'Large',
  'Extra Large',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
export type ProductSize = typeof PRODUCT_SIZES[number];
