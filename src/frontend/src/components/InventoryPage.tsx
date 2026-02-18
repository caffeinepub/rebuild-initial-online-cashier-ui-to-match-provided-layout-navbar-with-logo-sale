import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, TrendingUp, TrendingDown, Loader2, Package } from 'lucide-react';
import InventoryFormModal from './InventoryFormModal';
import EditInventoryItemModal from './EditInventoryItemModal';
import AdjustStockModal from './AdjustStockModal';
import { useInventory } from '../hooks/useInventory';
import type { InventoryItem } from '../backend';
import QueryErrorState from './QueryErrorState';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import { isLowStock } from '../utils/lowStock';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import SignInRequiredState from './SignInRequiredState';

export default function InventoryPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustmentMode, setAdjustmentMode] = useState<'add' | 'reduce'>('add');

  const { data: inventory, isLoading, error, refetch } = useInventory();
  const { invalidateActorQueries } = useInvalidateActorQueries();

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
  };

  const handleAdjustStock = (item: InventoryItem, mode: 'add' | 'reduce') => {
    setAdjustingItem(item);
    setAdjustmentMode(mode);
  };

  const handleRetry = async () => {
    await invalidateActorQueries();
    await refetch();
  };

  // Show sign-in required if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventaris</h1>
            <p className="text-muted-foreground mt-1">Kelola stok barang Anda</p>
          </div>
        </div>
        <SignInRequiredState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventaris</h1>
          <p className="text-muted-foreground mt-1">Kelola stok barang Anda</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Item
        </Button>
      </div>

      {isLoading ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat inventaris...</p>
        </div>
      ) : error ? (
        <QueryErrorState
          error={error}
          onRetry={handleRetry}
        />
      ) : !inventory || inventory.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Belum ada item inventaris</p>
          <p className="text-muted-foreground text-sm">
            Klik tombol "Tambah Item" untuk memulai menambahkan item ke inventaris Anda.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Initial Stock</TableHead>
                <TableHead className="text-right">Reject</TableHead>
                <TableHead className="text-right">Final Stock</TableHead>
                <TableHead className="text-right">Minimum Stock</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const itemIsLowStock = isLowStock(item);
                return (
                  <TableRow
                    key={Number(item.id)}
                    className={itemIsLowStock ? 'bg-[oklch(var(--warning-low-stock))] hover:bg-[oklch(var(--warning-low-stock))] dark:bg-[oklch(var(--warning-low-stock))] dark:hover:bg-[oklch(var(--warning-low-stock))]' : ''}
                  >
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{Number(item.initialStock)}</TableCell>
                    <TableCell className="text-right">{Number(item.reject)}</TableCell>
                    <TableCell className="text-right font-semibold">{Number(item.finalStock)}</TableCell>
                    <TableCell className="text-right">{Number(item.minimumStock)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAdjustStock(item, 'add')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAdjustStock(item, 'reduce')}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <TrendingDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <InventoryFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        inventoryList={inventory || []}
      />

      {editingItem && (
        <EditInventoryItemModal
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          inventoryList={inventory || []}
        />
      )}

      {adjustingItem && (
        <AdjustStockModal
          open={!!adjustingItem}
          onOpenChange={(open) => !open && setAdjustingItem(null)}
          item={adjustingItem}
          mode={adjustmentMode}
        />
      )}
    </div>
  );
}
