import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useOrderHistory({ startDate, endDate, status, tableNumber, search, page = 1, limit = 20 }) {
  return useQuery({
    queryKey: ['order-history', startDate, endDate, status, tableNumber, search, page],
    queryFn: async () => {
      const params = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status && status !== 'all') params.status = status;
      if (tableNumber) params.tableNumber = tableNumber;
      if (search) params.search = search;
      const { data } = await api.get('/orders', { params });
      return data;
    },
  });
}

export function useOrderStats(startDate, endDate) {
  return useQuery({
    queryKey: ['order-stats', startDate, endDate],
    queryFn: async () => {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await api.get('/orders', { params });
      const orders = Array.isArray(data) ? data : data.orders || [];

      const completed = orders.filter((o) => o.status === 'served');
      const cancelled = orders.filter((o) => o.status === 'cancelled');
      const totalRevenue = completed.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const avgPrice = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

      return {
        totalOrders: orders.length,
        totalRevenue,
        cancelledCount: cancelled.length,
        avgPrice,
      };
    },
  });
}
