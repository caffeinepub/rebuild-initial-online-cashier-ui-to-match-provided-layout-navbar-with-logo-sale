import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '../backend';

interface QuantityPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (quantity: number) => void;
  initialQuantity?: number;
}

export default function QuantityPromptModal({
  open,
  onOpenChange,
  product,
  onConfirm,
  initialQuantity = 1,
}: QuantityPromptModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity);

  useEffect(() => {
    if (open) {
      setQuantity(initialQuantity);
    }
  }, [open, initialQuantity]);

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(quantity);
      onOpenChange(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!product) return null;

  const subtotal = Number(product.salePrice) * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Masukkan Jumlah</DialogTitle>
          <DialogDescription>
            {product.name} - {product.size}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Jumlah</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setQuantity(Math.max(0, value));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quantity > 0) {
                  handleConfirm();
                }
              }}
              autoFocus
            />
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Harga satuan:</span>
            <span className="text-sm font-medium">{formatCurrency(Number(product.salePrice))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Subtotal:</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(subtotal)}</span>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={quantity <= 0}>
            Tambahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
