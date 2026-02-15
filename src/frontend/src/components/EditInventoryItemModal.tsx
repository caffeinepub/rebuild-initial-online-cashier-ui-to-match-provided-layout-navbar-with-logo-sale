import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { useUpdateInventoryItem } from '../hooks/useInventory';
import { CATEGORIES, SIZES, UNITS } from './InventoryFormModal';
import { isDuplicateInventoryName } from '../utils/inventoryName';
import type { InventoryItem } from '../backend';

interface EditInventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  inventoryList: InventoryItem[];
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Normalize authentication errors
    if (message.includes('Unauthorized') || message.includes('not authenticated')) {
      return 'Anda perlu login terlebih dahulu untuk mengedit inventori.';
    }
    
    // Normalize trap messages
    if (message.includes('trap')) {
      return 'Terjadi kesalahan pada server. Silakan coba lagi.';
    }
    
    return message;
  }
  
  return 'Failed to update inventory item. Please try again.';
}

export default function EditInventoryItemModal({ open, onOpenChange, item, inventoryList }: EditInventoryItemModalProps) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [unit, setUnit] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateInventoryMutation = useUpdateInventoryItem();

  // Pre-fill form when item changes
  useEffect(() => {
    if (item) {
      setItemName(item.itemName);
      setCategory(item.category);
      setSize(item.size);
      setUnit(item.unit);
    }
  }, [item]);

  // Clear error message when modal opens
  useEffect(() => {
    if (open) {
      setErrorMessage(null);
    }
  }, [open]);

  // Check for duplicate name (excluding current item) - ensure it's always boolean
  const isDuplicate = Boolean(item && itemName.trim() !== '' && isDuplicateInventoryName(itemName, inventoryList, item.id));

  const handleClose = () => {
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!item) return;

    try {
      // Validate inputs
      if (!itemName.trim()) {
        setErrorMessage('Item name is required');
        return;
      }

      // Check for duplicate name (excluding current item)
      if (isDuplicateInventoryName(itemName, inventoryList, item.id)) {
        setErrorMessage('This item name already exists. Please use a different name.');
        return;
      }

      if (!category) {
        setErrorMessage('Category is required');
        return;
      }

      if (!size) {
        setErrorMessage('Size is required');
        return;
      }

      if (!unit) {
        setErrorMessage('Unit is required');
        return;
      }

      // Call backend - preserve stock fields from original item
      await updateInventoryMutation.mutateAsync({
        id: item.id,
        itemName: itemName.trim(),
        category,
        size,
        unit,
        initialStock: item.initialStock,
        reject: item.reject,
        finalStock: item.finalStock,
      });

      // Success - close modal
      handleClose();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      setErrorMessage(normalizeErrorMessage(error));
      // Don't close modal on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update the details of the inventory item below. Stock values are preserved.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <form onSubmit={handleSubmit} id="edit-inventory-form" className="space-y-6 pb-4">
            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-item-name">Item Name</Label>
              <Input
                id="edit-item-name"
                type="text"
                placeholder="Enter item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
              {isDuplicate && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>This item name already exists. Please use a different name.</span>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label htmlFor="edit-size">Size</Label>
              <Select value={size} onValueChange={setSize} required>
                <SelectTrigger id="edit-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger id="edit-unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Display current stock values (read-only) */}
            {item && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm font-medium text-muted-foreground">Current Stock Values (preserved)</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Initial Stock:</span>
                    <span className="ml-2 font-medium">{item.initialStock.toString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reject:</span>
                    <span className="ml-2 font-medium">{item.reject.toString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Final Stock:</span>
                    <span className="ml-2 font-medium">{item.finalStock.toString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateInventoryMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-inventory-form"
            disabled={updateInventoryMutation.isPending || isDuplicate}
          >
            {updateInventoryMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
