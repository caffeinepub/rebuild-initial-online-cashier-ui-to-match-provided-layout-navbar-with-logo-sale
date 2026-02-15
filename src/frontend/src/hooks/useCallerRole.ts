import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserRole } from '../backend';

/**
 * Hook to fetch caller role from backend.
 * Note: This hook is retained for backend compatibility but should NOT be used
 * for UI gating. All UI features should be accessible to authenticated users.
 * If the backend method is missing or fails, it returns a safe fallback without throwing.
 */
export function useCallerRole() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserRole>({
    queryKey: ['callerRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      // Check if the method exists before calling
      if (typeof actor.getCallerUserRole !== 'function') {
        // Method doesn't exist, return safe fallback
        return 'user' as UserRole;
      }
      
      try {
        return await actor.getCallerUserRole();
      } catch (error) {
        // If the call fails, return safe fallback instead of throwing
        console.warn('getCallerUserRole failed, using fallback:', error);
        return 'user' as UserRole;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false, // Don't retry on failure
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
    // Always provide a safe fallback role
    data: query.data || ('user' as UserRole),
  };
}
