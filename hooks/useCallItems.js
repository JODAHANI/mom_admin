import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useCallItems() {
  return useQuery({
    queryKey: ['call-items'],
    queryFn: async () => {
      const { data } = await api.get('/call-items');
      return data;
    },
  });
}

export function useCreateCallItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/call-items', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['call-items'] }),
  });
}

export function useUpdateCallItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/call-items/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['call-items'] }),
  });
}

export function useDeleteCallItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/call-items/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['call-items'] }),
  });
}

export function useReorderCallItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { data } = await api.patch('/call-items/reorder', { ids });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['call-items'] }),
  });
}
