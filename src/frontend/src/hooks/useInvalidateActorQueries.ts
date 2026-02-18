import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that provides a function to invalidate and refetch all actor-related queries.
 * This is useful when retrying failed requests that may need a fresh actor instance.
 */
export function useInvalidateActorQueries() {
  const queryClient = useQueryClient();

  const invalidateActorQueries = async () => {
    // First, invalidate and refetch the actor query itself
    await queryClient.invalidateQueries({
      queryKey: ['actor'],
    });
    await queryClient.refetchQueries({
      queryKey: ['actor'],
    });

    // Then invalidate all other queries (they will refetch automatically when enabled)
    await queryClient.invalidateQueries({
      predicate: (query) => {
        return !query.queryKey.some((key) => 
          typeof key === 'string' && key === 'actor'
        );
      }
    });
  };

  return { invalidateActorQueries };
}
