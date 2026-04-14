import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useOrderHistory(
  { startDate, endDate, status, tableNumber, search, page = 1, limit = 20 },
  options = {},
) {
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
    ...options,
  });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function useMonthlySales(year, month, options = {}) {
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `${year}-${pad2(month)}-01`;
  const endDate = `${year}-${pad2(month)}-${pad2(lastDay)}`;

  return useQuery({
    queryKey: ['monthly-sales', year, month],
    queryFn: async () => {
      const { data } = await api.get('/orders', {
        params: { startDate, endDate, limit: 10000 },
      });
      const orders = Array.isArray(data) ? data : data.orders || [];

      const byDay = {};
      for (let d = 1; d <= lastDay; d++) {
        byDay[`${year}-${pad2(month)}-${pad2(d)}`] = {
          revenue: 0, count: 0, cancelled: 0,
        };
      }

      for (const o of orders) {
        if (!o.createdAt) continue;
        const dt = new Date(o.createdAt);
        const key = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
        const bucket = byDay[key];
        if (!bucket) continue;
        if (o.status === 'served') {
          bucket.revenue += Number(o.totalPrice) || 0;
          bucket.count += 1;
        } else if (o.status === 'cancelled') {
          bucket.cancelled += 1;
        }
      }

      let totalRevenue = 0;
      let totalCount = 0;
      let activeDays = 0;
      let bestDay = null;
      let worstDay = null;
      for (const [key, v] of Object.entries(byDay)) {
        totalRevenue += v.revenue;
        totalCount += v.count;
        if (v.revenue <= 0) continue;
        activeDays += 1;
        if (!bestDay || v.revenue > bestDay.revenue) {
          bestDay = { date: key, revenue: v.revenue };
        }
        if (!worstDay || v.revenue < worstDay.revenue) {
          worstDay = { date: key, revenue: v.revenue };
        }
      }

      // 매출이 있는 날이 하루뿐이면 최고만 표시하고 최저는 null
      if (bestDay && worstDay && bestDay.date === worstDay.date) {
        worstDay = null;
      }

      return {
        byDay,
        totalRevenue,
        totalCount,
        avgDaily: activeDays > 0 ? Math.round(totalRevenue / activeDays) : 0,
        bestDay,
        worstDay,
      };
    },
    ...options,
  });
}

export function useOrderStats(startDate, endDate, options = {}) {
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
    ...options,
  });
}
