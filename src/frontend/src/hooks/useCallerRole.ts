import { useQuery } from '@tanstack/react-query';
import { usePublicActor } from './usePublicActor';
import { UserRole } from '../backend';

/**
 * Hook to fetch caller role from backend.
 * 
 * CRITICAL: This hook must NEVER be used for UI gating, menu hiding, or page access control.
 * All UI features (Dashboard, Products, Inventory, Transactions, Sales Report, etc.) 
 * must remain accessible without any role checks.
 * 
 * This hook exists only for backend compatibility and informational purposes.
 * It returns a safe fallback ('user') if the backend method is missing or fails,
 * ensuring the UI never breaks due to role-checking logic.
 * 
 * DO NOT use this hook to:
 * - Hide or disable menu items
 * - Block access to pages or views
 * - Gate any UI functionality
 * 
 * The backend handles all authorization; the frontend should display data
 * and let backend errors surface through proper error handling (QueryErrorState).
 */
export function useCallerRole() {
  const { actor, isFetching: actorFetching } = usePublicActor();

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
