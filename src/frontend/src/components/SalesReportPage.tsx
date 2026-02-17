import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, Edit, Trash2, FileText } from 'lucide-react';
import { useSalesReport } from '../hooks/useSalesReport';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import QueryErrorState from './QueryErrorState';
import EditSaleModal from './EditSaleModal';
import { useDeleteSale } from '../hooks/useSalesMutations';
import { exportSalesReportToXls } from '../utils/exportToXls';
import { formatCurrency, getPaymentMethodLabel } from '../utils/salesFormat';
import type { SaleRecord, PaymentMethod } from '../backend';
import { toast } from 'sonner';

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(new Date().setHours(23, 59, 59, 999)),
  });

  const fromTimestamp = BigInt(dateRange.from.getTime() * 1000000);
  const toTimestamp = BigInt(dateRange.to.getTime() * 1000000);

  const { data: sales, isLoading, error, refetch } = useSalesReport(fromTimestamp, toTimestamp);
  const { invalidateActorQueries } = useInvalidateActorQueries();
  const deleteSale = useDeleteSale();

  const [editModal, setEditModal] = useState<{ open: boolean; sale: SaleRecord | null }>({
    open: false,
    sale: null,
  });

  const handleExport = () => {
    if (!sales || sales.length === 0) {
      toast.error('Tidak ada data', {
        description: 'Tidak ada transaksi untuk diekspor.',
      });
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
    toast.success('Ekspor berhasil', {
      description: 'Laporan penjualan telah diekspor ke Excel.',
    });
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    try {
      await deleteSale.mutateAsync(id);
      toast.success('Transaksi dihapus', {
        description: 'Transaksi berhasil dihapus.',
      });
    } catch (err) {
      toast.error('Gagal menghapus', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    }
  };

  const handleRetry = async () => {
    await invalidateActorQueries();
    await refetch();
  };

  const formatDateTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;
  const totalQuantity = sales?.reduce((sum, sale) => sum + Number(sale.totalQuantity), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan Penjualan</h1>
          <p className="text-muted-foreground mt-1">Lihat dan kelola riwayat transaksi penjualan</p>
        </div>
        <Button onClick={handleExport} className="gap-2" disabled={!sales || sales.length === 0}>
          <Download className="h-4 w-4" />
          Ekspor ke Excel
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Dari</label>
              <input
                type="date"
                value={dateRange.from.toISOString().split('T')[0]}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: new Date(e.target.value + 'T00:00:00') })
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sampai</label>
              <input
                type="date"
                value={dateRange.to.toISOString().split('T')[0]}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: new Date(e.target.value + 'T23:59:59') })
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Item Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalQuantity}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      {isLoading ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat laporan...</p>
        </div>
      ) : error ? (
        <QueryErrorState error={error} onRetry={handleRetry} />
      ) : !sales || sales.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Tidak ada transaksi</p>
          <p className="text-muted-foreground text-sm">
            Belum ada transaksi dalam rentang tanggal yang dipilih.
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
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead>Pembayaran</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.flatMap((sale) =>
                    sale.items.map((item, itemIndex) => (
                      <TableRow key={`${sale.id}-${itemIndex}`}>
                        {itemIndex === 0 && (
                          <TableCell rowSpan={sale.items.length} className="align-top">
                            {formatDateTime(sale.timestamp)}
                          </TableCell>
                        )}
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.unitPrice))}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                        </TableCell>
                        {itemIndex === 0 && (
                          <>
                            <TableCell rowSpan={sale.items.length} className="align-top">
                              {getPaymentMethodLabel(sale.paymentMethod)}
                            </TableCell>
                            <TableCell rowSpan={sale.items.length} className="align-top">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditModal({ open: true, sale })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(sale.id)}
                                  disabled={deleteSale.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {editModal.sale && (
        <EditSaleModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, sale: null })}
          sale={editModal.sale}
        />
      )}
    </div>
  );
}
