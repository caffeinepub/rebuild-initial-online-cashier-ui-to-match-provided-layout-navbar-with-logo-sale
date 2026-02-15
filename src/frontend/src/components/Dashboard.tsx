import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Package, Wallet, Smartphone, QrCode, CreditCard } from 'lucide-react';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2 } from 'lucide-react';
import QueryErrorState from './QueryErrorState';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const { data: summary, isLoading, error, refetch } = useDashboardSummary();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

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

  const handleRetry = async () => {
    // Invalidate actor query to trigger re-initialization, then refetch dashboard data
    await queryClient.invalidateQueries({ queryKey: ['actor'] });
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
        title="Failed to load dashboard"
        message="Unable to load dashboard data. Please try again."
        isAuthenticated={isAuthenticated}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Informasi Penjualan Hari Ini</CardTitle>
            <Banknote className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(summary?.todayRevenue || BigInt(0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total pendapatan hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Total Jumlah Penjualan Hari Ini</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {Number(summary?.totalQuantitySold || BigInt(0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total item terjual hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Rekapan Metode Pembayaran</h2>
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
                  <p className="text-xs text-muted-foreground mt-1">Total transaksi</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
