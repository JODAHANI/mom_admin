import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useReservations({ date, startDate, endDate } = {}) {
  return useQuery({
    queryKey: ['reservations', { date, startDate, endDate }],
    queryFn: async () => {
      const params = {};
      if (date) params.date = date;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await api.get('/reservations', { params });
      return data;
    },
  });
}

export function useReservationsByMonth(year, month) {
  return useQuery({
    queryKey: ['reservations', 'by-month', year, month],
    queryFn: async () => {
      const { data } = await api.get('/reservations/by-month', {
        params: { year, month },
      });
      return data;
    },
    enabled: !!year && !!month,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/reservations', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/reservations/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/reservations/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}
