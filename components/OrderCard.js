import { useEffect, useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useAtom } from 'jotai';
import { useUpdateOrderStatus } from '../hooks/useOrders';
import { highlightOrderAtom } from '../store/atoms';
import { useToast } from './Toast';

const statusColors = {
  pending: { bg: '#FFC107', text: '#333' },
  accepted: { bg: '#3182F6', text: 'white' },
  preparing: { bg: '#FF9800', text: 'white' },
  ready: { bg: '#4CAF50', text: 'white' },
  served: { bg: '#9E9E9E', text: 'white' },
  cancelled: { bg: '#F44336', text: 'white' },
};

const statusLabels = {
  pending: '대기중',
  accepted: '접수',
  preparing: '준비중',
  ready: '준비완료',
  served: '서빙완료',
  cancelled: '취소',
};

const nextStatus = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

const nextStatusLabel = {
  pending: '준비시작',
  preparing: '준비완료',
  ready: '서빙완료',
};

const flash = keyframes`
  0% { background: #3182F6; }
  100% { background: white; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid ${(p) => p.$color || 'rgba(255,255,255,0.4)'};
  border-top-color: ${(p) => p.$topColor || 'white'};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  vertical-align: middle;
`;

const Card = styled.div`
  background: ${(p) => (p.$highlight ? '#3182F6' : 'white')};
  border-radius: 12px;
  border-left: 12px solid ${(p) => statusColors[p.$status]?.bg || '#E5E8EB'};
  padding: 16px;
  margin-bottom: 12px;
  transition: background 0.5s ease;
  ${(p) => p.$animating && css`animation: ${flash} 0.5s ease forwards;`}
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TableInfo = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => (p.$highlight ? 'white' : '#1b1d1f')};
  transition: color 0.5s ease;
`;

const TimeAgo = styled.div`
  font-size: 13px;
  color: ${(p) => (p.$highlight ? 'rgba(255,255,255,0.8)' : '#8b95a1')};
  transition: color 0.5s ease;
`;

const ItemsList = styled.div`
  font-size: 14px;
  color: ${(p) => (p.$highlight ? 'rgba(255,255,255,0.9)' : '#333')};
  margin-bottom: 12px;
  transition: color 0.5s ease;
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TotalPrice = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => (p.$highlight ? 'white' : '#1b1d1f')};
  transition: color 0.5s ease;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => statusColors[p.$status]?.bg || '#E5E8EB'};
  color: ${(p) => statusColors[p.$status]?.text || '#333'};
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$highlight ? 'white' : '#3182F6')};
  color: ${(p) => (p.$highlight ? '#3182F6' : 'white')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.5s ease;
  min-width: 72px;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

const CancelButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #E5E8EB;
  border-radius: 8px;
  background: white;
  color: #F44336;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-width: 52px;

  &:hover {
    background: #FFF5F5;
    border-color: #F44336;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

function getTimeAgo(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function OrderCard({ order }) {
  const updateStatus = useUpdateOrderStatus();
  const showToast = useToast();
  const [highlightOrder, setHighlightOrder] = useAtom(highlightOrderAtom);
  const [highlight, setHighlight] = useState(false);
  const [animating, setAnimating] = useState(false);
  const cardRef = useRef(null);
  const orderId = order._id || order.id;
  const status = order.status || 'pending';
  const next = nextStatus[status];

  useEffect(() => {
    if (highlightOrder && highlightOrder === orderId) {
      setHighlight(true);
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const timer = setTimeout(() => {
        setHighlight(false);
        setAnimating(true);
        setHighlightOrder(null);
      }, 500);

      const animTimer = setTimeout(() => {
        setAnimating(false);
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearTimeout(animTimer);
      };
    }
  }, [highlightOrder, orderId, setHighlightOrder]);

  const items = order.items || [];
  const itemsText = items
    .map((item) => `${item.name || item.product?.name || '상품'} x${item.quantity}`)
    .join(', ');

  const total = order.totalAmount || items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);

  const tableLabel = order.tableNumber
    ? `${order.floor || 1}층 ${order.tableNumber}번`
    : `#${(orderId || '').slice(-6)}`;

  const handleAdvance = (e) => {
    e.stopPropagation();
    if (next) {
      updateStatus.mutate({ id: orderId, status: next }, {
        onSuccess: () => showToast(`${tableLabel} → ${nextStatusLabel[status]}`, 'success'),
        onError: () => showToast('상태 변경에 실패했습니다', 'error'),
      });
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    if (window.confirm('이 주문을 취소하시겠습니까?')) {
      updateStatus.mutate({ id: orderId, status: 'cancelled' }, {
        onSuccess: () => showToast(`${tableLabel} 주문이 취소되었습니다`, 'error'),
        onError: () => showToast('취소에 실패했습니다', 'error'),
      });
    }
  };

  return (
    <Card ref={cardRef} $status={status} $highlight={highlight} $animating={animating}>
      <TopRow>
        <TableInfo $highlight={highlight}>
          {order.tableNumber
            ? `${order.floor || 1}층 ${order.tableNumber}번 테이블`
            : `주문 #${(orderId || '').slice(-6)}`}
          <StatusBadge $status={status} style={{ marginLeft: 12 }}>{statusLabels[status] || status}</StatusBadge>
        </TableInfo>
        <TimeAgo $highlight={highlight}>{getTimeAgo(order.createdAt)}</TimeAgo>
      </TopRow>
      <ItemsList $highlight={highlight}>{itemsText || '항목 없음'}</ItemsList>
      <BottomRow>
        <TotalPrice $highlight={highlight}>{Number(total).toLocaleString()}원</TotalPrice>
        <RightGroup>
          {status !== 'served' && status !== 'cancelled' && (
            <CancelButton onClick={handleCancel} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? (
                <Spinner $color="rgba(244,67,54,0.25)" $topColor="#F44336" />
              ) : (
                '취소'
              )}
            </CancelButton>
          )}
          {next && (
            <ActionButton $highlight={highlight} onClick={handleAdvance} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? (
                <Spinner $color="rgba(255,255,255,0.35)" $topColor="white" />
              ) : (
                nextStatusLabel[status]
              )}
            </ActionButton>
          )}
        </RightGroup>
      </BottomRow>
    </Card>
  );
}
