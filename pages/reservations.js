import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAtomValue } from 'jotai';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ReservationForm from '../components/ReservationForm';
import ReservationList from '../components/ReservationList';
import ReservationStats from '../components/ReservationStats';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { simpleViewAtom } from '../store/atoms';
import {
  useReservations,
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
  justify-content: flex-end;
  margin-bottom: 14px;
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
  const [selectedDate, setSelectedDate] = useState(todayYmd());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [defaultTime, setDefaultTime] = useState(null);
  const dateInputRef = useRef(null);

  const { data: reservations, isLoading } = useReservations({ date: selectedDate });
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

  const handleDelete = async () => {
    if (!editing) return;
    if (!window.confirm('이 예약을 삭제할까요?')) return;
    try {
      await deleteMutation.mutateAsync(editing._id);
      showToast('예약이 삭제되었습니다', 'success');
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

  return (
    <PageContainer>
      <Sidebar active="reservations" />
      <MainArea>
        <Content>
          <Header title="예약 관리" />
          <ActionRow>
            <PrimaryBtn onClick={handleOpenNew}>+ 새 예약</PrimaryBtn>
          </ActionRow>

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

          {!simpleView && (
            <ReservationStats reservations={reservations || []} />
          )}

          <ReservationList
            reservations={reservations}
            loading={isLoading}
            onReservationClick={handleEdit}
          />
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
    </PageContainer>
  );
}
