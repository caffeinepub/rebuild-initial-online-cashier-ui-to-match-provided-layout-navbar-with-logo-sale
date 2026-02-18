import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText } from 'lucide-react';
import { useExpenseRecords } from '../hooks/useExpenses';
import QueryErrorState from './QueryErrorState';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import SignInRequiredState from './SignInRequiredState';

export default function ExpenseReportPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const { data: expenses, isLoading, error, refetch } = useExpenseRecords();
  const { invalidateActorQueries } = useInvalidateActorQueries();

  const formatCurrency = (value: bigint | number) => {
    const numValue = typeof value === 'bigint' ? Number(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'bahan-baku': 'Bahan Baku',
      'operasional': 'Operasional',
      'lain-lain': 'Lain-lain',
    };
    return labels[category] || category;
  };

  const grandTotal = expenses?.reduce((sum, expense) => sum + Number(expense.total), 0) || 0;

  const handleRetry = async () => {
    await invalidateActorQueries();
    await refetch();
  };

  // Show sign-in required if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan Pengeluaran</h1>
          <p className="text-muted-foreground mt-1">Lihat riwayat pengeluaran usaha</p>
        </div>
        <SignInRequiredState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Laporan Pengeluaran</h1>
        <p className="text-muted-foreground mt-1">Lihat riwayat pengeluaran usaha</p>
      </div>

      {/* Grand Total Card */}
      {expenses && expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
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
      ) : !expenses || expenses.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Tidak ada data pengeluaran</p>
          <p className="text-muted-foreground text-sm">
            Catat pengeluaran melalui menu Pengeluaran untuk melihat laporan.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Bulan Tahun</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>PIC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id.toString()}>
                      <TableCell className="whitespace-nowrap">{expense.date}</TableCell>
                      <TableCell>{expense.monthYear}</TableCell>
                      <TableCell className="font-medium">{expense.item}</TableCell>
                      <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(expense.nominalAmount)}
                      </TableCell>
                      <TableCell className="text-right">{Number(expense.quantity)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(expense.total)}
                      </TableCell>
                      <TableCell>{expense.picName}</TableCell>
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
