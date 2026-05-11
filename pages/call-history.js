import { useState } from 'react';
import styled from 'styled-components';
import { useAtom } from 'jotai';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useStaffCallHistory, useResolveStaffCall } from '../hooks/useStaffCalls';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { simpleViewAtom } from '../store/atoms';
import FilterBar, { SegmentedControl, FilterRow } from '../components/FilterBar';

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

const StatsRow = styled.div`
  display: flex;
  background: white;
  border-radius: 16px;
  padding: 20px 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  @media (max-width: 600px) {
    padding: 14px 6px;
    border-radius: 14px;
  }
`;

const StatCard = styled.div`
  --accent: ${(p) => p.$color || '#3182F6'};
  flex: 1;
  min-width: 0;
  padding: 0 18px;
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

  @media (max-width: 900px) {
    padding: 0 12px;
  }

  @media (max-width: 600px) {
    padding: 0 10px;

    &::before {
      width: 2px;
      height: 20px;
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
  font-size: clamp(18px, 2.6vw, 32px);
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

const CallList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CallCard = styled.div`
  background: white;
  border-radius: 14px;
  border: 1px solid #EEF0F3;
  overflow: hidden;
  display: grid;
  grid-template-columns: 4px 1fr;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #DCE2EA;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
  }
`;

const AccentBar = styled.div`
  background: ${(p) => p.$color};
`;

const CardBody = styled.div`
  padding: 16px 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

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

const FootRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px dashed #EEF0F3;
`;

const FootActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
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

const ElapsedChip = styled(MetaChip)`
  background: #FFF7E6;
  color: #B45309;
`;

const ItemsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const ItemChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  background: #FFF3E0;
  color: #B45309;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid #FCE7B8;
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
function getYesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return toLocalDate(d); }
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
    else if (range === 'yesterday') { const y = getYesterday(); setStartDate(y); setEndDate(y); }
    else if (range === 'week') { setStartDate(getWeekAgo()); setEndDate(today); }
    else if (range === 'month') { setStartDate(getMonthStart()); setEndDate(today); }
  };

  const handleDateChange = (field, value) => {
    setQuickRange('');
    setPage(1);
    if (field === 'start') setStartDate(value);
    else setEndDate(value);
  };

  const handleReset = () => {
    setStartDate(today);
    setEndDate(today);
    setStatus('all');
    setFloor('');
    setQuickRange('today');
    setPage(1);
  };

  const detailCount = (status !== 'all' ? 1 : 0) + (floor ? 1 : 0);

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="call-history" />
      <MainArea>
        <Content>
          <Header title="호출 내역" />

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
            <FilterBar
              startDate={startDate}
              endDate={endDate}
              quickRange={quickRange}
              onDateChange={handleDateChange}
              onQuickRange={applyQuick}
              detailCount={detailCount}
              onReset={handleReset}
              totalText={<>총 <strong>{total.toLocaleString()}</strong>건</>}
              detailFilters={(
                <>
                  <FilterRow label="상태">
                    <SegmentedControl
                      value={status}
                      onChange={(v) => { setStatus(v); setPage(1); }}
                      options={[
                        { value: 'all', label: '전체' },
                        { value: 'pending', label: '대기중' },
                        { value: 'resolved', label: '처리완료' },
                      ]}
                    />
                  </FilterRow>
                  <FilterRow label="층">
                    <SegmentedControl
                      value={floor}
                      onChange={(v) => { setFloor(v); setPage(1); }}
                      options={[
                        { value: '', label: '전체' },
                        { value: '1', label: '1층' },
                        { value: '2', label: '2층' },
                        { value: '3', label: '야외' },
                      ]}
                    />
                  </FilterRow>
                </>
              )}
            />
          )}

          <CallList>
            {isLoading ? (
              <EmptyState>로딩 중...</EmptyState>
            ) : calls.length === 0 ? (
              <EmptyState>호출 내역이 없습니다</EmptyState>
            ) : (
              calls.map((c) => {
                const isResolving = resolvingId === c._id;
                const tableLabel = c.tableNumber
                  ? `${c.floor || 1}층 ${c.tableNumber}번`
                  : '-';
                const accent = getTableColor(c.tableId);
                const staffName = c.resolvedBy?.name || c.resolvedBy?.email;

                return (
                  <CallCard key={c._id}>
                    <AccentBar $color={accent} />
                    <CardBody>
                      <HeadTopRow>
                        <TableLabel>{tableLabel}</TableLabel>
                        <StatusBadge $status={c.status}>
                          {statusLabels[c.status] || c.status}
                        </StatusBadge>
                        <SoftDot />
                        <TimeText>{formatDateTime(c.createdAt)}</TimeText>
                      </HeadTopRow>
                      {Array.isArray(c.items) && c.items.length > 0 && (
                        <ItemsRow>
                          {c.items.map((it, i) => (
                            <ItemChip key={`${c._id}-${i}`}>{it}</ItemChip>
                          ))}
                        </ItemsRow>
                      )}
                      <FootRow>
                        <FootMeta>
                          {c.resolvedAt && (
                            <MetaChip>처리 {formatDateTime(c.resolvedAt)}</MetaChip>
                          )}
                          {c.resolvedAt && (
                            <ElapsedChip>소요 {elapsed(c.createdAt, c.resolvedAt)}</ElapsedChip>
                          )}
                          {staffName && (
                            <StaffChip>처리 · {staffName}</StaffChip>
                          )}
                          {!c.resolvedAt && c.status === 'pending' && (
                            <MetaChip>처리 대기중</MetaChip>
                          )}
                        </FootMeta>
                        <FootActions>
                          {c.status === 'pending' ? (
                            <ResolveBtn onClick={() => handleResolve(c)} disabled={isResolving}>
                              {isResolving ? '처리중...' : '처리완료'}
                            </ResolveBtn>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: 13 }}>—</span>
                          )}
                        </FootActions>
                      </FootRow>
                    </CardBody>
                  </CallCard>
                );
              })
            )}
          </CallList>

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
