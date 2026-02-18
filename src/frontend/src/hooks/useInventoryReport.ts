import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { InventoryReportEntry } from '../backend';

export function useInventoryReport(filter: string | null, daysBack: number | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<InventoryReportEntry[]>({
    queryKey: ['inventoryReports', filter, daysBack],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getInventoryReports(filter, daysBack !== null ? BigInt(daysBack) : null);
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}
