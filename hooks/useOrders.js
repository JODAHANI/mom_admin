import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import api from '../lib/api';
import wsManager from '../lib/websocket';
import { notificationsAtom, highlightOrderAtom } from '../store/atoms';

export function useOrders(statuses = []) {
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const statusKey = [...statuses].sort().join(',');

  return useQuery({
    queryKey: ['orders', statusKey, localDate],
    queryFn: async () => {
      const params = {
        startDate: localDate,
        endDate: localDate,
      };
      if (statuses.length > 0) {
        params.status = statuses.join(',');
      }
      const { data } = await api.get('/orders', { params });
      return data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post('/orders', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables-status'] });
      queryClient.invalidateQueries({ queryKey: ['order-history'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-sales'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/orders/${id}/status`, { status });
      return data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      await queryClient.cancelQueries({ queryKey: ['tables-status'] });
      const ordersSnapshots = queryClient.getQueriesData({ queryKey: ['orders'] });
      const tablesSnapshot = queryClient.getQueryData(['tables-status']);
      queryClient.setQueriesData({ queryKey: ['orders'] }, (old) => {
        if (!old) return old;
        const updateOne = (o) => ((o._id === id || o.id === id) ? { ...o, status } : o);
        if (Array.isArray(old)) return old.map(updateOne);
        if (Array.isArray(old?.data)) return { ...old, data: old.data.map(updateOne) };
        return old;
      });
      if (tablesSnapshot) {
        const updateOrder = (o) => ((o._id === id || o.id === id) ? { ...o, status } : o);
        queryClient.setQueryData(['tables-status'], tablesSnapshot.map((table) => ({
          ...table,
          allOrders: (table.allOrders || []).map(updateOrder),
          activeOrders: (table.activeOrders || []).map(updateOrder),
        })));
      }
      return { ordersSnapshots, tablesSnapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.ordersSnapshots?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (ctx?.tablesSnapshot) queryClient.setQueryData(['tables-status'], ctx.tablesSnapshot);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables-status'] });
    },
  });
}

export function useWebSocketOrders(showToast) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setNotifications = useSetAtom(notificationsAtom);
  const setHighlightOrder = useSetAtom(highlightOrderAtom);

  const refs = useRef({ showToast, router, setNotifications, setHighlightOrder, queryClient });
  refs.current = { showToast, router, setNotifications, setHighlightOrder, queryClient };

  useEffect(() => {
    if (!wsManager) return;

    wsManager.connect();

    const removeListener = wsManager.addListener((message) => {
      const { showToast, router, setNotifications, setHighlightOrder, queryClient } = refs.current;

      if (message.type === 'NEW_ORDER') {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['tables-status'] });
        const order = message.data;
        const tableInfo = order.tableNumber ? `${order.floor || 1}층 ${order.tableNumber}번` : '';
        const msg = tableInfo
          ? `${tableInfo} 테이블에서 주문이 들어왔습니다`
          : '새로운 주문이 들어왔습니다';
        const orderId = order._id || order.id;

        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), type: 'order', message: msg, time: new Date(), orderId },
        ]);

        showToast?.(msg, 'order', {
          sub: '터치하여 주문 확인',
          onClick: () => {
            setHighlightOrder(orderId);
            router.push('/orders');
          },
        });
      }
      if (message.type === 'ORDER_STATUS') {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['tables-status'] });
      }
      if (message.type === 'STAFF_CALL') {
        queryClient.invalidateQueries({ queryKey: ['staff-calls'] });
        queryClient.invalidateQueries({ queryKey: ['call-history'] });
        const call = message.data;
        const tableInfo = call.tableNumber ? `${call.floor || 1}층 ${call.tableNumber}번` : '';
        const itemsText = Array.isArray(call.items) && call.items.length > 0
          ? ` — ${call.items.join(', ')}`
          : '';
        const msg = tableInfo
          ? `${tableInfo} 테이블에서 호출${itemsText}`
          : `직원 호출${itemsText}`;
        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), type: 'staffCall', message: msg, time: new Date(), callId: call._id || call.id },
        ]);
        showToast?.(`🙋 ${msg}`, 'staffCall');
      }
    });

    return () => {
      removeListener();
      wsManager.disconnect();
    };
  }, []);
}
