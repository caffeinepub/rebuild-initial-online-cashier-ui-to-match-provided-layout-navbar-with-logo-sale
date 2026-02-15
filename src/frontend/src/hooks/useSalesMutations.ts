import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SaleItem, PaymentMethod } from '../backend';

interface UpdateSaleParams {
  id: bigint;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  totalTax: bigint;
}

export function useUpdateSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items, paymentMethod, totalTax }: UpdateSaleParams) => {
      if (!actor) throw new Error('Actor belum siap');
      const success = await actor.updateSale(id, items, paymentMethod, totalTax);
      if (!success) throw new Error('Gagal mengupdate transaksi');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesReport'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useDeleteSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor belum siap');
      const success = await actor.deleteSale(id);
      if (!success) throw new Error('Gagal menghapus transaksi');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesReport'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}
