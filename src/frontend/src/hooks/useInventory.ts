import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { InventoryItem } from '../backend';

export function useInventory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listInventoryItems();
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
  });
}

export function useAddInventory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventory: {
      itemName: string;
      category: string;
      size: string;
      unit: string;
      initialStock: bigint;
      reject: bigint;
      finalStock: bigint;
      minimumStock: bigint;
    }) => {
      if (!actor) throw new Error('Service not ready');
      
      const result = await actor.addInventoryItem(
        inventory.itemName,
        inventory.category,
        inventory.size,
        inventory.unit,
        inventory.initialStock,
        inventory.reject,
        inventory.finalStock,
        inventory.minimumStock
      );

      // Backend returns null if duplicate or invalid
      if (result === null) {
        throw new Error('Item name already exists or is invalid. Please use a different name.');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inventory: {
      id: bigint;
      itemName: string;
      category: string;
      size: string;
      unit: string;
      initialStock: bigint;
      reject: bigint;
      finalStock: bigint;
      minimumStock: bigint;
    }) => {
      if (!actor) throw new Error('Service not ready');
      
      const result = await actor.updateInventoryItem(
        inventory.id,
        inventory.itemName,
        inventory.category,
        inventory.size,
        inventory.unit,
        inventory.initialStock,
        inventory.reject,
        inventory.finalStock,
        inventory.minimumStock
      );
      
      // Backend returns false if duplicate, not found, or invalid
      if (!result) {
        throw new Error('Failed to update: item name already exists, item not found, or name is invalid.');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useAdjustInventoryStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      itemId: bigint;
      quantity: bigint;
      isAddition: boolean;
      description: string;
    }) => {
      if (!actor) throw new Error('Service not ready');
      
      const result = await actor.adjustInventoryStock(
        params.itemId,
        params.quantity,
        params.isAddition,
        params.description
      );
      
      if (!result) {
        throw new Error('Failed to adjust stock. Stock cannot go below zero.');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryReports'] });
    },
  });
}
