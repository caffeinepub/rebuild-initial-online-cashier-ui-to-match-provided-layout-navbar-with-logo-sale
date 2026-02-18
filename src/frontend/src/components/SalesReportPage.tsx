import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Edit, Trash2, Loader2, FileText } from 'lucide-react';
import { useSalesReport } from '../hooks/useSalesReport';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/salesFormat';
import { exportSalesReportToXls } from '../utils/exportToXls';
import EditSaleModal from './EditSaleModal';
import type { SaleRecord } from '../backend';
import { useDeleteSale } from '../hooks/useSalesMutations';
import { toast } from 'sonner';
import QueryErrorState from './QueryErrorState';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import SignInRequiredState from './SignInRequiredState';

export default function SalesReportPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);

  const fromTimestamp = startDate ? BigInt(new Date(startDate).getTime() * 1000000) : BigInt(0);
  const toTimestamp = endDate
    ? BigInt(new Date(endDate).setHours(23, 59, 59, 999) * 1000000)
    : BigInt(Date.now() * 1000000);

  const { data: sales, isLoading, error, refetch } = useSalesReport(fromTimestamp, toTimestamp);
  const deleteSale = useDeleteSale();
  const { invalidateActorQueries } = useInvalidateActorQueries();

  const handleDelete = async (id: bigint) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    try {
      await deleteSale.mutateAsync(id);
      toast.success('Transaksi berhasil dihapus');
    } catch (err) {
      toast.error('Gagal menghapus transaksi', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan',
      });
    }
  };

  const handleExport = () => {
    if (!sales || sales.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    // Convert sales to line items format
    const lineItems = sales.flatMap((sale) =>
      sale.items.map((item) => ({
        saleId: Number(sale.id),
        transactionDate: new Date(Number(sale.timestamp) / 1000000),
        paymentMethod: getPaymentMethodLabel(sale.paymentMethod),
        productName: item.productName,
        quantity: Number(item.quantity),
        cogs: Number(item.cogs),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.quantity) * Number(item.unitPrice),
      }))
    );

    exportSalesReportToXls(lineItems);
    toast.success('Laporan berhasil diekspor');
  };

  const handleRetry = async () => {
    await invalidateActorQueries();
    await refetch();
  };

  const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;
  const totalQuantity = sales?.reduce((sum, sale) => sum + Number(sale.totalQuantity), 0) || 0;

  // Show sign-in required if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan Penjualan</h1>
          <p className="text-muted-foreground mt-1">Lihat dan kelola riwayat penjualan</p>
        </div>
        <SignInRequiredState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan Penjualan</h1>
          <p className="text-muted-foreground mt-1">Lihat dan kelola riwayat penjualan</p>
        </div>
        <Button onClick={handleExport} disabled={!sales || sales.length === 0} className="gap-2">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {sales && sales.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Quantity Terjual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalQuantity}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Table */}
      {isLoading ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat laporan...</p>
        </div>
      ) : error ? (
        <QueryErrorState
          error={error}
          onRetry={handleRetry}
        />
      ) : !sales || sales.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Tidak ada data penjualan</p>
          <p className="text-muted-foreground text-sm">
            Pilih rentang tanggal atau lakukan transaksi untuk melihat laporan.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal & Waktu</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Metode Pembayaran</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id.toString()}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(new Date(Number(sale.timestamp) / 1000000))}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              {item.productName} x{Number(item.quantity)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(sale.paymentMethod)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(sale.amount))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSale(sale)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sale.id)}
                            disabled={deleteSale.isPending}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {editingSale && (
        <EditSaleModal
          open={!!editingSale}
          onClose={() => setEditingSale(null)}
          sale={editingSale}
        />
      )}
    </div>
  );
}
