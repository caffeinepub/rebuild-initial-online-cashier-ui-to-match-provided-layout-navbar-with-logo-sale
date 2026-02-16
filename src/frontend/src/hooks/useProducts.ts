import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Product, ExternalBlob } from '../backend';

export function useProducts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listProducts();
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: { 
      name: string; 
      size: string; 
      category: string;
      salePrice: bigint; 
      image: ExternalBlob 
    }) => {
      if (!actor) throw new Error('Service not ready');
      return actor.addProduct(
        product.name, 
        product.size, 
        product.category,
        product.salePrice, 
        product.image
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
