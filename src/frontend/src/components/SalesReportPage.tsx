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
import { useInternetIdentity } from '../hooks/useInternetIdentity';
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
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

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

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['actor'] });
    refetch();
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
          <h2 className="text-3xl font-bold text-foreground">Laporan Penjualan</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Memuat data...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground">Laporan Penjualan</h2>
        </div>
        <QueryErrorState
          error={error}
          onRetry={handleRetry}
          title="Gagal memuat laporan"
          message="Terjadi kesalahan saat memuat data laporan penjualan."
          isAuthenticated={isAuthenticated}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Laporan Penjualan</h2>
        <Button onClick={handleExport} disabled={lineItems.length === 0}>
          <FileDown className="h-4 w-4 mr-2" />
          Export ke Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">Dari Tanggal</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">Sampai Tanggal</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilter}
                disabled={!fromDate && !toDate}
              >
                <X className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Tidak ada data transaksi untuk periode yang dipilih.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transaksi</TableHead>
                    <TableHead>Tanggal & Jam</TableHead>
                    <TableHead>Metode Pembayaran</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">HPP</TableHead>
                    <TableHead className="text-right">Harga Jual</TableHead>
                    <TableHead className="text-right">Harga Total</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
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
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.lineTotal)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const sale = sales?.find((s) => Number(s.id) === item.saleId);
                              if (sale) setEditingSale(sale);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
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

      {editingSale && (
        <EditSaleModal
          sale={editingSale}
          open={!!editingSale}
          onClose={() => setEditingSale(null)}
        />
      )}

      <AlertDialog open={deletingSaleId !== null} onOpenChange={() => setDeletingSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSaleMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteSaleMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
