import type { InventoryItem } from '../backend';

/**
 * Determines if an inventory item is low on stock.
 * Low stock is defined as: finalStock < minimumStock (strictly below)
 * Items with finalStock equal to minimumStock are NOT considered low stock.
 */
export function isLowStock(item: InventoryItem): boolean {
  return Number(item.finalStock) < Number(item.minimumStock);
}

/**
 * Filters a list of inventory items to return only those with low stock.
 */
export function filterLowStockItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter(isLowStock);
}
