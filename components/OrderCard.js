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
  pending: '조리대기',
  accepted: '접수',
  preparing: '조리시작',
  ready: '조리완료',
  served: '전달완료',
  cancelled: '취소',
};

const nextStatus = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'served',
};

const nextStatusLabel = {
  pending: '조리시작',
  preparing: '조리완료',
  ready: '전달완료',
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
  width: 20px;
  height: 20px;
  border: 3px solid ${(p) => p.$color || 'rgba(255,255,255,0.4)'};
  border-top-color: ${(p) => p.$topColor || 'white'};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  vertical-align: middle;
`;

const Card = styled.div`
  background: ${(p) => (p.$highlight ? '#3182F6' : 'white')};
  border-radius: 12px;
  border-left: 12px solid ${(p) => statusColors[p.$status]?.bg || '#E5E8EB'};
  padding: 20px;
  margin-bottom: 18px;
  transition: background 0.5s ease;
  ${(p) => p.$animating && css`animation: ${flash} 0.5s ease forwards;`}
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const TableInfo = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${(p) => (p.$highlight ? 'white' : '#1b1d1f')};
  transition: color 0.5s ease;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TableDot = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

const SeqBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  background: ${(p) => (p.$highlight ? 'rgba(255,255,255,0.2)' : '#F2F3F5')};
  color: ${(p) => (p.$highlight ? 'white' : '#4B5563')};
  font-variant-numeric: tabular-nums;
`;

const TABLE_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E',
];

function getTableColor(id) {
  if (!id) return '#9CA3AF';
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TABLE_COLORS[h % TABLE_COLORS.length];
}

const TimeAgo = styled.div`
  font-size: 16px;
  color: ${(p) => (p.$highlight ? 'rgba(255,255,255,0.8)' : '#8b95a1')};
  transition: color 0.5s ease;
`;

const ItemsList = styled.div`
  font-size: 17px;
  line-height: 1.6;
  color: ${(p) => (p.$highlight ? 'rgba(255,255,255,0.9)' : '#333')};
  margin-bottom: 20px;
  transition: color 0.5s ease;
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
`;

const TotalPrice = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: ${(p) => (p.$highlight ? 'white' : '#1b1d1f')};
  transition: color 0.5s ease;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  background: ${(p) => statusColors[p.$status]?.bg || '#E5E8EB'};
  color: ${(p) => statusColors[p.$status]?.text || '#333'};
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 18px;
  border: none;
  border-radius: 12px;
  background: ${(p) => (p.$highlight ? 'white' : '#3182F6')};
  color: ${(p) => (p.$highlight ? '#3182F6' : 'white')};
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.5s ease;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 18px;
  border: 1.5px solid #E5E8EB;
  border-radius: 12px;
  background: white;
  color: #F44336;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #FFF5F5;
    border-color: #F44336;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }
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
          {order.tableNumber && <TableDot $color={getTableColor(order.tableId)} />}
          <span>
            {order.tableNumber
              ? `${order.floor || 1}층 ${order.tableNumber}번 테이블`
              : `주문 #${(orderId || '').slice(-6)}`}
          </span>
          {order.sessionSeq ? (
            <SeqBadge $highlight={highlight}>#{order.sessionSeq}</SeqBadge>
          ) : null}
          <StatusBadge $status={status} style={{ marginLeft: 4 }}>{statusLabels[status] || status}</StatusBadge>
        </TableInfo>
        <TimeAgo $highlight={highlight}>{getTimeAgo(order.createdAt)}</TimeAgo>
      </TopRow>
      <ItemsList $highlight={highlight}>{itemsText || '항목 없음'}</ItemsList>
      <BottomRow>
        <TotalPrice $highlight={highlight}>{Number(total).toLocaleString()}원</TotalPrice>
      </BottomRow>
      {(status !== 'cancelled' || next) && (
        <ActionRow>
          {status !== 'cancelled' && (
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
        </ActionRow>
      )}
    </Card>
  );
}
