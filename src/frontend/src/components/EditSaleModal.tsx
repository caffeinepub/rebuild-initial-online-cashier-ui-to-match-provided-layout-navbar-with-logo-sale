import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { useUpdateSale } from '../hooks/useSalesMutations';
import { formatCurrency, getPaymentMethodLabel } from '../utils/salesFormat';
import type { SaleRecord, PaymentMethod, SaleItem } from '../backend';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditSaleModalProps {
  sale: SaleRecord;
  open: boolean;
  onClose: () => void;
}

interface EditableItem extends SaleItem {
  tempId: string;
}

export default function EditSaleModal({ sale, open, onClose }: EditSaleModalProps) {
  const updateSaleMutation = useUpdateSale();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale.paymentMethod);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPaymentMethod(sale.paymentMethod);
      setItems(
        sale.items.map((item, index) => ({
          ...item,
          tempId: `${item.productId}-${index}`,
        }))
      );
      setError(null);
    }
  }, [sale, open]);

  const handleItemChange = (tempId: string, field: keyof SaleItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId === tempId) {
          const numValue = BigInt(Math.max(0, parseInt(value) || 0));
          return { ...item, [field]: numValue };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleSubmit = async () => {
    setError(null);

    if (items.length === 0) {
      setError('Minimal harus ada satu item produk.');
      return;
    }

    const hasInvalidQuantity = items.some((item) => Number(item.quantity) <= 0);
    if (hasInvalidQuantity) {
      setError('Semua item harus memiliki quantity lebih dari 0.');
      return;
    }

    const hasInvalidPrice = items.some((item) => Number(item.unitPrice) <= 0);
    if (hasInvalidPrice) {
      setError('Semua item harus memiliki harga jual lebih dari 0.');
      return;
    }

    try {
      const cleanItems: SaleItem[] = items.map(({ tempId, ...item }) => item);
      await updateSaleMutation.mutateAsync({
        id: sale.id,
        items: cleanItems,
        paymentMethod,
        totalTax: sale.totalTax,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate transaksi.');
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Transaksi #{Number(sale.id)}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunai">Tunai</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="dana">DANA</SelectItem>
                  <SelectItem value="trf">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Item Produk</Label>
              {items.map((item) => (
                <div
                  key={item.tempId}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.productName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.tempId)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`qty-${item.tempId}`}>Quantity</Label>
                      <Input
                        id={`qty-${item.tempId}`}
                        type="number"
                        min="1"
                        value={Number(item.quantity)}
                        onChange={(e) =>
                          handleItemChange(item.tempId, 'quantity', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`cogs-${item.tempId}`}>HPP</Label>
                      <Input
                        id={`cogs-${item.tempId}`}
                        type="number"
                        min="0"
                        value={Number(item.cogs)}
                        onChange={(e) => handleItemChange(item.tempId, 'cogs', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`price-${item.tempId}`}>Harga Jual</Label>
                      <Input
                        id={`price-${item.tempId}`}
                        type="number"
                        min="0"
                        value={Number(item.unitPrice)}
                        onChange={(e) =>
                          handleItemChange(item.tempId, 'unitPrice', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Subtotal: {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateSaleMutation.isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={updateSaleMutation.isPending}>
            {updateSaleMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
