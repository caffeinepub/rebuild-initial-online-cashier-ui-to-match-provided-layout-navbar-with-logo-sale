import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ShoppingCart, Loader2, Package } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useRecordSale } from '../hooks/useRecordSale';
import QuantityPromptModal from './QuantityPromptModal';
import type { Product, PaymentMethod, SaleItem } from '../backend';
import { toast } from 'sonner';
import QueryErrorState from './QueryErrorState';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import SignInRequiredState from './SignInRequiredState';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function TransactionPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai' as PaymentMethod);

  const { data: products, isLoading, error, refetch } = useProducts();
  const recordSale = useRecordSale();
  const { invalidateActorQueries } = useInvalidateActorQueries();

  const formatCurrency = (value: bigint | number) => {
    const numValue = typeof value === 'bigint' ? Number(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const handleAddToCart = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleConfirmQuantity = (quantity: number) => {
    if (!selectedProduct) return;

    const existingItem = cart.find((item) => item.product.id === selectedProduct.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === selectedProduct.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart([...cart, { product: selectedProduct, quantity }]);
    }

    setSelectedProduct(null);
  };

  const handleRemoveFromCart = (productId: bigint) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.product.salePrice) * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong', {
        description: 'Tambahkan produk ke keranjang terlebih dahulu.',
      });
      return;
    }

    const saleItems: SaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      quantity: BigInt(item.quantity),
      unitPrice: item.product.salePrice,
      cogs: item.product.hpp,
      productName: item.product.name,
    }));

    try {
      await recordSale.mutateAsync({
        items: saleItems,
        paymentMethod,
        totalTax: BigInt(0),
      });

      toast.success('Transaksi berhasil', {
        description: 'Penjualan telah dicatat.',
      });

      setCart([]);
      setPaymentMethod('tunai' as PaymentMethod);
    } catch (err) {
      toast.error('Transaksi gagal', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan saat mencatat penjualan.',
      });
    }
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
          <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground mt-1">Catat penjualan produk Anda</p>
        </div>
        <SignInRequiredState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
        <p className="text-muted-foreground mt-1">Catat penjualan produk Anda</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Pilih Produk</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <QueryErrorState
                error={error}
                onRetry={handleRetry}
              />
            ) : !products || products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada produk tersedia</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-[500px] overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id.toString()}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.size} • {formatCurrency(product.salePrice)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keranjang kosong
              </div>
            ) : (
              <>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product.id.toString()}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(item.product.salePrice)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(Number(item.product.salePrice) * item.quantity)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Metode Pembayaran</label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tunai">Tunai</SelectItem>
                        <SelectItem value="dana">Dana</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                        <SelectItem value="trf">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={recordSale.isPending}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {recordSale.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Checkout
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedProduct && (
        <QuantityPromptModal
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          product={selectedProduct}
          onConfirm={handleConfirmQuantity}
        />
      )}
    </div>
  );
}
