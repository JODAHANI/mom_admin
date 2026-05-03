import { useState } from 'react';
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
  margin-left: var(--sidebar-width, 240px);
  transition: margin-left 0.25s ease;
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
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
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
  display: flex;
  background: white;
  border-radius: 16px;
  padding: 20px 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;

  @media (max-width: 600px) {
    padding: 14px 6px;
    border-radius: 14px;
  }
`;

const StatCard = styled.div`
  --accent: ${(p) => p.$color || '#3182F6'};
  flex: 1 1 0;
  min-width: 0;
  padding: 0 16px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 26px;
    background: var(--accent);
    border-radius: 2px;
  }

  &:first-child::before {
    display: none;
  }

  @media (max-width: 1000px) {
    padding: 0 12px;
  }

  @media (max-width: 600px) {
    flex: 1 1 50%;
    padding: 10px 12px;

    &::before {
      width: 2px;
      height: 20px;
    }

    &:nth-child(odd)::before {
      display: none;
    }
  }
`;

const StatLabel = styled.div`
  font-size: 10px;
  color: #8b95a1;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 600px) {
    font-size: 9px;
    letter-spacing: 0.7px;
    margin-bottom: 6px;
  }
`;

const StatValue = styled.div`
  font-size: clamp(16px, 1.8vw, 28px);
  font-weight: 800;
  color: var(--accent, #191f28);
  letter-spacing: -0.6px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 600px) {
    font-size: 20px;
    letter-spacing: -0.4px;
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

/* 카운트 바 */
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

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11.5px;
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

/* 세션 카드 리스트 */
const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SessionCard = styled.div`
  background: white;
  border-radius: 14px;
  border: 1px solid #EEF0F3;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #DCE2EA;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
  }

  ${(p) => p.$open && `
    border-color: #BFD4FF;
    box-shadow: 0 4px 18px rgba(49, 130, 246, 0.10);
  `}
`;

const HeadRow = styled.div`
  display: grid;
  grid-template-columns: 4px 1fr;
  cursor: pointer;
`;

const AccentBar = styled.div`
  background: ${(p) => p.$color};
`;

const HeadBody = styled.div`
  padding: 16px 20px 14px;
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 10px;
  column-gap: 16px;
  align-items: center;

  @media (max-width: 600px) {
    padding: 14px 16px 12px;
  }
`;

const HeadTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const TableLabel = styled.div`
  font-size: 17px;
  font-weight: 800;
  color: #191f28;
  letter-spacing: -0.2px;
`;

const TimeText = styled.span`
  font-size: 12.5px;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const SoftDot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #cbd2da;
  display: inline-block;
`;

const HeadAmount = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #191f28;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.4px;
  text-align: right;

  @media (max-width: 600px) {
    grid-column: 1 / -1;
    text-align: left;
    font-size: 20px;
  }
`;

const MenuSummary = styled.div`
  grid-column: 1 / -1;
  font-size: 13.5px;
  color: #4B5563;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FootRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px dashed #EEF0F3;
`;

const FootMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #F5F7FA;
  font-size: 12px;
  color: #4B5563;
  font-weight: 600;
`;

const StaffChip = styled(MetaChip)`
  background: #EEF4FF;
  color: #1B6CE5;
`;

const CancelledChip = styled(MetaChip)`
  background: #FFEFEF;
  color: #DC2626;
`;

const FootActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ExpandBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #E5E8EB;
  border-radius: 8px;
  background: white;
  color: #4B5563;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s;

  &:hover { border-color: #3182F6; color: #3182F6; }

  & > .arrow {
    display: inline-block;
    transition: transform 0.15s;
    transform: ${(p) => (p.$open ? 'rotate(90deg)' : 'rotate(0)')};
    font-size: 14px;
    line-height: 1;
  }
`;

const PrintBtn = styled.button`
  padding: 8px 14px;
  border: 1.5px solid #E5E8EB;
  border-radius: 8px;
  background: white;
  color: #3182F6;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;

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

const Detail = styled.div`
  padding: 12px 18px 16px 22px;
  background: #FAFBFC;
  border-top: 1px solid #EEF0F3;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OrderBox = styled.div`
  background: white;
  border-radius: 10px;
  border: 1px solid #EEF0F3;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 14px;
  align-items: flex-start;
  border-left: 3px solid ${(p) => p.$accent || '#D1D5DB'};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const OrderMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const OrderNo = styled.span`
  font-family: monospace;
  color: #8b95a1;
  font-size: 12px;
  letter-spacing: 0.04em;
`;

const OrderTime = styled.span`
  font-size: 12px;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const OrderItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
  line-height: 1.55;
  color: #1b1d1f;
  min-width: 0;

  & .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  & .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & .qty {
    color: #4B5563;
    font-weight: 700;
    margin-left: 4px;
  }

  & .price {
    color: #8b95a1;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
`;

const OrderRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;

  @media (max-width: 600px) {
    align-items: flex-start;
  }
`;

const OrderStaffNote = styled.span`
  font-size: 11.5px;
  color: #8b95a1;
  word-break: keep-all;
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 14px;
  border: 1px solid #EEF0F3;
  padding: 60px 20px;
  text-align: center;
  color: #8b95a1;
  font-size: 14px;
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
        <Content>
          <Header title="주문내역" />
          <PageHeader>
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
          <SessionList>
            {isLoading ? (
              <EmptyState>로딩 중...</EmptyState>
            ) : sessions.length === 0 ? (
              <EmptyState>주문내역이 없습니다</EmptyState>
            ) : (
              sessions.map((s) => {
                const isOpen = expandedId === s.id;
                const isPrinting = printingId === s.id;
                const tableLabel = s.tableNumber
                  ? `${s.floor || 1}층 ${s.tableNumber}번`
                  : '-';
                const accent = getTableColor(s.tableId);
                const staffNames = [
                  ...new Set(
                    (s.orders || [])
                      .filter((o) => o.servedBy)
                      .map((o) => o.servedBy.name || o.servedBy.email || '직원')
                  ),
                ];
                const toggle = () => setExpandedId(isOpen ? null : s.id);

                return (
                  <SessionCard key={s.id} $open={isOpen}>
                    <HeadRow onClick={toggle}>
                      <AccentBar $color={accent} />
                      <HeadBody>
                        <HeadTopRow>
                          <TableLabel>{tableLabel}</TableLabel>
                          <StatusBadge
                            style={{
                              background: sessionStatusColors[s.status]?.bg || '#e5e8eb',
                              color: sessionStatusColors[s.status]?.text || '#333',
                            }}
                          >
                            {sessionStatusLabels[s.status] || s.status}
                          </StatusBadge>
                          <SoftDot />
                          <TimeText>{formatSessionRange(s.startedAt, s.endedAt)}</TimeText>
                        </HeadTopRow>
                        <HeadAmount>{Number(s.totalPrice || 0).toLocaleString()}원</HeadAmount>
                        <MenuSummary title={formatMenuSummary(s.items)}>
                          {formatMenuSummary(s.items)}
                        </MenuSummary>
                        <FootRow>
                          <FootMeta>
                            <MetaChip>주문 {s.orderCount}건</MetaChip>
                            {s.cancelledCount > 0 && (
                              <CancelledChip>취소 {s.cancelledCount}건</CancelledChip>
                            )}
                            {staffNames.length > 0 && (
                              <StaffChip>전달 · {staffNames.join(', ')}</StaffChip>
                            )}
                          </FootMeta>
                          <FootActions onClick={(e) => e.stopPropagation()}>
                            <ExpandBtn $open={isOpen} onClick={toggle}>
                              {isOpen ? '주문 접기' : '주문 펼치기'}
                              <span className="arrow">▸</span>
                            </ExpandBtn>
                            <PrintBtn onClick={(e) => handlePrintSession(s, e)} disabled={isPrinting}>
                              {isPrinting ? '출력중' : '영수증'}
                            </PrintBtn>
                          </FootActions>
                        </FootRow>
                      </HeadBody>
                    </HeadRow>
                    {isOpen && (
                      <Detail>
                        {(s.orders || []).map((o) => {
                          const oid = o._id || o.id || '';
                          const items = o.items || [];
                          return (
                            <OrderBox key={oid} $accent={accent}>
                              <OrderMeta>
                                <OrderNo>#{String(oid).slice(-6).toUpperCase()}</OrderNo>
                                <OrderTime>{formatHM(o.createdAt)}</OrderTime>
                              </OrderMeta>
                              <OrderItems>
                                {items.length === 0 ? (
                                  <div className="row"><span className="name">-</span></div>
                                ) : (
                                  items.map((i, idx) => (
                                    <div className="row" key={idx}>
                                      <span className="name">
                                        {i.name}<span className="qty">x{i.quantity}</span>
                                      </span>
                                      <span className="price">
                                        {Number((i.price || 0) * (i.quantity || 0)).toLocaleString()}원
                                      </span>
                                    </div>
                                  ))
                                )}
                              </OrderItems>
                              <OrderRight>
                                <StatusBadge $status={o.status}>
                                  {statusLabels[o.status] || o.status}
                                </StatusBadge>
                                {o.status === 'served' && o.servedBy && (
                                  <OrderStaffNote>
                                    {o.servedBy.name || o.servedBy.email || '직원'}
                                  </OrderStaffNote>
                                )}
                              </OrderRight>
                            </OrderBox>
                          );
                        })}
                      </Detail>
                    )}
                  </SessionCard>
                );
              })
            )}
          </SessionList>

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
