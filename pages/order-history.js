import { Fragment, useState } from 'react';
import styled from 'styled-components';
import { useAtom } from 'jotai';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SalesCalendar from '../components/SalesCalendar';
import {
  useOrderSessions,
  useMonthlySales,
  usePrintSession,
} from '../hooks/useOrderHistory';
import { useAdmins } from '../hooks/useAdmins';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { simpleViewAtom } from '../store/atoms';

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

const sessionStatusColors = {
  active: { bg: '#FF9800', text: 'white' },
  served: { bg: '#9E9E9E', text: 'white' },
  cancelled: { bg: '#F44336', text: 'white' },
  mixed: { bg: '#FFC107', text: '#333' },
};

const sessionStatusLabels = {
  active: '진행중',
  served: '전달완료',
  cancelled: '전체취소',
  mixed: '일부취소',
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
  padding: 16px 18px;
  font-size: 12px;
  font-weight: 700;
  color: #6B7684;
  background: #F9FAFB;
  border-bottom: 2px solid #E5E8EB;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const Td = styled.td`
  padding: 18px;
  font-size: 14px;
  color: #191f28;
  border-bottom: 1px solid #EEF0F3;
  vertical-align: middle;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: ${(p) => statusColors[p.$status]?.bg || '#e5e8eb'};
  color: ${(p) => statusColors[p.$status]?.text || '#333'};
  white-space: nowrap;
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

const TableCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 15px;
  color: #1b1d1f;
`;

const TableDot = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

const MenuCell = styled.div`
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #4B5563;
  font-size: 13.5px;
`;

const OrderCountCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 14px;
  font-weight: 600;
  color: #1b1d1f;
`;

const AmountCell = styled.div`
  font-size: 17px;
  font-weight: 800;
  color: #191f28;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

const TimeCell = styled.div`
  font-size: 12.5px;
  color: #8b95a1;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
`;

const StaffCell = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1b1d1f;
  line-height: 1.4;
  word-break: keep-all;
  overflow-wrap: anywhere;
  max-width: 250px;
`;


const EmptyRow = styled.tr`
  td {
    text-align: center;
    padding: 40px;
    color: #8b95a1;
  }
`;

const PrintBtn = styled.button`
  padding: 8px 16px;
  border: 1.5px solid #E5E8EB;
  border-radius: 8px;
  background: white;
  color: #3182F6;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 72px;

  &:hover:not(:disabled) {
    background: #F2F8FF;
    border-color: #3182F6;
  }

  &:disabled {
    color: #8b95a1;
    cursor: wait;
    opacity: 0.7;
  }
`;

const SessionRow = styled.tr`
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: #F9FAFB; }
  ${(p) => p.$open && 'background: #F5F9FF;'}
`;

const ExpandIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #8b95a1;
  transform: ${(p) => (p.$open ? 'rotate(90deg)' : 'rotate(0)')};
  transition: transform 0.15s;
  font-size: 22px;
`;

const DetailRow = styled.tr`
  background: #FAFBFC;
  & > td {
    font-size: 13px;
    color: #4B5563;
    padding: 14px 18px 14px 48px;
    border-bottom: 1px solid #EEF0F3;
    border-left: 3px solid ${(p) => p.$accent || '#D1D5DB'};
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 110px 80px 1fr 120px 70px 90px;
  gap: 12px;
  align-items: flex-start;

  @media (max-width: 768px) {
    grid-template-columns: 100px 1fr 100px 60px 80px;
    & > *:nth-child(2) { display: none; }
  }
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.5;
`;

const ItemLine = styled.div`
  font-size: 13px;
  color: #1b1d1f;
  & > .price {
    color: #8b95a1;
    margin-left: 6px;
    font-variant-numeric: tabular-nums;
  }
`;

const OrderNo = styled.span`
  font-family: monospace;
  color: #8b95a1;
  font-size: 12px;
`;

const CancelledNote = styled.span`
  color: #F44336;
  font-size: 11px;
  margin-left: 6px;
  font-weight: 600;
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

function formatHM(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function sameDay(a, b) {
  const da = new Date(a); const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

function formatSessionRange(startedAt, endedAt) {
  if (!startedAt) return '';
  if (!endedAt || startedAt === endedAt) return formatDateTime(startedAt);
  if (sameDay(startedAt, endedAt)) {
    return `${formatDateTime(startedAt)} ~ ${formatHM(endedAt)}`;
  }
  return `${formatDateTime(startedAt)} ~ ${formatDateTime(endedAt)}`;
}

function formatMenuSummary(items) {
  if (!Array.isArray(items) || items.length === 0) return '-';
  const visible = items.slice(0, 2).map((i) => `${i.name} x${i.quantity}`).join(', ');
  const rest = items.length - 2;
  return rest > 0 ? `${visible} 외 ${rest}` : visible;
}

export default function OrderHistoryPage() {
  const { loading } = useAuth();
  const showToast = useToast();
  const printSession = usePrintSession();
  const [simpleView] = useAtom(simpleViewAtom);
  const [printingId, setPrintingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const today = getToday();
  const now = new Date();

  const handlePrintSession = (session, e) => {
    if (e) e.stopPropagation();
    if (!session?.orderIds?.length || printingId) return;
    setPrintingId(session.id);

    const tableLabel = session.tableNumber
      ? `${session.floor || 1}층 ${session.tableNumber}번`
      : `세션 ${session.id}`;

    printSession.mutate(session.orderIds, {
      onSuccess: () => showToast(`${tableLabel} 영수증 출력 완료`, 'success'),
      onError: (err) => {
        const msg = err?.response?.data?.message || '영수증 출력에 실패했습니다';
        showToast(msg, 'error');
      },
      onSettled: () => setPrintingId(null),
    });
  };

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
  const [servedBy, setServedBy] = useState('');
  const [page, setPage] = useState(1);
  const [quickRange, setQuickRange] = useState('today');
  const limit = 20;

  const { data: adminsData } = useAdmins();
  const admins = Array.isArray(adminsData) ? adminsData : adminsData?.data || [];

  const { data, isLoading } = useOrderSessions({
    startDate, endDate, status, tableNumber, search, servedBy, page, limit,
  }, { enabled: viewMode === 'list' });

  const summary = data?.summary;

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
    setServedBy('');
    setPage(1);
    setQuickRange('');
    setViewMode('list');
  };

  const sessions = data?.sessions || [];
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
            {renderViewToggle()}
          </PageHeader>

          {viewMode === 'calendar' ? (
            <>
              {!simpleView && (
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
              )}

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
          {/* 요약 카드 (세션 기준) — 뷰 모드에서 숨김 */}
          {!simpleView && (
            <StatsRow>
              <StatCard $color="#3182F6">
                <StatLabel>총 세션수</StatLabel>
                <StatValue>{summary?.sessionCount?.toLocaleString() || 0}건</StatValue>
              </StatCard>
              <StatCard $color="#4CAF50">
                <StatLabel>총 매출</StatLabel>
                <StatValue><Money value={summary?.totalRevenue} /></StatValue>
              </StatCard>
              <StatCard $color="#F44336">
                <StatLabel>취소 건수</StatLabel>
                <StatValue>{summary?.cancelledOrderCount?.toLocaleString() || 0}건</StatValue>
              </StatCard>
              <StatCard $color="#FF9800">
                <StatLabel>평균 세션금액</StatLabel>
                <StatValue><Money value={summary?.avgSession} /></StatValue>
              </StatCard>
            </StatsRow>
          )}

          {/* 필터 — 뷰 모드에서 숨김 */}
          {!simpleView && (
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
                <option value="served">전달완료</option>
                <option value="cancelled">취소</option>
                <option value="pending">조리대기</option>
                <option value="preparing">조리시작</option>
                <option value="ready">조리완료</option>
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
              <FilterLabel>직원</FilterLabel>
              <FilterSelect value={servedBy} onChange={(e) => { setServedBy(e.target.value); setPage(1); }}>
                <option value="">전체</option>
                {admins.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name || a.email}
                  </option>
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
          )}

          {/* 세션 카운트 — 뷰 모드에서 숨김 (뷰 토글은 상단 PageHeader로 이동) */}
          {!simpleView && (
            <TableBar>
              <TotalCount>
                총 <strong>{total.toLocaleString()}</strong> 세션
                {summary?.orderCount ? <> · <strong>{summary.orderCount.toLocaleString()}</strong> 주문</> : null}
              </TotalCount>
            </TableBar>
          )}
          <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: 24 }}></Th>
                <Th>테이블</Th>
                <Th>메뉴</Th>
                <Th>주문수</Th>
                <Th>합계</Th>
                <Th>상태</Th>
                <Th style={{ width: 250 }}>전달자</Th>
                <Th>시간</Th>
                <Th>영수증</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <EmptyRow><td colSpan={9}>로딩 중...</td></EmptyRow>
              ) : sessions.length === 0 ? (
                <EmptyRow><td colSpan={9}>주문내역이 없습니다</td></EmptyRow>
              ) : (
                sessions.map((s) => {
                  const isOpen = expandedId === s.id;
                  const isPrinting = printingId === s.id;
                  const tableLabel = s.tableNumber
                    ? `${s.floor || 1}층 ${s.tableNumber}번`
                    : '-';
                  const dotColor = getTableColor(s.tableId);
                  const staffNames = [
                    ...new Set(
                      (s.orders || [])
                        .filter((o) => o.servedBy)
                        .map((o) => o.servedBy.name || o.servedBy.email || '직원')
                    ),
                  ];

                  return (
                    <Fragment key={s.id}>
                      <SessionRow $open={isOpen} onClick={() => setExpandedId(isOpen ? null : s.id)}>
                        <Td style={{ paddingRight: 0 }}>
                          <ExpandIcon $open={isOpen}>▸</ExpandIcon>
                        </Td>
                        <Td>
                          <TableCell>
                            <TableDot $color={dotColor} />
                            {tableLabel}
                          </TableCell>
                        </Td>
                        <Td>
                          <MenuCell title={formatMenuSummary(s.items)}>
                            {formatMenuSummary(s.items)}
                          </MenuCell>
                        </Td>
                        <Td>
                          <OrderCountCell>
                            <span>{s.orderCount}건</span>
                            {s.cancelledCount > 0 && (
                              <CancelledNote style={{ margin: 0 }}>취소 {s.cancelledCount}</CancelledNote>
                            )}
                          </OrderCountCell>
                        </Td>
                        <Td>
                          <AmountCell>{Number(s.totalPrice || 0).toLocaleString()}원</AmountCell>
                        </Td>
                        <Td>
                          <StatusBadge
                            style={{
                              background: sessionStatusColors[s.status]?.bg || '#e5e8eb',
                              color: sessionStatusColors[s.status]?.text || '#333',
                            }}
                          >
                            {sessionStatusLabels[s.status] || s.status}
                          </StatusBadge>
                        </Td>
                        <Td>
                          <StaffCell>
                            {staffNames.length === 0 ? '-' : staffNames.join(', ')}
                          </StaffCell>
                        </Td>
                        <Td>
                          <TimeCell>{formatSessionRange(s.startedAt, s.endedAt)}</TimeCell>
                        </Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          <PrintBtn onClick={(e) => handlePrintSession(s, e)} disabled={isPrinting}>
                            {isPrinting ? '출력중' : '영수증'}
                          </PrintBtn>
                        </Td>
                      </SessionRow>
                      {isOpen && (s.orders || []).map((o) => {
                        const oid = o._id || o.id || '';
                        const items = o.items || [];
                        const totalQty = items.reduce((x, i) => x + (i.quantity || 0), 0);
                        return (
                          <DetailRow key={oid} $accent={dotColor}>
                            <td colSpan={9}>
                              <DetailGrid>
                                <OrderNo>#{String(oid).slice(-6).toUpperCase()}</OrderNo>
                                <span style={{ color: '#8b95a1', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                                  {formatHM(o.createdAt)}
                                </span>
                                <ItemList>
                                  {items.length === 0 ? (
                                    <ItemLine>-</ItemLine>
                                  ) : (
                                    items.map((i, idx) => (
                                      <ItemLine key={idx}>
                                        {i.name} <strong>x{i.quantity}</strong>
                                        <span className="price">{Number(i.price || 0).toLocaleString()}원</span>
                                      </ItemLine>
                                    ))
                                  )}
                                </ItemList>
                                <span style={{ fontSize: 12, color: '#8b95a1', wordBreak: 'keep-all' }}>
                                  {o.status === 'served' && o.servedBy
                                    ? `전달 : ${o.servedBy.name || o.servedBy.email || '직원'}`
                                    : ''}
                                </span>
                                <span style={{ color: '#8b95a1', fontSize: 12 }}>{totalQty}개</span>
                                <StatusBadge $status={o.status}>
                                  {statusLabels[o.status] || o.status}
                                </StatusBadge>
                              </DetailGrid>
                            </td>
                          </DetailRow>
                        );
                      })}
                    </Fragment>
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
