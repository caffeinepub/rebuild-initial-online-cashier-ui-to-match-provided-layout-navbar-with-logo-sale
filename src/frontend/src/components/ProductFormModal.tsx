import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { useAddProduct, useProducts } from '../hooks/useProducts';
import { ExternalBlob } from '../backend';
import { PRODUCT_CATEGORIES, PRODUCT_SIZES } from '../constants/productOptions';
import { normalizeErrorMessage } from '../utils/errorMessage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductFormModal({ open, onOpenChange }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [category, setCategory] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [hpp, setHpp] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { mutate: addProduct, isPending, error } = useAddProduct();
  const { identity } = useInternetIdentity();
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();

  // Extract unique product names from backend products, sorted alphabetically
  const productNameOptions = useMemo(() => {
    if (!products || products.length === 0) return [];
    const uniqueNames = Array.from(new Set(products.map(p => p.name)));
    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      return;
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const imageBlob = ExternalBlob.fromBytes(uint8Array);

    addProduct(
      {
        name,
        size,
        category,
        salePrice: BigInt(salePrice),
        hpp: BigInt(hpp),
        image: imageBlob,
      },
      {
        onSuccess: () => {
          // Reset form
          setName('');
          setSize('');
          setCategory('');
          setSalePrice('');
          setHpp('');
          setImageFile(null);
          setImagePreview(null);
          onOpenChange(false);
        },
      }
    );
  };

  const normalizedError = error ? normalizeErrorMessage(error) : null;
  const showSignInPrompt = normalizedError?.isAuthError && !identity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
        </DialogHeader>

        {showSignInPrompt ? (
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in to add products. Please sign in and try again.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Select 
                value={name} 
                onValueChange={setName} 
                required
                disabled={productsLoading || !!productsError}
              >
                <SelectTrigger id="name">
                  <SelectValue 
                    placeholder={
                      productsLoading 
                        ? "Memuat daftar produk..." 
                        : productsError 
                        ? "Gagal memuat produk" 
                        : "Pilih nama produk"
                    } 
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memuat...
                    </div>
                  ) : productsError ? (
                    <div className="flex items-center justify-center py-4 text-sm text-destructive">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Gagal memuat daftar produk
                    </div>
                  ) : productNameOptions.length === 0 ? (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      Belum ada produk
                    </div>
                  ) : (
                    productNameOptions.map((productName) => (
                      <SelectItem key={productName} value={productName}>
                        {productName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Ukuran</Label>
                <Select value={size} onValueChange={setSize} required>
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Pilih ukuran" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_SIZES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hpp">HPP</Label>
                <Input
                  id="hpp"
                  type="number"
                  value={hpp}
                  onChange={(e) => setHpp(e.target.value)}
                  placeholder="5000"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">Harga Jual (Rp)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="10000"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Gambar Produk</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                  className="flex-1"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded border"
                  />
                )}
              </div>
            </div>

            {error && !showSignInPrompt && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {normalizedError?.message || 'Gagal menambahkan produk'}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending || !imageFile}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Simpan Produk
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
