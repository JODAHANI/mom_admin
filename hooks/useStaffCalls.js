import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useStaffCalls() {
  return useQuery({
    queryKey: ['staff-calls'],
    queryFn: async () => {
      const { data } = await api.get('/staff-calls');
      return Array.isArray(data) ? data : data?.calls || [];
    },
    staleTime: 5000,
  });
}

export function useStaffCallHistory(
  { startDate, endDate, status, floor, tableNumber, page = 1, limit = 20 },
  options = {},
) {
  return useQuery({
    queryKey: ['call-history', startDate, endDate, status, floor, tableNumber, page],
    queryFn: async () => {
      const params = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status && status !== 'all') params.status = status;
      if (floor) params.floor = floor;
      if (tableNumber) params.tableNumber = tableNumber;
      const { data } = await api.get('/staff-calls/history', { params });
      return data;
    },
    ...options,
  });
}

export function useResolveStaffCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/staff-calls/${id}/resolve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-history'] });
      queryClient.invalidateQueries({ queryKey: ['staff-calls'] });
    },
  });
}
