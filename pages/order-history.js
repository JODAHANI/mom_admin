import { useState } from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SalesCalendar from '../components/SalesCalendar';
import { useOrderHistory, useOrderStats, useMonthlySales } from '../hooks/useOrderHistory';
import { useAuth } from '../hooks/useAuth';

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

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
`;

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #191f28;
  margin: 0;
`;

const ViewToggle = styled.div`
  display: inline-flex;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
`;

const ViewBtn = styled.button`
  padding: 8px 16px;
  border: none;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  & + & {
    border-left: 1px solid #e5e8eb;
  }

  &:hover:not(:disabled) {
    background: ${(p) => (p.$active ? '#3182F6' : '#f8f9fa')};
  }
`;

/* 요약 카드 */
const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border-left: 12px solid ${(p) => p.$color || '#3182F6'};

  @media (max-width: 480px) {
    padding: 14px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #8b95a1;
  margin-bottom: 6px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #191f28;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const DesktopOnly = styled.span`
  @media (max-width: 480px) {
    display: none;
  }
`;

const MobileOnly = styled.span`
  display: none;
  @media (max-width: 480px) {
    display: inline;
  }
`;

/* 필터 */
const FilterSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  color: #8b95a1;
  font-weight: 600;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 14px;
  color: #191f28;
  outline: none;

  &:focus {
    border-color: #3182F6;
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  font-size: 14px;
  color: #191f28;
  background: white;
  outline: none;

  &:focus {
    border-color: #3182F6;
  }
`;

const QuickButtons = styled.div`
  display: flex;
  gap: 6px;
  align-items: flex-end;
`;

const QuickBtn = styled.button`
  padding: 8px 14px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#e5e8eb')};
  border-radius: 8px;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #3182F6;
  }
`;

/* 테이블 헤더 바 */
const TableBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
`;

const TotalCount = styled.div`
  font-size: 13px;
  color: #8b95a1;

  strong {
    color: #191f28;
    font-weight: 700;
  }
`;

/* 테이블 */
const TableWrapper = styled.div`
  @media (max-width: 768px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
  }
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border-collapse: collapse;

  @media (max-width: 768px) {
    min-width: 700px;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #8b95a1;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e8eb;
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: 14px;
  color: #191f28;
  border-bottom: 1px solid #f2f3f5;
  vertical-align: middle;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => statusColors[p.$status]?.bg || '#e5e8eb'};
  color: ${(p) => statusColors[p.$status]?.text || '#333'};
`;

const EmptyRow = styled.tr`
  td {
    text-align: center;
    padding: 40px;
    color: #8b95a1;
  }
`;

/* 페이지네이션 */
const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 20px;
`;

const PageBtn = styled.button`
  min-width: 36px;
  height: 36px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#e5e8eb')};
  border-radius: 8px;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: #3182F6;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

function toLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getToday() {
  return toLocalDate(new Date());
}

function getWeekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return toLocalDate(d);
}

function getMonthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatCompactWon(won) {
  const n = Number(won || 0);
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억원`;
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}만원`;
  return `${n.toLocaleString()}원`;
}

function Money({ value }) {
  const n = Number(value || 0);
  return (
    <>
      <DesktopOnly>{n.toLocaleString()}원</DesktopOnly>
      <MobileOnly>{formatCompactWon(n)}</MobileOnly>
    </>
  );
}

function formatDateTime(str) {
  if (!str) return '';
  const d = new Date(str);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${h}:${m}`;
}

export default function OrderHistoryPage() {
  const { loading } = useAuth();
  const today = getToday();
  const now = new Date();

  const [viewMode, setViewMode] = useState('list');
  const [calMonth, setCalMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState('all');
  const [tableNumber, setTableNumber] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [quickRange, setQuickRange] = useState('today');
  const limit = 20;

  const { data, isLoading } = useOrderHistory({
    startDate, endDate, status, tableNumber, search, page, limit,
  }, { enabled: viewMode === 'list' });

  const { data: stats } = useOrderStats(startDate, endDate, { enabled: viewMode === 'list' });

  const { data: monthly, isLoading: monthlyLoading } = useMonthlySales(
    calMonth.year,
    calMonth.month,
    { enabled: viewMode === 'calendar' },
  );

  const goPrevMonth = () => {
    setCalMonth((c) => {
      const m = c.month - 1;
      return m < 1 ? { year: c.year - 1, month: 12 } : { year: c.year, month: m };
    });
  };
  const goNextMonth = () => {
    setCalMonth((c) => {
      const m = c.month + 1;
      return m > 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: m };
    });
  };
  const goToday = () => {
    const d = new Date();
    setCalMonth({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };
  const handleDayClick = (dateKey) => {
    setStartDate(dateKey);
    setEndDate(dateKey);
    setStatus('all');
    setTableNumber('');
    setSearch('');
    setPage(1);
    setQuickRange('');
    setViewMode('list');
  };

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const applyQuick = (range) => {
    setQuickRange(range);
    setPage(1);
    if (range === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (range === 'week') {
      setStartDate(getWeekAgo());
      setEndDate(today);
    } else if (range === 'month') {
      setStartDate(getMonthStart());
      setEndDate(today);
    }
  };

  const handleDateChange = (field, value) => {
    setQuickRange('');
    setPage(1);
    if (field === 'start') setStartDate(value);
    else setEndDate(value);
  };

  if (loading) return null;

  const renderViewToggle = () => (
    <ViewToggle>
      <ViewBtn $active={viewMode === 'list'} onClick={() => setViewMode('list')}>리스트</ViewBtn>
      <ViewBtn $active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')}>매출달력</ViewBtn>
    </ViewToggle>
  );

  return (
    <PageContainer>
      <Sidebar active="order-history" />
      <MainArea>
        <Header />
        <Content>
          <PageHeader>
            <PageTitle>주문내역</PageTitle>
            {viewMode === 'calendar' && renderViewToggle()}
          </PageHeader>

          {viewMode === 'calendar' ? (
            <>
              <StatsRow>
                <StatCard $color="#3182F6">
                  <StatLabel>이 달 주문수</StatLabel>
                  <StatValue>{monthly?.totalCount?.toLocaleString() || 0}건</StatValue>
                </StatCard>
                <StatCard $color="#4CAF50">
                  <StatLabel>이 달 매출</StatLabel>
                  <StatValue><Money value={monthly?.totalRevenue} /></StatValue>
                </StatCard>
                <StatCard $color="#FF9800">
                  <StatLabel>일 평균 매출</StatLabel>
                  <StatValue><Money value={monthly?.avgDaily} /></StatValue>
                </StatCard>
                <StatCard $color="#9C27B0">
                  <StatLabel>최고 매출일</StatLabel>
                  <StatValue>
                    {monthly?.bestDay ? (
                      <>
                        {Number(monthly.bestDay.date.slice(8, 10))}일 · <Money value={monthly.bestDay.revenue} />
                      </>
                    ) : '-'}
                  </StatValue>
                </StatCard>
              </StatsRow>

              <SalesCalendar
                year={calMonth.year}
                month={calMonth.month}
                data={monthly}
                todayKey={today}
                loading={monthlyLoading}
                onPrev={goPrevMonth}
                onNext={goNextMonth}
                onToday={goToday}
                onDayClick={handleDayClick}
              />
            </>
          ) : (
            <>
          {/* 요약 카드 */}
          <StatsRow>
            <StatCard $color="#3182F6">
              <StatLabel>총 주문수</StatLabel>
              <StatValue>{stats?.totalOrders?.toLocaleString() || 0}건</StatValue>
            </StatCard>
            <StatCard $color="#4CAF50">
              <StatLabel>총 매출</StatLabel>
              <StatValue><Money value={stats?.totalRevenue} /></StatValue>
            </StatCard>
            <StatCard $color="#F44336">
              <StatLabel>취소 건수</StatLabel>
              <StatValue>{stats?.cancelledCount?.toLocaleString() || 0}건</StatValue>
            </StatCard>
            <StatCard $color="#FF9800">
              <StatLabel>평균 주문금액</StatLabel>
              <StatValue><Money value={stats?.avgPrice} /></StatValue>
            </StatCard>
          </StatsRow>

          {/* 필터 */}
          <FilterSection>
            <FilterGroup>
              <FilterLabel>시작일</FilterLabel>
              <FilterInput
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>종료일</FilterLabel>
              <FilterInput
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </FilterGroup>
            <QuickButtons>
              <QuickBtn $active={quickRange === 'today'} onClick={() => applyQuick('today')}>오늘</QuickBtn>
              <QuickBtn $active={quickRange === 'week'} onClick={() => applyQuick('week')}>이번주</QuickBtn>
              <QuickBtn $active={quickRange === 'month'} onClick={() => applyQuick('month')}>이번달</QuickBtn>
            </QuickButtons>
            <FilterGroup>
              <FilterLabel>상태</FilterLabel>
              <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="all">전체</option>
                <option value="served">서빙완료</option>
                <option value="cancelled">취소</option>
                <option value="pending">대기중</option>
                <option value="preparing">준비중</option>
                <option value="ready">준비완료</option>
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>테이블</FilterLabel>
              <FilterSelect value={tableNumber} onChange={(e) => { setTableNumber(e.target.value); setPage(1); }}>
                <option value="">전체</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={`1-${n}`} value={n}>1층 {n}번</option>
                ))}
                {[1, 2, 3].map((n) => (
                  <option key={`2-${n}`} value={n}>2층 {n}번</option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>메뉴 검색</FilterLabel>
              <FilterInput
                type="text"
                placeholder="메뉴명 검색"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </FilterGroup>
          </FilterSection>

          {/* 주문 테이블 */}
          <TableBar>
            {renderViewToggle()}
            <TotalCount>총 <strong>{total.toLocaleString()}</strong>건</TotalCount>
          </TableBar>
          <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>주문번호</Th>
                <Th>테이블</Th>
                <Th>메뉴</Th>
                <Th>수량</Th>
                <Th>금액</Th>
                <Th>상태</Th>
                <Th>주문시간</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <EmptyRow><td colSpan={7}>로딩 중...</td></EmptyRow>
              ) : orders.length === 0 ? (
                <EmptyRow><td colSpan={7}>주문내역이 없습니다</td></EmptyRow>
              ) : (
                orders.map((order) => {
                  const items = order.items || [];
                  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
                  const menuText = items.map((i) => i.name).join(', ');
                  const orderId = order._id || order.id || '';

                  return (
                    <tr key={orderId}>
                      <Td style={{ fontFamily: 'monospace', fontSize: 13, color: '#8b95a1' }}>
                        #{orderId.slice(-6).toUpperCase()}
                      </Td>
                      <Td>
                        {order.tableNumber
                          ? `${order.floor || 1}층 ${order.tableNumber}번`
                          : '-'}
                      </Td>
                      <Td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {menuText || '-'}
                      </Td>
                      <Td>{totalQty}개</Td>
                      <Td style={{ fontWeight: 600 }}>{Number(order.totalPrice || 0).toLocaleString()}원</Td>
                      <Td>
                        <StatusBadge $status={order.status}>{statusLabels[order.status] || order.status}</StatusBadge>
                      </Td>
                      <Td style={{ color: '#8b95a1', fontSize: 13 }}>{formatDateTime(order.createdAt)}</Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
          </TableWrapper>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Pagination>
              <PageBtn disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</PageBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dot-${i}`} style={{ padding: '0 4px', color: '#8b95a1' }}>...</span>
                  ) : (
                    <PageBtn key={p} $active={page === p} onClick={() => setPage(p)}>{p}</PageBtn>
                  )
                )}
              <PageBtn disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</PageBtn>
            </Pagination>
          )}
            </>
          )}
        </Content>
      </MainArea>
    </PageContainer>
  );
}
