import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useRecordSale } from '../hooks/useRecordSale';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, ShoppingCart, CreditCard, AlertCircle } from 'lucide-react';
import QuantityPromptModal from './QuantityPromptModal';
import QueryErrorState from './QueryErrorState';
import type { Product, PaymentMethod } from '../backend';

type CartItem = {
  id: string;
  productId: bigint;
  quantity: number;
};

type Step = 'cart' | 'payment';

export default function TransactionPage() {
  const { data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts();
  const { mutate: recordSale, isPending: isRecording, error: saleError } = useRecordSale();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [step, setStep] = useState<Step>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [quantityModalOpen, setQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setQuantityModalOpen(true);
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (!selectedProduct) return;

    // Check if product already in cart
    const existingItemIndex = cartItems.findIndex(
      (item) => item.productId === selectedProduct.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += quantity;
      setCartItems(updatedCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `${selectedProduct.id}-${Date.now()}`,
        productId: selectedProduct.id,
        quantity,
      };
      setCartItems([...cartItems, newItem]);
    }

    setQuantityModalOpen(false);
    setSelectedProduct(null);
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const getProductById = (productId: bigint): Product | undefined => {
    return products?.find((p) => p.id === productId);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = getProductById(item.productId);
      if (!product) return total;
      return total + Number(product.salePrice) * item.quantity;
    }, 0);
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) return;
    setStep('payment');
  };

  const handleBackToCart = () => {
    setStep('cart');
    setPaymentMethod(null);
  };

  const handleCompleteSale = () => {
    if (!paymentMethod || cartItems.length === 0) return;

    const saleItems = cartItems.map((item) => {
      const product = getProductById(item.productId);
      return {
        productId: item.productId,
        quantity: BigInt(item.quantity),
        unitPrice: product?.salePrice || BigInt(0),
        cogs: BigInt(0),
        productName: product?.name || '',
      };
    });

    recordSale(
      { items: saleItems, paymentMethod },
      {
        onSuccess: () => {
          // Reset state
          setCartItems([]);
          setPaymentMethod(null);
          setStep('cart');
        },
      }
    );
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (productsError) {
    return (
      <QueryErrorState
        error={productsError}
        onRetry={() => refetchProducts()}
        title="Failed to load products"
        message="Unable to load product list. Please try again."
        isAuthenticated={isAuthenticated}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
        <p className="text-muted-foreground mt-1">Kelola transaksi penjualan</p>
      </div>

      {step === 'cart' ? (
        <>
          {/* Product Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Pilih Produk</CardTitle>
            </CardHeader>
            <CardContent>
              {!products || products.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Belum ada produk tersedia. Tambahkan produk terlebih dahulu.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <button
                      key={product.id.toString()}
                      onClick={() => handleProductClick(product)}
                      className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow text-left"
                    >
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image.getDirectURL()}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.size}</p>
                        <p className="text-sm font-bold text-primary">
                          {formatCurrency(Number(product.salePrice))}
                        </p>
                      </div>
                    </button>
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
                Keranjang ({cartItems.length} item)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Keranjang kosong. Pilih produk untuk memulai transaksi.
                </p>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const product = getProductById(item.productId);
                    if (!product) return null;

                    const subtotal = Number(product.salePrice) * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b border-border pb-4"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(Number(product.salePrice))} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold">{formatCurrency(subtotal)}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>

                  <Button
                    onClick={handleProceedToPayment}
                    className="w-full"
                    size="lg"
                  >
                    Lanjut ke Pembayaran
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Payment Step */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pilih Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="border border-border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Ringkasan Pesanan</h3>
              <div className="space-y-2">
                {cartItems.map((item) => {
                  const product = getProductById(item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {product.name} × {item.quantity}
                      </span>
                      <span>{formatCurrency(Number(product.salePrice) * item.quantity)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Metode Pembayaran</Label>
              <RadioGroup
                value={paymentMethod || ''}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="tunai" id="tunai" />
                    <Label htmlFor="tunai" className="flex-1 cursor-pointer">
                      Tunai
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="dana" id="dana" />
                    <Label htmlFor="dana" className="flex-1 cursor-pointer">
                      Dana
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="qris" id="qris" />
                    <Label htmlFor="qris" className="flex-1 cursor-pointer">
                      QRIS
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="trf" id="trf" />
                    <Label htmlFor="trf" className="flex-1 cursor-pointer">
                      Transfer Bank
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Error Alert */}
            {saleError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Gagal menyimpan transaksi. Silakan coba lagi.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBackToCart}
                disabled={isRecording}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                onClick={handleCompleteSale}
                disabled={!paymentMethod || isRecording}
                className="flex-1"
              >
                {isRecording ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Selesaikan Transaksi'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quantity Prompt Modal */}
      {selectedProduct && (
        <QuantityPromptModal
          open={quantityModalOpen}
          onOpenChange={setQuantityModalOpen}
          product={selectedProduct}
          onConfirm={handleQuantityConfirm}
        />
      )}
    </div>
  );
}
