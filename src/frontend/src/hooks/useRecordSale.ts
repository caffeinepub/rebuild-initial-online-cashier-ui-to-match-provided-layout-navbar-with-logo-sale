import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SaleItem, PaymentMethod } from '../backend';

export function useRecordSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sale: {
      items: SaleItem[];
      paymentMethod: PaymentMethod;
      totalTax: bigint;
    }) => {
      if (!actor) throw new Error('Service not ready');
      return actor.recordSale(sale.items, sale.paymentMethod, sale.totalTax);
    },
    onSuccess: () => {
      // Invalidate both dashboard and inventory queries
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
