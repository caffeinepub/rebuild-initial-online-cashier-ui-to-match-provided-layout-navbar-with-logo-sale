import { useQuery } from '@tanstack/react-query';
import { usePublicActor } from './usePublicActor';
import type { DashboardSummary } from '../backend';

export function useDashboardSummary() {
  const { actor, isFetching: actorFetching } = usePublicActor();

  return useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.fetchDashboardSummary();
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
  });
}
