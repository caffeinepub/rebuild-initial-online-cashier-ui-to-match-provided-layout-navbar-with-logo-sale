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
import { useAddInventory } from '../hooks/useInventory';
import { isDuplicateInventoryName } from '../utils/inventoryName';
import type { InventoryItem } from '../backend';

interface InventoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryList: InventoryItem[];
}

export const CATEGORIES = ['Bahan Utama', 'Pendukung', 'Lain-Lain'] as const;
export const SIZES = ['Kecil', 'Besar', 'Jumbo'] as const;
export const UNITS = ['Pack', 'Pcs', 'Gram', 'ml'] as const;

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Normalize authentication errors
    if (message.includes('Unauthorized') || message.includes('not authenticated')) {
      return 'Anda perlu login terlebih dahulu untuk menambahkan inventori.';
    }
    
    // Normalize trap messages
    if (message.includes('trap')) {
      return 'Terjadi kesalahan pada server. Silakan coba lagi.';
    }
    
    return message;
  }
  
  return 'Gagal menyimpan inventori. Silakan coba lagi.';
}

export default function InventoryFormModal({ open, onOpenChange, inventoryList }: InventoryFormModalProps) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [unit, setUnit] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [reject, setReject] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addInventoryMutation = useAddInventory();

  // Auto-calculate finalStock = initialStock - reject
  const initialStockValue = parseInt(initialStock) || 0;
  const rejectValue = parseInt(reject) || 0;
  const minimumStockValue = parseInt(minimumStock) || 0;
  const finalStockValue = Math.max(0, initialStockValue - rejectValue);

  // Validation: check if reject > initialStock
  const hasValidationError = rejectValue > initialStockValue && initialStock !== '' && reject !== '';

  // Check for duplicate name
  const isDuplicate = itemName.trim() !== '' && isDuplicateInventoryName(itemName, inventoryList);

  // Clear error message when modal opens
  useEffect(() => {
    if (open) {
      setErrorMessage(null);
    }
  }, [open]);

  const handleClose = () => {
    // Reset form
    setItemName('');
    setCategory('');
    setSize('');
    setUnit('');
    setInitialStock('');
    setReject('');
    setMinimumStock('');
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      // Validate inputs
      if (!itemName.trim()) {
        setErrorMessage('Item barang wajib diisi');
        return;
      }

      // Check for duplicate name
      if (isDuplicateInventoryName(itemName, inventoryList)) {
        setErrorMessage('Item name already exists. Please use a different name.');
        return;
      }

      if (!category) {
        setErrorMessage('Kategori wajib dipilih');
        return;
      }

      if (!size) {
        setErrorMessage('Ukuran wajib dipilih');
        return;
      }

      if (!unit) {
        setErrorMessage('Satuan wajib dipilih');
        return;
      }

      if (isNaN(initialStockValue) || initialStockValue < 0) {
        setErrorMessage('Stok awal harus berupa angka yang valid');
        return;
      }

      if (isNaN(rejectValue) || rejectValue < 0) {
        setErrorMessage('Reject harus berupa angka yang valid');
        return;
      }

      if (isNaN(minimumStockValue) || minimumStockValue < 0) {
        setErrorMessage('Minimum Stock harus berupa angka yang valid');
        return;
      }

      // Validate reject not greater than initialStock
      if (rejectValue > initialStockValue) {
        setErrorMessage('Reject tidak boleh lebih besar dari stok awal');
        return;
      }

      // Call backend with calculated finalStock and minimumStock
      await addInventoryMutation.mutateAsync({
        itemName: itemName.trim(),
        category,
        size,
        unit,
        initialStock: BigInt(initialStockValue),
        reject: BigInt(rejectValue),
        finalStock: BigInt(finalStockValue),
        minimumStock: BigInt(minimumStockValue),
      });

      // Success - close modal and reset form
      handleClose();
    } catch (error) {
      console.error('Error menambahkan inventori:', error);
      setErrorMessage(normalizeErrorMessage(error));
      // Don't close modal on error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Tambah Inventori Baru</DialogTitle>
          <DialogDescription>
            Isi detail inventori di bawah ini. Semua kolom wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <form onSubmit={handleSubmit} id="inventory-form" className="space-y-6 pb-4">
            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Barang</Label>
              <Input
                id="item-name"
                type="text"
                placeholder="Masukkan nama item"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
              {isDuplicate && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Item name already exists. Please use a different name.</span>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Pilih kategori" />
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
              <Label htmlFor="size">Ukuran</Label>
              <Select value={size} onValueChange={setSize} required>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Pilih ukuran" />
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
              <Label htmlFor="unit">Satuan</Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Pilih satuan" />
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

            {/* Initial Stock */}
            <div className="space-y-2">
              <Label htmlFor="initial-stock">Stok Awal</Label>
              <Input
                id="initial-stock"
                type="number"
                min="0"
                step="1"
                placeholder="Masukkan stok awal"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                required
              />
            </div>

            {/* Reject */}
            <div className="space-y-2">
              <Label htmlFor="reject">Reject</Label>
              <Input
                id="reject"
                type="number"
                min="0"
                step="1"
                placeholder="Masukkan jumlah reject"
                value={reject}
                onChange={(e) => setReject(e.target.value)}
                required
              />
              {hasValidationError && (
                <p className="text-sm text-destructive">Reject tidak boleh lebih besar dari stok awal</p>
              )}
            </div>

            {/* Final Stock (Auto-calculated) */}
            <div className="space-y-2">
              <Label htmlFor="final-stock">Stok Akhir (Otomatis)</Label>
              <Input
                id="final-stock"
                type="number"
                value={finalStockValue}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Dihitung otomatis: Stok Awal - Reject</p>
            </div>

            {/* Minimum Stock */}
            <div className="space-y-2">
              <Label htmlFor="minimum-stock">Minimum Stock</Label>
              <Input
                id="minimum-stock"
                type="number"
                min="0"
                step="1"
                placeholder="Enter minimum stock threshold"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Alert will show when stock reaches or falls below this level</p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                {errorMessage}
              </div>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={addInventoryMutation.isPending}>
            Batal
          </Button>
          <Button 
            type="submit" 
            form="inventory-form"
            disabled={addInventoryMutation.isPending || isDuplicate || hasValidationError}
          >
            {addInventoryMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Inventori'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
