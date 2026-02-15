import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Package } from 'lucide-react';
import InventoryFormModal from './InventoryFormModal';
import AdjustStockModal from './AdjustStockModal';
import EditInventoryItemModal from './EditInventoryItemModal';
import { useInventory } from '../hooks/useInventory';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import QueryErrorState from './QueryErrorState';
import type { InventoryItem } from '../backend';
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function InventoryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [adjustStockModal, setAdjustStockModal] = useState<{
    open: boolean;
    item: InventoryItem | null;
    mode: 'add' | 'reduce';
  }>({ open: false, item: null, mode: 'add' });
  const [editModal, setEditModal] = useState<{
    open: boolean;
    item: InventoryItem | null;
  }>({ open: false, item: null });

  const { data: inventory, isLoading, error, refetch } = useInventory();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const handleAddStock = (item: InventoryItem) => {
    setAdjustStockModal({ open: true, item, mode: 'add' });
  };

  const handleReduceStock = (item: InventoryItem) => {
    setAdjustStockModal({ open: true, item, mode: 'reduce' });
  };

  const handleEdit = (item: InventoryItem) => {
    setEditModal({ open: true, item });
  };

  const handleRetry = async () => {
    // Invalidate actor query to trigger re-initialization, then refetch inventory
    await queryClient.invalidateQueries({ queryKey: ['actor'] });
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventori</h1>
          <p className="text-muted-foreground mt-1">Kelola stok bahan dan inventori</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Inventori
        </Button>
      </div>

      {isLoading ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat inventori...</p>
        </div>
      ) : error ? (
        <QueryErrorState
          error={error}
          onRetry={handleRetry}
          title="Failed to load inventory"
          message="Unable to load inventory list. Please try again."
          isAuthenticated={isAuthenticated}
        />
      ) : !inventory || inventory.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Belum ada inventori</p>
          <p className="text-muted-foreground text-sm">
            Klik tombol "Tambah Inventori" untuk memulai menambahkan item inventori.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead className="text-right">Stok Awal</TableHead>
                <TableHead className="text-right">Reject</TableHead>
                <TableHead className="text-right">Stok Akhir</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{Number(item.initialStock)}</TableCell>
                  <TableCell className="text-right">{Number(item.reject)}</TableCell>
                  <TableCell className="text-right font-semibold">{Number(item.finalStock)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddStock(item)}
                      >
                        Add Stock
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReduceStock(item)}
                      >
                        Reduce Stock
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InventoryFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        inventoryList={inventory || []}
      />

      {adjustStockModal.item && (
        <AdjustStockModal
          open={adjustStockModal.open}
          onOpenChange={(open) =>
            setAdjustStockModal({ open, item: null, mode: 'add' })
          }
          item={adjustStockModal.item}
          mode={adjustStockModal.mode}
        />
      )}

      {editModal.item && (
        <EditInventoryItemModal
          open={editModal.open}
          onOpenChange={(open) => setEditModal({ open, item: null })}
          item={editModal.item}
          inventoryList={inventory || []}
        />
      )}
    </div>
  );
}
