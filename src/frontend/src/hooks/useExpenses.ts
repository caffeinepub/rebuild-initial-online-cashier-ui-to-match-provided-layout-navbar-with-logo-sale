import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ExpenseRecord } from '../backend';

interface AddExpenseParams {
  date: string;
  monthYear: string;
  item: string;
  category: string;
  nominalAmount: bigint;
  quantity: bigint;
  total: bigint;
  picName: string;
}

export function useExpenseRecords() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ExpenseRecord[]>({
    queryKey: ['expenseRecords'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getExpenseRecords();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddExpenseParams) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExpenseRecord(
        params.date,
        params.monthYear,
        params.item,
        params.category,
        params.nominalAmount,
        params.quantity,
        params.total,
        params.picName
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
    },
  });
}
