import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAddExpense } from '../hooks/useExpenses';
import { toast } from 'sonner';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import SignInRequiredState from './SignInRequiredState';

const EXPENSE_CATEGORIES = [
  { value: 'bahan-baku', label: 'Bahan Baku' },
  { value: 'operasional', label: 'Operasional' },
  { value: 'lain-lain', label: 'Lain-lain' },
];

export default function ExpensesPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const [date, setDate] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('');
  const [nominalAmount, setNominalAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [picName, setPicName] = useState('');
  const [total, setTotal] = useState(0);

  const addExpense = useAddExpense();

  // Auto-calculate total when nominal or quantity changes
  useEffect(() => {
    const nominal = parseFloat(nominalAmount) || 0;
    const qty = parseInt(quantity) || 0;
    setTotal(nominal * qty);
  }, [nominalAmount, quantity]);

  const resetForm = () => {
    setDate('');
    setMonthYear('');
    setItem('');
    setCategory('');
    setNominalAmount('');
    setQuantity('');
    setPicName('');
    setTotal(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!date || !monthYear || !item || !category || !nominalAmount || !quantity || !picName) {
      toast.error('Form tidak lengkap', {
        description: 'Mohon lengkapi semua field yang diperlukan.',
      });
      return;
    }

    const nominalValue = parseFloat(nominalAmount);
    const quantityValue = parseInt(quantity);

    if (isNaN(nominalValue) || nominalValue < 0) {
      toast.error('Nominal tidak valid', {
        description: 'Nominal harus berupa angka positif.',
      });
      return;
    }

    if (isNaN(quantityValue) || quantityValue < 0) {
      toast.error('Quantity tidak valid', {
        description: 'Quantity harus berupa angka positif.',
      });
      return;
    }

    try {
      await addExpense.mutateAsync({
        date,
        monthYear,
        item,
        category,
        nominalAmount: BigInt(Math.round(nominalValue)),
        quantity: BigInt(quantityValue),
        total: BigInt(Math.round(total)),
        picName,
      });

      toast.success('Pengeluaran berhasil disimpan', {
        description: 'Data pengeluaran telah ditambahkan ke laporan.',
      });

      resetForm();
    } catch (err) {
      toast.error('Gagal menyimpan', {
        description: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data.',
      });
    }
  };

  // Show sign-in required if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pengeluaran</h1>
          <p className="text-muted-foreground mt-1">Catat pengeluaran usaha Anda</p>
        </div>
        <SignInRequiredState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pengeluaran</h1>
        <p className="text-muted-foreground mt-1">Catat pengeluaran usaha Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pengeluaran Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tanggal */}
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Bulan Tahun */}
              <div className="space-y-2">
                <Label htmlFor="monthYear">Bulan Tahun *</Label>
                <Input
                  id="monthYear"
                  type="month"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  required
                />
              </div>

              {/* Item Pengeluaran */}
              <div className="space-y-2">
                <Label htmlFor="item">Item Pengeluaran *</Label>
                <Input
                  id="item"
                  type="text"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="Contoh: Gula, Listrik, dll"
                  required
                />
              </div>

              {/* Kategori */}
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nominal */}
              <div className="space-y-2">
                <Label htmlFor="nominalAmount">Nominal (Rp) *</Label>
                <Input
                  id="nominalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={nominalAmount}
                  onChange={(e) => setNominalAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              {/* Total (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="total">Total (Rp)</Label>
                <Input
                  id="total"
                  type="text"
                  value={new Intl.NumberFormat('id-ID').format(total)}
                  readOnly
                  className="bg-muted"
                />
              </div>

              {/* PIC Name */}
              <div className="space-y-2">
                <Label htmlFor="picName">Nama PIC *</Label>
                <Input
                  id="picName"
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Nama penanggung jawab"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={addExpense.isPending}
                className="gap-2"
              >
                {addExpense.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Pengeluaran'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
