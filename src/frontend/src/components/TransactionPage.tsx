import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, ShoppingCart, ImageIcon } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useRecordSale } from '../hooks/useRecordSale';
import QuantityPromptModal from './QuantityPromptModal';
import QueryErrorState from './QueryErrorState';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import type { Product, SaleItem, PaymentMethod } from '../backend';
import { toast } from 'sonner';

export default function TransactionPage() {
  const { data: products, isLoading, error, refetch } = useProducts();
  const recordSale = useRecordSale();
  const { invalidateActorQueries } = useInvalidateActorQueries();

  const [cart, setCart] = useState<Map<string, { product: Product; quantity: number }>>(new Map());
  const [quantityModal, setQuantityModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai' as PaymentMethod);

  const handleAddToCart = (product: Product) => {
    setQuantityModal({ open: true, product });
  };

  const handleConfirmQuantity = (quantity: number) => {
    if (quantityModal.product) {
      const productId = quantityModal.product.id.toString();
      const existing = cart.get(productId);

      if (existing) {
        setCart(
          new Map(
            cart.set(productId, {
              product: quantityModal.product,
              quantity: existing.quantity + quantity,
            })
          )
        );
      } else {
        setCart(new Map(cart.set(productId, { product: quantityModal.product, quantity })));
      }

      setQuantityModal({ open: false, product: null });
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    const newCart = new Map(cart);
    newCart.delete(productId);
    setCart(newCart);
  };

  const calculateTotal = () => {
    let total = 0;
    cart.forEach(({ product, quantity }) => {
      total += Number(product.salePrice) * quantity;
    });
    return total;
  };

  const handleCheckout = async () => {
    if (cart.size === 0) {
      toast.error('Keranjang kosong', {
        description: 'Tambahkan produk ke keranjang terlebih dahulu.',
      });
      return;
    }

    const items: SaleItem[] = Array.from(cart.values()).map(({ product, quantity }) => ({
      productId: product.id,
      quantity: BigInt(quantity),
      unitPrice: product.salePrice,
      cogs: product.hpp,
      productName: product.name,
    }));

    try {
      await recordSale.mutateAsync({
        items,
        paymentMethod,
        totalTax: BigInt(0),
      });

      toast.success('Transaksi berhasil!', {
        description: 'Penjualan telah dicatat.',
      });

      setCart(new Map());
    } catch (err) {
      toast.error('Transaksi gagal', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan saat mencatat penjualan.',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleRetry = async () => {
    await invalidateActorQueries();
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
        <p className="text-muted-foreground mt-1">Catat penjualan dan kelola transaksi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Pilih Produk</h2>

          {isLoading ? (
            <div className="border border-border rounded-lg p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Memuat produk...</p>
            </div>
          ) : error ? (
            <QueryErrorState error={error} onRetry={handleRetry} />
          ) : !products || products.length === 0 ? (
            <div className="border border-border rounded-lg p-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Belum ada produk tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card
                  key={product.id.toString()}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleAddToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-muted rounded-md mb-2 overflow-hidden">
                      {product.image && product.image.getDirectURL ? (
                        <img
                          src={product.image.getDirectURL()}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">Ukuran: {product.size}</p>
                    <p className="text-sm font-bold text-primary">{formatCurrency(Number(product.salePrice))}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Keranjang</h2>

          <Card>
            <CardContent className="p-4 space-y-4">
              {cart.size === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keranjang kosong</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {Array.from(cart.values()).map(({ product, quantity }) => (
                      <div key={product.id.toString()} className="flex items-center gap-3 pb-3 border-b">
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                          {product.image && product.image.getDirectURL ? (
                            <img
                              src={product.image.getDirectURL()}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {quantity} x {formatCurrency(Number(product.salePrice))}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-semibold text-sm">
                            {formatCurrency(Number(product.salePrice) * quantity)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFromCart(product.id.toString())}
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-3 border-t">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Metode Pembayaran</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="tunai">Tunai</option>
                        <option value="dana">Dana</option>
                        <option value="qris">QRIS</option>
                        <option value="trf">Transfer</option>
                      </select>
                    </div>

                    <div className="flex justify-between items-center text-lg font-bold pt-2">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={recordSale.isPending}
                    >
                      {recordSale.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Memproses...
                        </>
                      ) : (
                        'Checkout'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {quantityModal.product && (
        <QuantityPromptModal
          open={quantityModal.open}
          onOpenChange={(open) => setQuantityModal({ ...quantityModal, open })}
          product={quantityModal.product}
          onConfirm={handleConfirmQuantity}
        />
      )}
    </div>
  );
}
