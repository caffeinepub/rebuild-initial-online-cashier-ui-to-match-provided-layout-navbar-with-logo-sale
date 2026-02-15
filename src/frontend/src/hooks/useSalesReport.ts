import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SaleRecord, Time } from '../backend';

export function useSalesReport(fromTimestamp: Time, toTimestamp: Time) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SaleRecord[]>({
    queryKey: ['salesReport', fromTimestamp.toString(), toTimestamp.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.querySales(fromTimestamp, toTimestamp);
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
  });
}
