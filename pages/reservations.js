import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAtomValue } from 'jotai';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ReservationForm from '../components/ReservationForm';
import ReservationList from '../components/ReservationList';
import ReservationStats from '../components/ReservationStats';
import ReservationCalendar from '../components/ReservationCalendar';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { simpleViewAtom } from '../store/atoms';
import {
  useReservations,
  useReservationsByMonth,
  useCreateReservation,
  useUpdateReservation,
  useDeleteReservation,
} from '../hooks/useReservations';

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

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
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
  font-family: inherit;
  transition: all 0.15s;

  & + & {
    border-left: 1px solid #e5e8eb;
  }

  &:hover:not(:disabled) {
    background: ${(p) => (p.$active ? '#3182F6' : '#f8f9fa')};
  }
`;

const PrimaryBtn = styled.button`
  padding: 10px 18px;
  background: #1B1D1F;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover { background: #2F3133; }
`;

const DateCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 14px;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 8px;

  @media (max-width: 480px) {
    padding: 14px 14px;
  }
`;

const NavBtn = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: transparent;
  font-size: 22px;
  color: #4B5563;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.15s ease;

  &:hover { background: #F4F5F7; color: #1B1D1F; }
`;

const DateCenter = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.15s ease;

  &:hover { background: #F8F9FB; }
`;

const DateText = styled.span`
  font-size: 17px;
  font-weight: 700;
  color: #1B1D1F;

  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const Weekday = styled.span`
  color: ${(p) => (p.$sun ? '#F44336' : p.$sat ? '#3182F6' : '#1B1D1F')};
`;

const TodayChip = styled.span`
  background: #1B1D1F;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.3px;
`;

const TodayBtn = styled.button`
  background: white;
  border: 1px solid #E5E8EB;
  color: #4B5563;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;

  &:hover { border-color: #1B1D1F; color: #1B1D1F; }
`;

const HiddenDateInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
`;

const MenuPrepCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 14px 18px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    padding: 12px 14px;
    gap: 10px;
  }
`;

const MenuPrepLabel = styled.div`
  font-size: 13px;
  color: #4B5563;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  strong {
    color: #1B1D1F;
    font-weight: 800;
    font-size: 15px;
  }
`;

const MenuPrepChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;

const MenuPrepChip = styled.span`
  background: #1B1D1F;
  color: white;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  span {
    font-weight: 800;
  }
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
`;

const ConfirmModal = styled.div`
  background: white;
  border-radius: 16px;
  width: 400px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ConfirmHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #E5E8EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ConfirmTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
`;

const ConfirmCloseBtn = styled.button`
  font-size: 32px;
  line-height: 1;
  color: #8b95a1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 10px;

  &:hover { color: #191f28; }
`;

const ConfirmBody = styled.div`
  padding: 24px;
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
`;

const ConfirmFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #E5E8EB;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
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
  font-family: inherit;

  &:hover { background: #F5F6F8; }
  &:disabled { cursor: not-allowed; opacity: 0.6; }
`;

const DeleteConfirmBtn = styled.button`
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 10px;
  background: #F44336;
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;

  &:hover { background: #D32F2F; }
  &:disabled { background: #ccc; cursor: not-allowed; }
`;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n) { return String(n).padStart(2, '0'); }

function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayYmd() {
  return ymd(new Date());
}

function shiftDate(dateStr, deltaDays) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + deltaDays);
  return ymd(d);
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const yearPart = sameYear ? '' : `${d.getFullYear()}년 `;
  return {
    text: `${yearPart}${d.getMonth() + 1}월 ${d.getDate()}일`,
    weekday: WEEKDAYS[d.getDay()],
    wIdx: d.getDay(),
  };
}

export default function Reservations() {
  const { isLoading: authLoading } = useAuth({ redirectIfUnauthenticated: true });
  const showToast = useToast();
  const simpleView = useAtomValue(simpleViewAtom);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(todayYmd());
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [defaultTime, setDefaultTime] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const dateInputRef = useRef(null);

  const { data: reservations, isLoading } = useReservations(
    { date: selectedDate },
    { enabled: viewMode === 'list' },
  );
  const { data: allReservations, isLoading: allLoading } = useReservations(
    {},
    { enabled: viewMode === 'all' },
  );
  const { data: monthly, isLoading: monthlyLoading } = useReservationsByMonth(
    calMonth.year,
    calMonth.month,
    { enabled: viewMode === 'calendar' },
  );

  const sortedAllReservations = useMemo(() => {
    if (!allReservations) return allReservations;
    return [...allReservations].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    });
  }, [allReservations]);

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
  const goCalToday = () => {
    const d = new Date();
    setCalMonth({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };
  const handleCalDayClick = (dateKey) => {
    setSelectedDate(dateKey);
    setViewMode('list');
  };
  const createMutation = useCreateReservation();
  const updateMutation = useUpdateReservation();
  const deleteMutation = useDeleteReservation();

  const handleOpenNew = () => {
    setEditing(null);
    setDefaultTime(null);
    setModalOpen(true);
  };

  const handleEdit = (reservation) => {
    setEditing(reservation);
    setDefaultTime(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditing(null);
    setDefaultTime(null);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing._id, ...payload });
        showToast('예약이 수정되었습니다', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('예약이 추가되었습니다', 'success');
      }
      handleClose();
    } catch (e) {
      showToast(e?.response?.data?.message || '저장 실패', 'error');
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    setConfirmDelete(editing);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete._id);
      showToast('예약이 삭제되었습니다', 'success');
      setConfirmDelete(null);
      handleClose();
    } catch (e) {
      showToast('삭제 실패', 'error');
    }
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return; } catch (_) {}
    }
    el.focus();
    el.click();
  };

  if (authLoading) return null;

  const isToday = selectedDate === todayYmd();
  const label = formatDateLabel(selectedDate);

  const menuPrep = (() => {
    const map = new Map();
    for (const r of reservations || []) {
      for (const it of r.items || []) {
        const name = it.name || '';
        if (!name) continue;
        map.set(name, (map.get(name) || 0) + (Number(it.quantity) || 1));
      }
    }
    const chips = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, qty]) => ({ name, qty }));
    const total = chips.reduce((s, c) => s + c.qty, 0);
    return { chips, total };
  })();

  return (
    <PageContainer>
      <Sidebar active="reservations" />
      <MainArea>
        <Content>
          <Header title="예약 관리" />
          <ActionRow>
            <ViewToggle>
              <ViewBtn $active={viewMode === 'all'} onClick={() => setViewMode('all')}>
                전체
              </ViewBtn>
              <ViewBtn $active={viewMode === 'list'} onClick={() => setViewMode('list')}>
                일정
              </ViewBtn>
              <ViewBtn $active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')}>
                달력
              </ViewBtn>
            </ViewToggle>
            <PrimaryBtn onClick={handleOpenNew}>+ 새 예약</PrimaryBtn>
          </ActionRow>

          {viewMode === 'all' && (
            <ReservationList
              reservations={sortedAllReservations}
              loading={allLoading}
              onReservationClick={handleEdit}
              showDate
            />
          )}

          {viewMode === 'calendar' && (
            <ReservationCalendar
              year={calMonth.year}
              month={calMonth.month}
              data={monthly}
              todayKey={todayYmd()}
              loading={monthlyLoading}
              onPrev={goPrevMonth}
              onNext={goNextMonth}
              onToday={goCalToday}
              onDayClick={handleCalDayClick}
            />
          )}

          {viewMode === 'list' && (
          <>
          <DateCard>
            <NavBtn
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              aria-label="이전 날짜"
            >
              ‹
            </NavBtn>
            <DateCenter onClick={openDatePicker} aria-label="날짜 선택">
              <DateText>
                {label.text}{' '}
                <Weekday $sun={label.wIdx === 0} $sat={label.wIdx === 6}>
                  {label.weekday}요일
                </Weekday>
              </DateText>
              {isToday ? (
                <TodayChip>오늘</TodayChip>
              ) : (
                <TodayBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(todayYmd());
                  }}
                >
                  오늘로
                </TodayBtn>
              )}
            </DateCenter>
            <NavBtn
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              aria-label="다음 날짜"
            >
              ›
            </NavBtn>
            <HiddenDateInput
              type="date"
              ref={dateInputRef}
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            />
          </DateCard>

          {menuPrep.chips.length > 0 && (
            <MenuPrepCard>
              <MenuPrepLabel>
                오늘 준비할 메뉴 <strong>{menuPrep.total}개</strong>
              </MenuPrepLabel>
              <MenuPrepChips>
                {menuPrep.chips.map((c) => (
                  <MenuPrepChip key={c.name}>
                    {c.name} <span>{c.qty}</span>
                  </MenuPrepChip>
                ))}
              </MenuPrepChips>
            </MenuPrepCard>
          )}

          {!simpleView && (reservations || []).length > 0 && (
            <ReservationStats reservations={reservations || []} />
          )}

          <ReservationList
            reservations={reservations}
            loading={isLoading}
            onReservationClick={handleEdit}
          />
          </>
          )}
        </Content>
      </MainArea>

      <ReservationForm
        open={modalOpen}
        onClose={handleClose}
        initial={editing}
        defaultDate={selectedDate}
        defaultTime={defaultTime}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : null}
        submitting={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
      />

      {confirmDelete && (
        <ConfirmOverlay
          onClick={() => !deleteMutation.isPending && setConfirmDelete(null)}
        >
          <ConfirmModal onClick={(e) => e.stopPropagation()}>
            <ConfirmHeader>
              <ConfirmTitle>예약 삭제</ConfirmTitle>
              <ConfirmCloseBtn
                onClick={() => !deleteMutation.isPending && setConfirmDelete(null)}
              >
                &times;
              </ConfirmCloseBtn>
            </ConfirmHeader>
            <ConfirmBody>
              <ConfirmQuestion>
                {confirmDelete.customerName
                  ? `"${confirmDelete.customerName}" 님의 예약을 삭제할까요?`
                  : '이 예약을 삭제할까요?'}
              </ConfirmQuestion>
              <ConfirmHint>삭제 후 되돌릴 수 없습니다</ConfirmHint>
            </ConfirmBody>
            <ConfirmFooter>
              <CancelConfirmBtn
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending}
              >
                취소
              </CancelConfirmBtn>
              <DeleteConfirmBtn
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? '삭제 중...' : '삭제'}
              </DeleteConfirmBtn>
            </ConfirmFooter>
          </ConfirmModal>
        </ConfirmOverlay>
      )}
    </PageContainer>
  );
}
