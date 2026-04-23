import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useProducts(categoryId, search) {
  return useQuery({
    queryKey: ['products', categoryId, search],
    queryFn: async () => {
      const params = { includeHidden: true };
      if (categoryId) params.category = categoryId;
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      return data;
    },
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productData) => {
      const { data } = await api.post('/products', productData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...productData }) => {
      const { data } = await api.put(`/products/${id}`, productData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/products/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useReorderProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { data } = await api.patch('/products/reorder', { ids });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useToggleSoldOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/products/${id}/sold-out`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useToggleChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, channel }) => {
      const { data } = await api.patch(`/products/${id}/toggle-channel`, {
        channel,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
