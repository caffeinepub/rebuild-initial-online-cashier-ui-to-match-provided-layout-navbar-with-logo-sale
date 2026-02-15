import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, Loader2 } from 'lucide-react';
import { useAddProduct } from '../hooks/useProducts';
import { ExternalBlob } from '../backend';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = ['Teh', 'Kopi', 'Matcha', 'Coklat', 'Lemon'] as const;
const SIZES = ['Kecil', 'Besar', 'Jumbo'] as const;

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Normalize authentication errors
    if (message.includes('Unauthorized') || message.includes('not authenticated')) {
      return 'Anda perlu login terlebih dahulu untuk menambahkan produk.';
    }
    
    // Normalize trap messages
    if (message.includes('trap')) {
      return 'Terjadi kesalahan pada server. Silakan coba lagi.';
    }
    
    return message;
  }
  
  return 'Gagal menyimpan produk. Silakan coba lagi.';
}

export default function ProductFormModal({ open, onOpenChange }: ProductFormModalProps) {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [cogs, setCogs] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addProductMutation = useAddProduct();

  // Cleanup preview URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Cleanup old preview
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    // Reset form
    setProductName('');
    setCategory('');
    setSize('');
    setCogs('');
    setSalePrice('');
    setErrorMessage(null);
    handleRemoveImage();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      // Validate inputs
      const salePriceValue = parseFloat(salePrice);

      if (!productName.trim()) {
        setErrorMessage('Nama produk wajib diisi');
        return;
      }

      if (!category) {
        setErrorMessage('Kategori wajib dipilih');
        return;
      }

      if (!size) {
        setErrorMessage('Ukuran wajib dipilih');
        return;
      }

      if (isNaN(salePriceValue) || salePriceValue < 0) {
        setErrorMessage('Harga jual harus berupa angka yang valid');
        return;
      }

      if (!imageFile) {
        setErrorMessage('Foto produk wajib diunggah');
        return;
      }

      // Convert image file to bytes
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBytes = new Uint8Array(arrayBuffer);
      
      // Create ExternalBlob from bytes
      const imageBlob = ExternalBlob.fromBytes(imageBytes);

      // Call backend
      await addProductMutation.mutateAsync({
        name: productName,
        size: size,
        salePrice: BigInt(Math.round(salePriceValue)),
        image: imageBlob,
      });

      // Success - close modal and reset form
      handleClose();
    } catch (error) {
      console.error('Error menambahkan produk:', error);
      // Keep modal open and show normalized error message
      setErrorMessage(normalizeErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Tambah Produk Baru</DialogTitle>
          <DialogDescription>
            Isi detail produk di bawah ini. Semua kolom wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <form onSubmit={handleSubmit} id="product-form" className="space-y-6 pb-4">
            {/* Product Photo */}
            <div className="space-y-2">
              <Label htmlFor="product-photo">Foto Produk</Label>
              <p className="text-xs text-muted-foreground">Rekomendasi: persegi (1:1)</p>
              
              <div className="flex items-start gap-4">
                {/* Preview Area */}
                <div className="w-40 h-40 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreview}
                        alt="Pratinjau produk"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Tidak ada gambar</p>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    id="product-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih Gambar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Unggah gambar persegi untuk hasil terbaik. Format yang didukung: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="product-name">Nama Produk</Label>
              <Input
                id="product-name"
                type="text"
                placeholder="Masukkan nama produk"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Pilih kategori produk" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label htmlFor="size">Ukuran</Label>
              <Select value={size} onValueChange={setSize} required>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Pilih ukuran produk" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* COGS (HPP) */}
            <div className="space-y-2">
              <Label htmlFor="cogs">HPP (Harga Pokok Penjualan)</Label>
              <Input
                id="cogs"
                type="number"
                step="0.01"
                min="0"
                placeholder="Masukkan harga pokok penjualan"
                value={cogs}
                onChange={(e) => setCogs(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Biaya produksi atau pembelian produk</p>
            </div>

            {/* Sale Price */}
            <div className="space-y-2">
              <Label htmlFor="sale-price">Harga Jual</Label>
              <Input
                id="sale-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Masukkan harga jual"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Harga jual kepada pelanggan</p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                {errorMessage}
              </div>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={addProductMutation.isPending}>
            Batal
          </Button>
          <Button 
            type="submit" 
            form="product-form"
            disabled={addProductMutation.isPending}
          >
            {addProductMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Produk'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
