import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that provides a function to invalidate all actor-related queries.
 * This is useful when retrying failed requests that may need a fresh actor instance.
 */
export function useInvalidateActorQueries() {
  const queryClient = useQueryClient();

  const invalidateActorQueries = async () => {
    // Invalidate all queries with 'actor' in the key
    await queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey.some((key) => 
          typeof key === 'string' && key.includes('actor')
        );
      }
    });
  };

  return { invalidateActorQueries };
}
