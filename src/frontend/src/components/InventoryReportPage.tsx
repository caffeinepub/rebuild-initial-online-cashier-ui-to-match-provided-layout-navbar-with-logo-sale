import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText } from 'lucide-react';
import { useInventoryReport } from '../hooks/useInventoryReport';
import QueryErrorState from './QueryErrorState';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import SignInRequiredState from './SignInRequiredState';

export default function InventoryReportPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const [filter, setFilter] = useState<string>('');
  const [daysBack, setDaysBack] = useState<number | null>(null);

  const { data: reports, isLoading, error, refetch } = useInventoryReport(
    filter || null,
    daysBack
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

  // Show sign-in required if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan Inventaris</h1>
          <p className="text-muted-foreground mt-1">Riwayat perubahan stok inventaris</p>
        </div>
        <SignInRequiredState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Laporan Inventaris</h1>
        <p className="text-muted-foreground mt-1">Riwayat perubahan stok inventaris</p>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="filter">Cari Deskripsi</Label>
              <Input
                id="filter"
                type="text"
                placeholder="Cari berdasarkan deskripsi..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daysBack">Rentang Waktu</Label>
              <Select
                value={daysBack?.toString() || 'all'}
                onValueChange={(value) => setDaysBack(value === 'all' ? null : parseInt(value))}
              >
                <SelectTrigger id="daysBack">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="7">7 Hari Terakhir</SelectItem>
                  <SelectItem value="30">30 Hari Terakhir</SelectItem>
                  <SelectItem value="90">90 Hari Terakhir</SelectItem>
                </SelectContent>
              </Select>
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
        <QueryErrorState
          error={error}
          onRetry={handleRetry}
        />
      ) : !reports || reports.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Tidak ada data laporan</p>
          <p className="text-muted-foreground text-sm">
            Belum ada perubahan stok yang tercatat.
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
                    <TableHead>Item</TableHead>
                    <TableHead>Ukuran</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Deskripsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(report.timestamp)}
                      </TableCell>
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
