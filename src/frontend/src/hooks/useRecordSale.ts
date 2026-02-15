import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SaleItem, PaymentMethod } from '../backend';

interface RecordSaleParams {
  items: SaleItem[];
  paymentMethod: PaymentMethod;
}

export function useRecordSale() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, paymentMethod }: RecordSaleParams) => {
      if (!actor) throw new Error('Actor belum siap');
      return actor.recordSale(items, paymentMethod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}
