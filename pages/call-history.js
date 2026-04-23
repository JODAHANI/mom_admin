import { useState } from 'react';
import styled from 'styled-components';
import { useAtom } from 'jotai';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useStaffCallHistory, useResolveStaffCall } from '../hooks/useStaffCalls';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { simpleViewAtom } from '../store/atoms';

const statusColors = {
  pending: { bg: '#FF9800', text: 'white' },
  resolved: { bg: '#9E9E9E', text: 'white' },
};

const statusLabels = {
  pending: '대기중',
  resolved: '처리완료',
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

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
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

const TotalCount = styled.div`
  font-size: 13px;
  color: #8b95a1;
  margin-bottom: 12px;

  strong {
    color: #191f28;
    font-weight: 700;
  }
`;

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
    min-width: 600px;
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

const TimeCell = styled.div`
  font-size: 13.5px;
  color: #4B5563;
  font-variant-numeric: tabular-nums;
`;

const EmptyRow = styled.tr`
  td {
    text-align: center;
    padding: 40px;
    color: #8b95a1;
  }
`;

const ResolveBtn = styled.button`
  padding: 8px 16px;
  border: 1.5px solid #E5E8EB;
  border-radius: 8px;
  background: white;
  color: #4CAF50;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 80px;

  &:hover:not(:disabled) {
    background: #F1F8E9;
    border-color: #4CAF50;
  }

  &:disabled {
    color: #8b95a1;
    cursor: wait;
    opacity: 0.7;
  }
`;

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
function getToday() { return toLocalDate(new Date()); }
function getWeekAgo() { const d = new Date(); d.setDate(d.getDate() - 7); return toLocalDate(d); }
function getMonthStart() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; }

function formatDateTime(str) {
  if (!str) return '-';
  const d = new Date(str);
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${mo}/${da} ${h}:${m}`;
}

function elapsed(from, to) {
  if (!from || !to) return '-';
  const diff = new Date(to).getTime() - new Date(from).getTime();
  if (diff < 0) return '-';
  const min = Math.floor(diff / 60000);
  if (min < 1) return '1분 이내';
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}시간 ${m}분`;
}

export default function CallHistoryPage() {
  const { loading } = useAuth();
  const [simpleView] = useAtom(simpleViewAtom);
  const resolveCall = useResolveStaffCall();
  const showToast = useToast();
  const [resolvingId, setResolvingId] = useState(null);
  const today = getToday();

  const handleResolve = (call) => {
    if (!call?._id || resolvingId) return;
    setResolvingId(call._id);
    const tableLabel = call.tableNumber
      ? `${call.floor || 1}층 ${call.tableNumber}번`
      : '호출';
    resolveCall.mutate(call._id, {
      onSuccess: () => showToast(`${tableLabel} 호출 처리 완료`, 'success'),
      onError: (err) => {
        const msg = err?.response?.data?.message || '처리에 실패했습니다';
        showToast(msg, 'error');
      },
      onSettled: () => setResolvingId(null),
    });
  };

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState('all');
  const [floor, setFloor] = useState('');
  const [quickRange, setQuickRange] = useState('today');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useStaffCallHistory({
    startDate, endDate, status, floor, page, limit,
  });

  const calls = data?.calls || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const pendingCount = calls.filter((c) => c.status === 'pending').length;
  const resolvedCount = calls.filter((c) => c.status === 'resolved').length;

  const applyQuick = (range) => {
    setQuickRange(range);
    setPage(1);
    if (range === 'today') { setStartDate(today); setEndDate(today); }
    else if (range === 'week') { setStartDate(getWeekAgo()); setEndDate(today); }
    else if (range === 'month') { setStartDate(getMonthStart()); setEndDate(today); }
  };

  const handleDateChange = (field, value) => {
    setQuickRange('');
    setPage(1);
    if (field === 'start') setStartDate(value);
    else setEndDate(value);
  };

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="call-history" />
      <MainArea>
        <Header />
        <Content>
          <PageHeader>
            <PageTitle>호출 내역</PageTitle>
          </PageHeader>

          {!simpleView && (
            <StatsRow>
              <StatCard $color="#3182F6">
                <StatLabel>총 호출</StatLabel>
                <StatValue>{total.toLocaleString()}건</StatValue>
              </StatCard>
              <StatCard $color="#FF9800">
                <StatLabel>대기중</StatLabel>
                <StatValue>{pendingCount.toLocaleString()}건</StatValue>
              </StatCard>
              <StatCard $color="#9E9E9E">
                <StatLabel>처리완료</StatLabel>
                <StatValue>{resolvedCount.toLocaleString()}건</StatValue>
              </StatCard>
            </StatsRow>
          )}

          {!simpleView && (
          <FilterSection>
            <FilterGroup>
              <FilterLabel>시작일</FilterLabel>
              <FilterInput type="date" value={startDate} onChange={(e) => handleDateChange('start', e.target.value)} />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>종료일</FilterLabel>
              <FilterInput type="date" value={endDate} onChange={(e) => handleDateChange('end', e.target.value)} />
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
                <option value="pending">대기중</option>
                <option value="resolved">처리완료</option>
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>층</FilterLabel>
              <FilterSelect value={floor} onChange={(e) => { setFloor(e.target.value); setPage(1); }}>
                <option value="">전체</option>
                <option value="1">1층</option>
                <option value="2">2층</option>
                <option value="3">야외</option>
              </FilterSelect>
            </FilterGroup>
          </FilterSection>
          )}

          {!simpleView && (
            <TotalCount>총 <strong>{total.toLocaleString()}</strong>건</TotalCount>
          )}

          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>테이블</Th>
                  <Th>호출시간</Th>
                  <Th>상태</Th>
                  <Th>처리자</Th>
                  <Th>처리시간</Th>
                  <Th>소요시간</Th>
                  <Th>작업</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <EmptyRow><td colSpan={7}>로딩 중...</td></EmptyRow>
                ) : calls.length === 0 ? (
                  <EmptyRow><td colSpan={7}>호출 내역이 없습니다</td></EmptyRow>
                ) : (
                  calls.map((c) => {
                    const isResolving = resolvingId === c._id;
                    return (
                      <tr key={c._id}>
                        <Td>
                          <TableCell>
                            <TableDot $color={getTableColor(c.tableId)} />
                            {c.tableNumber ? `${c.floor || 1}층 ${c.tableNumber}번` : '-'}
                          </TableCell>
                        </Td>
                        <Td><TimeCell>{formatDateTime(c.createdAt)}</TimeCell></Td>
                        <Td>
                          <StatusBadge $status={c.status}>
                            {statusLabels[c.status] || c.status}
                          </StatusBadge>
                        </Td>
                        <Td>
                          {c.resolvedBy?.name || (c.status === 'resolved' ? '-' : '')}
                        </Td>
                        <Td>
                          <TimeCell>{c.resolvedAt ? formatDateTime(c.resolvedAt) : '-'}</TimeCell>
                        </Td>
                        <Td>
                          <TimeCell>{c.resolvedAt ? elapsed(c.createdAt, c.resolvedAt) : '-'}</TimeCell>
                        </Td>
                        <Td>
                          {c.status === 'pending' ? (
                            <ResolveBtn onClick={() => handleResolve(c)} disabled={isResolving}>
                              {isResolving ? '처리중...' : '처리완료'}
                            </ResolveBtn>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: 13 }}>—</span>
                          )}
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </TableWrapper>

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
        </Content>
      </MainArea>
    </PageContainer>
  );
}
