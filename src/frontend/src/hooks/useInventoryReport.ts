import { useQuery } from '@tanstack/react-query';
import { usePublicActor } from './usePublicActor';
import type { InventoryReportEntry } from '../backend';

export function useInventoryReport(filter: string | null, daysBack: number | null) {
  const { actor, isFetching: actorFetching } = usePublicActor();

  return useQuery<InventoryReportEntry[]>({
    queryKey: ['inventoryReports', filter, daysBack],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getInventoryReports(filter, daysBack !== null ? BigInt(daysBack) : null);
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
  });
}
