import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import api from '../lib/api';
import wsManager from '../lib/websocket';
import { notificationsAtom, highlightOrderAtom } from '../store/atoms';

export function useOrders(status) {
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return useQuery({
    queryKey: ['orders', status, localDate],
    queryFn: async () => {
      const params = {
        startDate: localDate,
        endDate: localDate,
      };
      if (status === 'incomplete') {
        params.excludeStatus = 'served';
      } else if (status && status !== 'all') {
        params.status = status;
      }
      const { data } = await api.get('/orders', { params });
      return data;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
        const call = message.data;
        const tableInfo = call.tableNumber ? `${call.floor || 1}층 ${call.tableNumber}번` : '';
        const msg = tableInfo ? `${tableInfo} 테이블에서 직원을 호출했습니다` : '직원 호출이 왔습니다';
        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), type: 'staffCall', message: msg, time: new Date() },
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
