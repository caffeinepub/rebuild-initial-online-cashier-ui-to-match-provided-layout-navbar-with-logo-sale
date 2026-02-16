import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useAdjustInventoryStock } from '../hooks/useInventory';
import type { InventoryItem } from '../backend';

interface AdjustStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  mode: 'add' | 'reduce';
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Normalize authentication errors
    if (message.includes('Unauthorized') || message.includes('not authenticated')) {
      return 'You need to log in first to adjust stock.';
    }
    
    // Normalize trap messages
    if (message.includes('trap')) {
      return 'A server error occurred. Please try again.';
    }
    
    return message;
  }
  
  return 'Failed to adjust stock. Please try again.';
}

export default function AdjustStockModal({ open, onOpenChange, item, mode }: AdjustStockModalProps) {
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const adjustStockMutation = useAdjustInventoryStock();

  const handleClose = () => {
    setQuantity('');
    setDescription('');
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!item) return;

    try {
      const quantityValue = parseInt(quantity);

      // Validate quantity
      if (isNaN(quantityValue) || quantityValue <= 0) {
        setErrorMessage('Quantity must be a positive number');
        return;
      }

      // Validate description
      if (!description.trim()) {
        setErrorMessage('Description is required');
        return;
      }

      // Call backend
      await adjustStockMutation.mutateAsync({
        itemId: item.id,
        quantity: BigInt(quantityValue),
        isAddition: mode === 'add',
        description: description.trim(),
      });

      // Success - close modal
      handleClose();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setErrorMessage(normalizeErrorMessage(error));
    }
  };

  const title = mode === 'add' ? 'Add Stock' : 'Reduce Stock';
  const description_text = mode === 'add' 
    ? `Add stock to ${item?.itemName || 'item'}` 
    : `Reduce stock from ${item?.itemName || 'item'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description_text}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="adjust-stock-form" className="space-y-4">
          {item && (
            <div className="bg-muted px-4 py-3 rounded-lg text-sm">
              <p className="text-muted-foreground">Current final stock:</p>
              <p className="text-lg font-semibold">{item.finalStock.toString()}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description for this stock adjustment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={adjustStockMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="adjust-stock-form"
            disabled={adjustStockMutation.isPending}
          >
            {adjustStockMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
