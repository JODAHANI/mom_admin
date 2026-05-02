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

const ServedByRow = styled.div`
  font-size: 13px;
  color: ${(p) => (p.$highlight ? 'rgba(255,255,255,0.75)' : '#8b95a1')};
  margin-top: -10px;
  margin-bottom: 14px;
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

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 16px;
  width: 400px;
  max-width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const ModalHead = styled.div`
  padding: 20px 24px 4px;
`;

const ModalTitleText = styled.h3`
  font-size: 18px;
  font-weight: 800;
  color: #191f28;
  margin: 0;
`;

const ModalBodyArea = styled.div`
  padding: 14px 24px 22px;
`;

const ModalLine = styled.div`
  font-size: 15px;
  color: #4B5563;
  line-height: 1.55;
  margin-bottom: 6px;
`;

const ModalSummaryBox = styled.div`
  margin-top: 12px;
  padding: 14px 16px;
  background: #F8F9FB;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ModalSummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #4B5563;

  strong {
    color: #1B1D1F;
    font-weight: 700;
  }
`;

const ModalFootRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
`;

const ModalSecondaryBtn = styled.button`
  flex: 1;
  padding: 14px;
  border: 1.5px solid #E5E8EB;
  border-radius: 10px;
  background: white;
  color: #4B5563;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #F8F9FB;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ModalDangerBtn = styled.button`
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: #F44336;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #E53935;
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
  const [showCancelModal, setShowCancelModal] = useState(false);
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

  const handleCancelClick = (e) => {
    e.stopPropagation();
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    updateStatus.mutate({ id: orderId, status: 'cancelled' }, {
      onSuccess: () => {
        setShowCancelModal(false);
        showToast(`${tableLabel} 주문이 취소되었습니다`, 'error');
      },
      onError: () => {
        setShowCancelModal(false);
        showToast('취소에 실패했습니다', 'error');
      },
    });
  };

  const closeCancelModal = () => {
    if (!updateStatus.isPending) setShowCancelModal(false);
  };

  return (
    <>
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
      {status === 'served' && order.servedBy && (
        <ServedByRow $highlight={highlight}>
          전달 · {order.servedBy.name || order.servedBy.email || '직원'}
        </ServedByRow>
      )}
      <ItemsList $highlight={highlight}>{itemsText || '항목 없음'}</ItemsList>
      <BottomRow>
        <TotalPrice $highlight={highlight}>{Number(total).toLocaleString()}원</TotalPrice>
      </BottomRow>
      {(status !== 'cancelled' || next) && (
        <ActionRow>
          {status !== 'cancelled' && (
            <CancelButton onClick={handleCancelClick} disabled={updateStatus.isPending}>
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
    {showCancelModal && (
      <ModalOverlay onClick={closeCancelModal}>
        <ModalCard onClick={(e) => e.stopPropagation()}>
          <ModalHead>
            <ModalTitleText>주문을 취소할까요?</ModalTitleText>
          </ModalHead>
          <ModalBodyArea>
            <ModalLine>취소된 주문은 복구할 수 없어요.</ModalLine>
            <ModalSummaryBox>
              <ModalSummaryRow>
                <span>주문</span>
                <strong>{tableLabel}{order.sessionSeq ? ` · #${order.sessionSeq}` : ''}</strong>
              </ModalSummaryRow>
              <ModalSummaryRow>
                <span>메뉴</span>
                <strong style={{ maxWidth: '60%', textAlign: 'right' }}>{itemsText || '항목 없음'}</strong>
              </ModalSummaryRow>
              <ModalSummaryRow>
                <span>금액</span>
                <strong>{Number(total).toLocaleString()}원</strong>
              </ModalSummaryRow>
            </ModalSummaryBox>
          </ModalBodyArea>
          <ModalFootRow>
            <ModalSecondaryBtn onClick={closeCancelModal} disabled={updateStatus.isPending}>
              돌아가기
            </ModalSecondaryBtn>
            <ModalDangerBtn onClick={handleConfirmCancel} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? (
                <Spinner $color="rgba(255,255,255,0.35)" $topColor="white" />
              ) : (
                '주문 취소'
              )}
            </ModalDangerBtn>
          </ModalFootRow>
        </ModalCard>
      </ModalOverlay>
    )}
    </>
  );
}
