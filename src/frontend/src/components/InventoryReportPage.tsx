import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText } from 'lucide-react';
import { useInventoryReport } from '../hooks/useInventoryReport';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import QueryErrorState from './QueryErrorState';

export default function InventoryReportPage() {
  const [filter, setFilter] = useState<string>('');
  const [daysBack, setDaysBack] = useState<number>(7);

  const { data: reports, isLoading, error, refetch } = useInventoryReport(
    filter || null,
    daysBack > 0 ? daysBack : null
  );
  const { invalidateActorQueries } = useInvalidateActorQueries();

  const formatDateTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const handleRetry = async () => {
    await invalidateActorQueries();
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Laporan Inventori</h1>
        <p className="text-muted-foreground mt-1">Lihat riwayat penyesuaian stok inventori</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Cari Deskripsi</label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Cari berdasarkan deskripsi..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Periode (Hari)</label>
              <select
                value={daysBack}
                onChange={(e) => setDaysBack(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value={7}>7 Hari Terakhir</option>
                <option value={14}>14 Hari Terakhir</option>
                <option value={30}>30 Hari Terakhir</option>
                <option value={90}>90 Hari Terakhir</option>
                <option value={0}>Semua</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      {isLoading ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat laporan...</p>
        </div>
      ) : error ? (
        <QueryErrorState error={error} onRetry={handleRetry} />
      ) : !reports || reports.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Tidak ada riwayat</p>
          <p className="text-muted-foreground text-sm">
            Belum ada riwayat penyesuaian stok dalam periode yang dipilih.
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
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Ukuran</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Deskripsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDateTime(report.timestamp)}</TableCell>
                      <TableCell className="font-medium">{report.itemName}</TableCell>
                      <TableCell>{report.itemSize}</TableCell>
                      <TableCell className="text-right">{Number(report.quantity)}</TableCell>
                      <TableCell>{report.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
