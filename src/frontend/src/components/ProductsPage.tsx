import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Package, ImageIcon, ArrowLeft } from 'lucide-react';
import ProductFormModal from './ProductFormModal';
import { useProducts } from '../hooks/useProducts';
import QueryErrorState from './QueryErrorState';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import SignInRequiredState from './SignInRequiredState';

interface ProductsPageProps {
  onNavigateDashboard: () => void;
}

export default function ProductsPage({ onNavigateDashboard }: ProductsPageProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: products, isLoading, error, refetch } = useProducts();
  const { invalidateActorQueries } = useInvalidateActorQueries();

  const formatCurrency = (value: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(value));
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
            <h1 className="text-3xl font-bold text-foreground">Produk</h1>
            <p className="text-muted-foreground mt-1">Kelola katalog produk Anda</p>
          </div>
          <Button
            variant="outline"
            onClick={onNavigateDashboard}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Button>
        </div>
        <SignInRequiredState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produk</h1>
          <p className="text-muted-foreground mt-1">Kelola katalog produk Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onNavigateDashboard}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat produk...</p>
        </div>
      ) : error ? (
        <QueryErrorState
          error={error}
          onRetry={handleRetry}
        />
      ) : !products || products.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">Belum ada produk</p>
          <p className="text-muted-foreground text-sm">
            Klik tombol "Tambah Produk" untuk memulai menambahkan produk ke katalog Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <div
              key={product.id.toString()}
              className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
            >
              {/* Product Image */}
              <div className="aspect-square bg-muted relative overflow-hidden">
                {product.image && product.image.getDirectURL ? (
                  <img
                    src={product.image.getDirectURL()}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-1">
                <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ukuran: {product.size}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(product.salePrice)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductFormModal open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
