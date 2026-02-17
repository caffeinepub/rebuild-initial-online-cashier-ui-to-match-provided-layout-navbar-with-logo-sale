import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, Package, Wallet, Smartphone, QrCode, CreditCard } from 'lucide-react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useInventory } from '../hooks/useInventory';
import { Loader2 } from 'lucide-react';
import QueryErrorState from './QueryErrorState';
import LowStockBanner from './LowStockBanner';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import type { InventoryItem } from '../backend';

export default function Dashboard() {
  const { data: summary, isLoading, error, refetch } = useDashboardSummary();
  const { data: inventory, isLoading: inventoryLoading } = useInventory();
  const { invalidateActorQueries } = useInvalidateActorQueries();

  const formatCurrency = (value: bigint | number) => {
    const numValue = typeof value === 'bigint' ? Number(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const paymentMethods = [
    { id: 'tunai', label: 'Tunai', icon: Banknote, value: summary?.paymentMethodTotals.tunai || BigInt(0) },
    { id: 'dana', label: 'Dana', icon: Wallet, value: summary?.paymentMethodTotals.dana || BigInt(0) },
    { id: 'qris', label: 'QRIS', icon: QrCode, value: summary?.paymentMethodTotals.qris || BigInt(0) },
    { id: 'trf', label: 'TRF', icon: CreditCard, value: summary?.paymentMethodTotals.trf || BigInt(0) },
  ];

  // Compute low stock items: finalStock <= minimumStock
  const lowStockItems: InventoryItem[] = inventory?.filter(
    (item) => Number(item.finalStock) <= Number(item.minimumStock)
  ) || [];

  const handleRetry = async () => {
    await invalidateActorQueries();
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <QueryErrorState
        error={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Low Stock Banner - appears above sales info when items are low */}
      <LowStockBanner lowStockItems={lowStockItems} />

      {/* Summary Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Today Sales Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Today's Revenue</CardTitle>
              <Banknote className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(summary?.todayRevenue || BigInt(0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total revenue today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Total Quantity Sold Today</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {Number(summary?.totalQuantitySold || BigInt(0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total items sold today</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Payment Method Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Card key={method.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{method.label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatCurrency(method.value)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total transactions</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Inventory List Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Inventory Stock Information</h2>
        <Card>
          <CardContent className="p-0">
            {inventoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !inventory || inventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No inventory data available
              </div>
            ) : (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => {
                    const isLowStock = Number(item.finalStock) <= Number(item.minimumStock);
                    return (
                      <TableRow
                        key={Number(item.id)}
                        className={isLowStock ? 'bg-[oklch(var(--warning-low-stock))] hover:bg-[oklch(var(--warning-low-stock))] dark:bg-[oklch(var(--warning-low-stock))] dark:hover:bg-[oklch(var(--warning-low-stock))]' : ''}
                      >
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">{Number(item.initialStock)}</TableCell>
                        <TableCell className="text-right">{Number(item.reject)}</TableCell>
                        <TableCell className="text-right font-semibold">{Number(item.finalStock)}</TableCell>
                        <TableCell className="text-right">{Number(item.minimumStock)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
