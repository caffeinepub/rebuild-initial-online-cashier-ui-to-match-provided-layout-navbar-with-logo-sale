import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicActor } from './usePublicActor';
import type { SaleItem, PaymentMethod } from '../backend';

interface UpdateSaleParams {
  id: bigint;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  totalTax: bigint;
}

export function useUpdateSale() {
  const { actor } = usePublicActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items, paymentMethod, totalTax }: UpdateSaleParams) => {
      if (!actor) throw new Error('Service not ready');
      const success = await actor.updateSale(id, items, paymentMethod, totalTax);
      if (!success) throw new Error('Failed to update transaction');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesReport'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useDeleteSale() {
  const { actor } = usePublicActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Service not ready');
      const success = await actor.deleteSale(id);
      if (!success) throw new Error('Failed to delete transaction');
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesReport'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}
