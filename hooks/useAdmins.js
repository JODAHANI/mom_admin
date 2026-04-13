import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => api.get('/admins').then((res) => res.data),
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/admins', data).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }),
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/admins/${id}`, data).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }),
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/admins/${id}`).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }),
  });
}
