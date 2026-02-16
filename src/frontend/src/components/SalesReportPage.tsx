import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileDown, Edit, Trash2, X } from 'lucide-react';
import { useSalesReport } from '../hooks/useSalesReport';
import { useDeleteSale } from '../hooks/useSalesMutations';
import { useQueryClient } from '@tanstack/react-query';
import QueryErrorState from './QueryErrorState';
import EditSaleModal from './EditSaleModal';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/salesFormat';
import { exportSalesReportToXls } from '../utils/exportToXls';
import type { SaleRecord } from '../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LineItem {
  saleId: number;
  transactionDate: Date;
  paymentMethod: string;
  productName: string;
  quantity: number;
  cogs: number;
  unitPrice: number;
  lineTotal: number;
}

export default function SalesReportPage() {
  const queryClient = useQueryClient();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<number | null>(null);

  // Calculate date range for query
  const dateRange = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    let from = oneYearAgo;
    let to = now;

    if (fromDate) {
      from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
    }

    if (toDate) {
      to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
    }

    return {
      from: BigInt(from.getTime() * 1_000_000),
      to: BigInt(to.getTime() * 1_000_000),
    };
  }, [fromDate, toDate]);

  const { data: sales, isLoading, error, refetch } = useSalesReport(dateRange.from, dateRange.to);
  const deleteSaleMutation = useDeleteSale();

  // Convert sales to line items
  const lineItems = useMemo<LineItem[]>(() => {
    if (!sales) return [];

    const items: LineItem[] = [];
    sales.forEach((sale) => {
      const transactionDate = new Date(Number(sale.timestamp) / 1_000_000);
      const paymentMethod = getPaymentMethodLabel(sale.paymentMethod);

      sale.items.forEach((item) => {
        items.push({
          saleId: Number(sale.id),
          transactionDate,
          paymentMethod,
          productName: item.productName || `Produk #${item.productId}`,
          quantity: Number(item.quantity),
          cogs: Number(item.cogs),
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.quantity) * Number(item.unitPrice),
        });
      });
    });

    return items.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
  }, [sales]);

  const handleRetry = async () => {
    await queryClient.invalidateQueries({ queryKey: ['actor'] });
    await refetch();
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
  };

  const handleExport = () => {
    exportSalesReportToXls(lineItems);
  };

  const handleDelete = async () => {
    if (deletingSaleId === null) return;

    try {
      await deleteSaleMutation.mutateAsync(BigInt(deletingSaleId));
      setDeletingSaleId(null);
    } catch (error) {
      console.error('Failed to delete sale:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Laporan Penjualan</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Memuat laporan...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Laporan Penjualan</h2>
        </div>
        <QueryErrorState
          error={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Laporan Penjualan</h2>
          <p className="text-muted-foreground mt-1">Riwayat transaksi penjualan</p>
        </div>
        <Button onClick={handleExport} className="gap-2" disabled={lineItems.length === 0}>
          <FileDown className="h-4 w-4" />
          Export ke Excel
        </Button>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="fromDate">Dari Tanggal</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="toDate">Sampai Tanggal</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            {(fromDate || toDate) && (
              <Button variant="outline" onClick={handleClearFilter} className="gap-2">
                <X className="h-4 w-4" />
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Tidak ada transaksi dalam periode yang dipilih.
            </p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Tanggal & Waktu</TableHead>
                    <TableHead>Metode Pembayaran</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={`${item.saleId}-${index}`}>
                      <TableCell className="font-medium">{item.saleId}</TableCell>
                      <TableCell>{formatDateTime(item.transactionDate)}</TableCell>
                      <TableCell>{item.paymentMethod}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.cogs)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const sale = sales?.find((s) => Number(s.id) === item.saleId);
                              if (sale) setEditingSale(sale);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingSaleId(item.saleId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sale Modal */}
      {editingSale && (
        <EditSaleModal
          open={!!editingSale}
          onClose={() => setEditingSale(null)}
          sale={editingSale}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingSaleId !== null} onOpenChange={(open) => !open && setDeletingSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
