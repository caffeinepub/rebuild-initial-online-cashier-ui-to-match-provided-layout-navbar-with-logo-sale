import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useRecordSale } from '../hooks/useRecordSale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, ShoppingCart, CreditCard, AlertCircle, ImageIcon } from 'lucide-react';
import QuantityPromptModal from './QuantityPromptModal';
import QueryErrorState from './QueryErrorState';
import SignInRequiredState from './SignInRequiredState';
import { useInvalidateActorQueries } from '../hooks/useInvalidateActorQueries';
import { normalizeErrorMessage } from '../utils/errorMessage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
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
  const { invalidateActorQueries } = useInvalidateActorQueries();
  const { identity } = useInternetIdentity();

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
      {
        items: saleItems,
        paymentMethod,
        totalTax: BigInt(0),
      },
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

  const handleRetry = async () => {
    await invalidateActorQueries();
    await refetchProducts();
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (productsError) {
    const normalizedError = normalizeErrorMessage(productsError);
    
    if (normalizedError.isAuthError && !identity) {
      return (
        <SignInRequiredState
          title="Sign In to Record Transactions"
          description="You need to sign in with Internet Identity to record sales transactions."
        />
      );
    }

    return (
      <QueryErrorState
        error={productsError}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
        <p className="text-muted-foreground mt-1">Catat penjualan produk</p>
      </div>

      {step === 'cart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Pilih Produk</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products?.map((product) => (
                <button
                  key={product.id.toString()}
                  onClick={() => handleProductClick(product)}
                  className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow text-left"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
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
          </div>

          {/* Cart */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Keranjang kosong
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cartItems.map((item) => {
                        const product = getProductById(item.productId);
                        if (!product) return null;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-2 border border-border rounded"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} x {formatCurrency(Number(product.salePrice))}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">
                                {formatCurrency(Number(product.salePrice) * item.quantity)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total:</span>
                        <span className="text-xl font-bold text-primary">
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Pilih Metode Pembayaran</Label>
              <RadioGroup
                value={paymentMethod || ''}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tunai" id="tunai" />
                  <Label htmlFor="tunai" className="cursor-pointer">
                    Tunai
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dana" id="dana" />
                  <Label htmlFor="dana" className="cursor-pointer">
                    Dana
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qris" id="qris" />
                  <Label htmlFor="qris" className="cursor-pointer">
                    QRIS
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trf" id="trf" />
                  <Label htmlFor="trf" className="cursor-pointer">
                    Transfer Bank
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Pembayaran:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            {saleError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {saleError instanceof Error ? saleError.message : 'Gagal menyimpan transaksi'}
                </AlertDescription>
              </Alert>
            )}

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
                    Menyimpan...
                  </>
                ) : (
                  'Selesaikan Transaksi'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
