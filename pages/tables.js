import { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import OrderCreateModal from '../components/OrderCreateModal';
import { useTables, useUpdateTable, useCreateTable, useDeleteTable } from '../hooks/useTables';
import { useAuth } from '../hooks/useAuth';

const statusColors = {
  pending: { bg: '#FFC107', text: '#333' },
  accepted: { bg: '#3182F6', text: 'white' },
  preparing: { bg: '#FF9800', text: 'white' },
  ready: { bg: '#4CAF50', text: 'white' },
  served: { bg: '#E5E8EB', text: '#8b95a1' },
  cancelled: { bg: '#FFF0F0', text: '#FF3B30' },
};

const statusLabels = {
  pending: '조리대기',
  accepted: '접수',
  preparing: '조리시작',
  ready: '조리완료',
};

const allStatusLabels = {
  ...statusLabels,
  served: '전달완료',
  cancelled: '취소',
};

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainArea = styled.div`
  margin-left: 240px;
  padding-top: 60px;
  flex: 1;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Content = styled.div`
  padding: 24px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #191f28;

  @media (max-width: 480px) {
    font-size: 17px;
  }
`;

const AddBtn = styled.button`
  padding: 10px 20px;
  background: #3182F6;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #1B6CE5;
  }
`;

/* 테이블 추가 모달 */
const AddModalBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  color: #8b95a1;
  font-weight: 600;
`;

const FieldInput = styled.input`
  padding: 10px 12px;
  border: 1px solid #E5E8EB;
  border-radius: 8px;
  font-size: 15px;
  outline: none;

  &:focus {
    border-color: #3182F6;
  }
`;

const FieldSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid #E5E8EB;
  border-radius: 8px;
  font-size: 15px;
  background: white;
  outline: none;

  &:focus {
    border-color: #3182F6;
  }
`;

const SubmitBtn = styled.button`
  padding: 12px;
  background: #3182F6;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #1B6CE5;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

/* 층 선택 탭 */
const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const Tab = styled.button`
  padding: 8px 20px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#E5E8EB')};
  border-radius: 20px;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #3182F6;
  }
`;

/* 범례 */
const Legend = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8b95a1;
`;

const LegendDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`;

/* 테이블 그리드 */
const FloorSection = styled.div`
  margin-bottom: 32px;
`;

const FloorTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #191f28;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E5E8EB;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(49, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(49, 130, 246, 0); }
`;

const TableCard = styled.div`
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  border: 2px solid ${(p) =>
    p.$status === 'empty' ? '#E8F5E9' : '#E3F2FD'};
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TableNumber = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #191f28;
`;

const FloorBadge = styled.div`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f2f3f5;
  color: #8b95a1;
`;

const IncompleteBadge = styled.div`
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #F44336;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) =>
    p.$status === 'empty' ? '#4CAF50' : '#3182F6'};
`;

const CardStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${(p) =>
    p.$status === 'empty' ? '#4CAF50' : '#3182F6'};
  font-weight: 600;
  margin-bottom: 8px;
`;

const CardInfo = styled.div`
  font-size: 12px;
  color: #8b95a1;
`;

/* 모달 */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: calc(100vw - 32px);
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #E5E8EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
`;

const CloseBtn = styled.button`
  font-size: 20px;
  color: #8b95a1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: #191f28;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const SectionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 12px;
  padding-top: 16px;
  border-top: 1px solid #f2f3f5;
`;

const SectionTitleText = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #191f28;
`;

const AddOrderBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 12px;
  border: 1px solid #3182F6;
  border-radius: 999px;
  background: white;
  color: #3182F6;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #3182F6;
    color: white;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
`;

const InfoLabel = styled.span`
  color: #8b95a1;
`;

const InfoValue = styled.span`
  color: #191f28;
  font-weight: 600;
`;

const SectionTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #191f28;
  margin: 20px 0 12px;
  padding-top: 16px;
  border-top: 1px solid #f2f3f5;
`;

const OrderItem = styled.div`
  background: #f8f9fa;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 8px;
`;

const OrderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const OrderId = styled.span`
  font-size: 12px;
  color: #8b95a1;
  font-family: monospace;
`;

const OrderBadge = styled.span`
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: ${(p) => statusColors[p.$status]?.bg || '#E5E8EB'};
  color: ${(p) => statusColors[p.$status]?.text || '#333'};
`;

const OrderMenus = styled.div`
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
`;

const OrderPrice = styled.div`
  font-size: 13px;
  color: #8b95a1;
`;

const EmptyOrders = styled.div`
  text-align: center;
  padding: 24px;
  color: #8b95a1;
  font-size: 14px;
`;

const TotalBox = styled.div`
  background: #F0F6FF;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TotalLabel = styled.div`
  font-size: 14px;
  color: #1B6CE5;
  font-weight: 600;
`;

const TotalAmount = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #1B6CE5;
  font-variant-numeric: tabular-nums;
`;

const ConfirmAmount = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #F44336;
  text-align: center;
  margin: 16px 0 8px;
  font-variant-numeric: tabular-nums;
`;

const ConfirmQuestion = styled.div`
  font-size: 15px;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
  line-height: 1.5;
`;

const ConfirmHint = styled.div`
  font-size: 12px;
  color: #8b95a1;
  text-align: center;
  margin-bottom: 8px;
`;

const CancelConfirmBtn = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid #E5E8EB;
  border-radius: 10px;
  background: white;
  color: #333;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #F5F6F8;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #E5E8EB;
  display: flex;
  gap: 8px;
`;

const DeleteBtn = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid #E5E8EB;
  border-radius: 10px;
  background: white;
  color: #F44336;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #FFF5F5;
    border-color: #F44336;
  }
`;

const ClearBtn = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #F44336;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #D32F2F;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px;
  color: #8b95a1;
  font-size: 15px;
`;

const QrBtn = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid #3182F6;
  border-radius: 10px;
  background: white;
  color: #3182F6;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #F0F6FF;
  }
`;

const QrModalInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  gap: 20px;
`;

const QrTableLabel = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
`;

const QrUrl = styled.div`
  font-size: 12px;
  color: #8b95a1;
  word-break: break-all;
  text-align: center;
  max-width: 320px;
`;

const QrActions = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const QrPrintBtn = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: #3182F6;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #1B6CE5;
  }
`;

const QrPrintAllBtn = styled.button`
  padding: 10px 20px;
  background: white;
  color: #3182F6;
  border: 1px solid #3182F6;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #F0F6FF;
  }
`;

const QrPrintArea = styled.div`
  @media print {
    position: fixed;
    inset: 0;
    background: white;
    z-index: 9999;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: flex-start;
    padding: 20px;
    gap: 24px;
  }
`;

const QrPrintCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;

  @media print {
    page-break-inside: avoid;
    border: 1px solid #E5E8EB;
    border-radius: 12px;
    padding: 24px;
  }
`;

const QrPrintLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #191f28;

  @media print {
    font-size: 18px;
  }
`;

function getTableStatus(table) {
  const orders = table.allOrders || table.activeOrders || [];
  if (orders.length === 0) return 'empty';
  return 'dining';
}

function getStatusText(status) {
  if (status === 'empty') return '비어있음';
  return '식사중';
}

function getElapsedTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 경과`;
  const h = Math.floor(min / 60);
  return `${h}시간 ${min % 60}분 경과`;
}

export default function TablesPage() {
  const { loading } = useAuth();
  const { data: tables = [], isLoading } = useTables();
  const updateTable = useUpdateTable();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const [floorFilter, setFloorFilter] = useState('all');
  const [selectedTable, setSelectedTable] = useState(null);
  const [confirmClearTable, setConfirmClearTable] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrTable, setQrTable] = useState(null);
  const [showQrAll, setShowQrAll] = useState(false);
  const [orderTable, setOrderTable] = useState(null);
  const printRef = useRef(null);
  const [newFloor, setNewFloor] = useState('1');
  const [newNumber, setNewNumber] = useState('');

  useEffect(() => {
    if (!selectedTable) return;
    const fresh = tables.find((t) => t._id === selectedTable._id);
    if (fresh && fresh !== selectedTable) setSelectedTable(fresh);
  }, [tables]);

  const filtered = floorFilter === 'all'
    ? tables
    : tables.filter((t) => t.floor === Number(floorFilter));

  const getSessionTotal = (table) => {
    if (!table) return 0;
    return (table.allOrders || [])
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  };

  const handleAskClear = () => {
    if (!selectedTable) return;
    setConfirmClearTable(selectedTable);
  };

  const handleConfirmClear = () => {
    if (!confirmClearTable) return;
    updateTable.mutate(
      { id: confirmClearTable._id, isOccupied: false, currentOrderCount: 0, lastClearedAt: new Date().toISOString() },
      {
        onSuccess: () => {
          setConfirmClearTable(null);
          setSelectedTable(null);
        },
      }
    );
  };

  const handleDeleteTable = () => {
    if (!selectedTable) return;
    if (window.confirm(`${selectedTable.floor}층 ${selectedTable.number}번 테이블을 삭제하시겠습니까?`)) {
      deleteTable.mutate(selectedTable._id, {
        onSuccess: () => setSelectedTable(null),
      });
    }
  };

  const handleAddTable = () => {
    if (!newNumber) return;
    createTable.mutate(
      { floor: Number(newFloor), number: Number(newNumber) },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setNewNumber('');
          setNewFloor('1');
        },
      }
    );
  };

  const getQrUrl = (table) => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:3001/table/${table.token}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return null;

  const emptyCount = tables.filter((t) => getTableStatus(t) === 'empty').length;
  const busyCount = tables.length - emptyCount;

  return (
    <PageContainer>
      <Sidebar active="tables" />
      <MainArea>
        <Header />
        <Content>
          <TitleRow>
            <PageTitle>테이블 현황 ({emptyCount}석 여유 / {busyCount}석 사용중)</PageTitle>
            <div style={{ display: 'flex', gap: 8 }}>
              <QrPrintAllBtn onClick={() => setShowQrAll(true)}>QR 전체 출력</QrPrintAllBtn>
              <AddBtn onClick={() => setShowAddModal(true)}>+ 테이블 추가</AddBtn>
            </div>
          </TitleRow>

          <TabsRow>
            <Tab $active={floorFilter === 'all'} onClick={() => setFloorFilter('all')}>전체</Tab>
            <Tab $active={floorFilter === '1'} onClick={() => setFloorFilter('1')}>1층</Tab>
            <Tab $active={floorFilter === '2'} onClick={() => setFloorFilter('2')}>2층</Tab>
            <Tab $active={floorFilter === '3'} onClick={() => setFloorFilter('3')}>야외</Tab>
          </TabsRow>

          <Legend>
            <LegendItem><LegendDot $color="#4CAF50" />비어있음</LegendItem>
            <LegendItem><LegendDot $color="#3182F6" />식사중</LegendItem>
          </Legend>

          {isLoading ? (
            <EmptyState>로딩 중...</EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState>테이블이 없습니다</EmptyState>
          ) : (
            [
              { floor: 1, label: '1층' },
              { floor: 2, label: '2층' },
              { floor: 3, label: '야외' },
            ]
              .filter(({ floor }) => {
                const has = filtered.some((t) => t.floor === floor);
                return has;
              })
              .map(({ floor, label }) => (
                <FloorSection key={floor}>
                  <FloorTitle>{label}</FloorTitle>
                  <Grid>
                    {filtered
                      .filter((t) => t.floor === floor)
                      .map((table) => {
                        const tStatus = getTableStatus(table);
                        const incompleteCount = (table.allOrders || []).filter(o => o.status !== 'served' && o.status !== 'cancelled').length;
                        return (
                          <TableCard
                            key={table._id}
                            $status={tStatus}
                            onClick={() => setSelectedTable(table)}
                          >
                            {incompleteCount > 0 && <IncompleteBadge>{incompleteCount}</IncompleteBadge>}
                            <CardTop>
                              <TableNumber>{table.number}번</TableNumber>
                              <FloorBadge>{label}</FloorBadge>
                            </CardTop>
                            <CardStatus $status={tStatus}>
                              <StatusDot $status={tStatus} />
                              {getStatusText(tStatus)}
                            </CardStatus>
                            <CardInfo>
                              {tStatus === 'empty'
                                ? '손님 없음'
                                : `${(table.allOrders || table.activeOrders || []).length}건 주문 · ${getElapsedTime(table.lastOrderTime)}`}
                            </CardInfo>
                          </TableCard>
                        );
                      })}
                  </Grid>
                </FloorSection>
              ))
          )}

          {/* 테이블 상세 모달 */}
          {selectedTable && (
            <Overlay onClick={() => setSelectedTable(null)}>
              <Modal onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>
                    {selectedTable.floor}층 {selectedTable.number}번 테이블
                    <span style={{ fontSize: 13, color: '#3182F6', fontWeight: 600, cursor: 'pointer', marginLeft: 12 }} onClick={() => { setSelectedTable(null); setQrTable(selectedTable); }}>QR코드</span>
                  </ModalTitle>
                  <CloseBtn onClick={() => setSelectedTable(null)}>&times;</CloseBtn>
                </ModalHeader>
                <ModalBody>
                  <InfoRow>
                    <InfoLabel>상태</InfoLabel>
                    <InfoValue>{getStatusText(getTableStatus(selectedTable))}</InfoValue>
                  </InfoRow>
                  {selectedTable.lastOrderTime && (
                    <InfoRow>
                      <InfoLabel>체류 시간</InfoLabel>
                      <InfoValue>{getElapsedTime(selectedTable.lastOrderTime)}</InfoValue>
                    </InfoRow>
                  )}

                  {(selectedTable.allOrders || []).length > 0 && (
                    <TotalBox>
                      <TotalLabel>세션 합산 (계산 대상)</TotalLabel>
                      <TotalAmount>{getSessionTotal(selectedTable).toLocaleString()}원</TotalAmount>
                    </TotalBox>
                  )}

                  <SectionTitleRow>
                    <SectionTitleText>미완료 주문</SectionTitleText>
                    <AddOrderBtn onClick={() => setOrderTable(selectedTable)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      주문 추가
                    </AddOrderBtn>
                  </SectionTitleRow>
                  {(() => {
                    const incomplete = (selectedTable.allOrders || []).filter(o => o.status !== 'served' && o.status !== 'cancelled');
                    return incomplete.length === 0 ? (
                      <EmptyOrders>미완료 주문이 없습니다</EmptyOrders>
                    ) : (
                      incomplete.map((order) => (
                        <OrderItem key={order._id}>
                          <OrderTop>
                            <OrderId>#{(order._id || '').slice(-6).toUpperCase()}</OrderId>
                            <OrderBadge $status={order.status}>
                              {allStatusLabels[order.status] || order.status}
                            </OrderBadge>
                          </OrderTop>
                          <OrderMenus>
                            {(order.items || []).map((i) => `${i.name} x${i.quantity}`).join(', ')}
                          </OrderMenus>
                          <OrderPrice>{Number(order.totalPrice || 0).toLocaleString()}원</OrderPrice>
                        </OrderItem>
                      ))
                    );
                  })()}

                  <SectionTitle>완료된 주문</SectionTitle>
                  {(() => {
                    const completed = (selectedTable.allOrders || []).filter(o => o.status === 'served');
                    return completed.length === 0 ? (
                      <EmptyOrders>완료된 주문이 없습니다</EmptyOrders>
                    ) : (
                      completed.map((order) => (
                        <OrderItem key={order._id}>
                          <OrderTop>
                            <OrderId>#{(order._id || '').slice(-6).toUpperCase()}</OrderId>
                            <OrderBadge $status={order.status}>
                              {allStatusLabels[order.status] || order.status}
                            </OrderBadge>
                          </OrderTop>
                          <OrderMenus>
                            {(order.items || []).map((i) => `${i.name} x${i.quantity}`).join(', ')}
                          </OrderMenus>
                          <OrderPrice>{Number(order.totalPrice || 0).toLocaleString()}원</OrderPrice>
                        </OrderItem>
                      ))
                    );
                  })()}
                </ModalBody>
                <ModalFooter>
                  <DeleteBtn onClick={handleDeleteTable}>삭제</DeleteBtn>
                  {(selectedTable.allOrders?.length > 0 || selectedTable.activeOrders?.length > 0) && (
                    <ClearBtn onClick={handleAskClear} disabled={updateTable.isPending}>
                      테이블 비우기
                    </ClearBtn>
                  )}
                </ModalFooter>
              </Modal>
            </Overlay>
          )}
          {/* 테이블 비우기 확인 모달 */}
          {confirmClearTable && (
            <Overlay onClick={() => !updateTable.isPending && setConfirmClearTable(null)}>
              <Modal onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: 'calc(100vw - 32px)' }}>
                <ModalHeader>
                  <ModalTitle>테이블 비우기</ModalTitle>
                  <CloseBtn onClick={() => !updateTable.isPending && setConfirmClearTable(null)}>&times;</CloseBtn>
                </ModalHeader>
                <ModalBody>
                  <ConfirmQuestion>
                    {confirmClearTable.floor}층 {confirmClearTable.number}번 테이블 합산 금액
                  </ConfirmQuestion>
                  <ConfirmAmount>{getSessionTotal(confirmClearTable).toLocaleString()}원</ConfirmAmount>
                  <ConfirmQuestion>계산이 완료되었나요?</ConfirmQuestion>
                  <ConfirmHint>한 번 비우면 되돌릴 수 없어요</ConfirmHint>
                </ModalBody>
                <ModalFooter>
                  <CancelConfirmBtn onClick={() => setConfirmClearTable(null)} disabled={updateTable.isPending}>
                    취소
                  </CancelConfirmBtn>
                  <ClearBtn onClick={handleConfirmClear} disabled={updateTable.isPending}>
                    {updateTable.isPending ? '비우는 중...' : '비우기'}
                  </ClearBtn>
                </ModalFooter>
              </Modal>
            </Overlay>
          )}
          {/* 테이블 추가 모달 */}
          {showAddModal && (
            <Overlay onClick={() => setShowAddModal(false)}>
              <Modal onClick={(e) => e.stopPropagation()} style={{ width: 360, maxWidth: 'calc(100vw - 32px)' }}>
                <ModalHeader>
                  <ModalTitle>테이블 추가</ModalTitle>
                  <CloseBtn onClick={() => setShowAddModal(false)}>&times;</CloseBtn>
                </ModalHeader>
                <AddModalBody>
                  <FieldRow>
                    <FieldLabel>위치</FieldLabel>
                    <FieldSelect value={newFloor} onChange={(e) => setNewFloor(e.target.value)}>
                      <option value="1">1층</option>
                      <option value="2">2층</option>
                      <option value="3">야외</option>
                    </FieldSelect>
                  </FieldRow>
                  <FieldRow>
                    <FieldLabel>테이블 번호</FieldLabel>
                    <FieldInput
                      type="number"
                      min="1"
                      placeholder="번호 입력"
                      value={newNumber}
                      onChange={(e) => setNewNumber(e.target.value)}
                    />
                  </FieldRow>
                  <SubmitBtn onClick={handleAddTable} disabled={!newNumber || createTable.isPending}>
                    {createTable.isPending ? '추가 중...' : '추가하기'}
                  </SubmitBtn>
                </AddModalBody>
              </Modal>
            </Overlay>
          )}
          {/* 개별 QR코드 모달 */}
          {qrTable && (
            <Overlay onClick={() => setQrTable(null)}>
              <Modal onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: 'calc(100vw - 32px)' }}>
                <ModalHeader>
                  <ModalTitle>QR코드</ModalTitle>
                  <CloseBtn onClick={() => setQrTable(null)}>&times;</CloseBtn>
                </ModalHeader>
                <QrModalInner>
                  <QrTableLabel>{qrTable.floor}층 {qrTable.number}번 테이블</QrTableLabel>
                  <QRCodeSVG value={getQrUrl(qrTable)} size={200} level="H" />
                  <QrUrl>{getQrUrl(qrTable)}</QrUrl>
                  <QrActions>
                    <QrPrintBtn onClick={() => { setQrTable(null); setShowQrAll(qrTable); }}>인쇄</QrPrintBtn>
                  </QrActions>
                </QrModalInner>
              </Modal>
            </Overlay>
          )}

          {/* 주문 추가 모달 */}
          {orderTable && (
            <OrderCreateModal
              table={orderTable}
              onClose={() => setOrderTable(null)}
            />
          )}

          {/* QR코드 전체/개별 인쇄 모달 */}
          {showQrAll && (
            <Overlay onClick={() => setShowQrAll(false)}>
              <Modal onClick={(e) => e.stopPropagation()} style={{ width: 600, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh' }}>
                <ModalHeader>
                  <ModalTitle>
                    {showQrAll._id ? `${showQrAll.floor}층 ${showQrAll.number}번 QR 인쇄` : 'QR코드 전체 출력'}
                  </ModalTitle>
                  <CloseBtn onClick={() => setShowQrAll(false)}>&times;</CloseBtn>
                </ModalHeader>
                <QrPrintArea ref={printRef} id="qr-print-area">
                  {(showQrAll._id ? [showQrAll] : tables).map((table) => (
                    <QrPrintCard key={table._id}>
                      <QrPrintLabel>{table.floor}층 {table.number}번</QrPrintLabel>
                      <QRCodeSVG value={getQrUrl(table)} size={160} level="H" />
                    </QrPrintCard>
                  ))}
                </QrPrintArea>
                <ModalFooter>
                  <QrPrintBtn onClick={handlePrint} style={{ flex: 1 }}>인쇄하기</QrPrintBtn>
                </ModalFooter>
              </Modal>
            </Overlay>
          )}
        </Content>
      </MainArea>
    </PageContainer>
  );
}
