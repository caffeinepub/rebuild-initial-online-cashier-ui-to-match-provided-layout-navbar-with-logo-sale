import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';

const ACTOR_QUERY_KEY = 'actor';

/**
 * Hook that creates and manages an anonymous backend actor.
 * This actor does not require Internet Identity authentication.
 * All users interact with the backend anonymously.
 */
export function usePublicActor() {
  const queryClient = useQueryClient();
  
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY],
    queryFn: async () => {
      // Always create an anonymous actor (no identity)
      return await createActorWithConfig();
    },
    staleTime: Infinity,
    enabled: true,
    retry: 3,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        }
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        }
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    refetchActor: actorQuery.refetch,
  };
}
