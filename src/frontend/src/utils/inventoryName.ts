/**
 * Normalize inventory item name for comparison (trim and lowercase)
 */
export function normalizeInventoryName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Check if an inventory item name already exists in the list
 * @param name - The name to check
 * @param inventoryList - The current inventory list
 * @param excludeId - Optional ID to exclude from the check (for edit mode)
 * @returns true if the name already exists, false otherwise
 */
export function isDuplicateInventoryName(
  name: string,
  inventoryList: Array<{ id: bigint; itemName: string }>,
  excludeId?: bigint
): boolean {
  const normalized = normalizeInventoryName(name);
  
  if (!normalized) {
    return false;
  }

  return inventoryList.some((item) => {
    // Skip the item being edited
    if (excludeId !== undefined && item.id === excludeId) {
      return false;
    }
    
    return normalizeInventoryName(item.itemName) === normalized;
  });
}
