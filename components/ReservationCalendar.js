import { useMemo, useRef, useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function makeKey(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

const slideInFromRight = keyframes`
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const slideInFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const Wrapper = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  touch-action: pan-y;

  @media (max-width: 480px) {
    padding: 14px;
  }
`;

const Nav = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  position: relative;
`;

const NavBtn = styled.button`
  width: 36px;
  height: 36px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: white;
  font-size: 18px;
  color: #191f28;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: #3182F6; color: #3182F6; }
`;

const MonthLabel = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
  min-width: 140px;
  text-align: center;
`;

const TodayBtn = styled.button`
  position: absolute;
  right: 0;
  padding: 8px 14px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: #3182F6; color: #3182F6; }

  @media (max-width: 480px) {
    position: static;
  }
`;

const GridOuter = styled.div`
  overflow: hidden;
`;

const DragLayer = styled.div`
  transform: translateX(${p => p.$dragX}px);
  transition: ${p => p.$springing
    ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
    : 'none'};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  animation-name: ${p => p.$dir === 'left' ? slideInFromRight : slideInFromLeft};
  animation-duration: 0.25s;
  animation-timing-function: ease-out;
`;

const Weekday = styled.div`
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => (p.$sun ? '#F44336' : p.$sat ? '#3182F6' : '#8b95a1')};
`;

const DayCell = styled.button`
  position: relative;
  min-height: 88px;
  padding: 8px;
  border: 1px solid ${(p) => (p.$isMax ? '#3182F6' : '#e5e8eb')};
  border-radius: 8px;
  background: ${(p) => {
    if (p.$empty) return '#f8f9fa';
    if (p.$isMax) return '#E8F2FF';
    return 'white';
  }};
  text-align: left;
  cursor: ${(p) => (p.$empty ? 'default' : 'pointer')};
  display: flex;
  flex-direction: column;
  font-family: inherit;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: #3182F6;
    filter: brightness(0.98);
  }

  @media (max-width: 768px) {
    min-height: 72px;
    padding: 6px;
  }

  @media (max-width: 480px) {
    min-height: 60px;
    padding: 4px;
  }
`;

const TodayBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  background: #4CAF50;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  line-height: 1.2;

  @media (max-width: 480px) {
    top: 4px;
    right: 4px;
    padding: 0;
    width: 6px;
    height: 6px;
    font-size: 0;
  }
`;

const DayNum = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => {
    if (p.$isMax) return '#3182F6';
    if (p.$sun) return '#F44336';
    if (p.$sat) return '#3182F6';
    return '#191f28';
  }};
  margin-bottom: 4px;
`;

const CountText = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => (p.$isMax ? '#3182F6' : '#191f28')};
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const Loading = styled.div`
  padding: 40px;
  text-align: center;
  color: #8b95a1;
`;

export default function ReservationCalendar({
  year,
  month,
  data,
  todayKey,
  loading,
  onPrev,
  onNext,
  onToday,
  onDayClick,
}) {
  const firstDayWeekday = new Date(year, month - 1, 1).getDay();
  const lastDate = new Date(year, month, 0).getDate();
  const byDay = data?.byDay || {};

  const maxKey = useMemo(() => {
    let bestKey = null;
    let bestCount = 0;
    for (const [k, v] of Object.entries(byDay)) {
      if ((v.count || 0) > bestCount) {
        bestCount = v.count;
        bestKey = k;
      }
    }
    return bestKey;
  }, [byDay]);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const dirRef = useRef('left');
  const isFirstRender = useRef(true);

  const [dragX, setDragX] = useState(0);
  const [springing, setSpringing] = useState(false);
  const [anim, setAnim] = useState({ key: 0, dir: 'left' });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setAnim(prev => ({ key: prev.key + 1, dir: dirRef.current }));
  }, [year, month]);

  const goNext = () => {
    dirRef.current = 'left';
    onNext?.();
  };

  const goPrev = () => {
    dirRef.current = 'right';
    onPrev?.();
  };

  const goToday = () => {
    const now = new Date();
    const currentTotal = year * 12 + month;
    const todayTotal = now.getFullYear() * 12 + now.getMonth() + 1;
    dirRef.current = todayTotal >= currentTotal ? 'left' : 'right';
    onToday?.();
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null || loading) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx)) {
      touchStartX.current = null;
      setDragX(0);
      return;
    }
    setSpringing(false);
    setDragX(dx * 0.55);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || loading) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (Math.abs(diff) > 60) {
      setDragX(0);
      if (diff > 0) goNext();
      else goPrev();
    } else {
      setSpringing(true);
      setDragX(0);
      setTimeout(() => setSpringing(false), 350);
    }
    touchStartX.current = null;
  };

  const cells = [];
  for (let i = 0; i < firstDayWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);

  return (
    <Wrapper onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <Nav>
        <NavBtn onClick={goPrev} aria-label="이전 달">‹</NavBtn>
        <MonthLabel>{year}년 {month}월</MonthLabel>
        <NavBtn onClick={goNext} aria-label="다음 달">›</NavBtn>
        <TodayBtn onClick={goToday}>오늘</TodayBtn>
      </Nav>

      {loading ? (
        <Loading>불러오는 중...</Loading>
      ) : (
        <GridOuter>
          <DragLayer $dragX={dragX} $springing={springing}>
            <Grid key={anim.key} $dir={anim.dir}>
              {WEEKDAYS.map((w, i) => (
                <Weekday key={w} $sun={i === 0} $sat={i === 6}>{w}</Weekday>
              ))}
              {cells.map((d, idx) => {
                if (d === null) {
                  return <DayCell key={`empty-${idx}`} $empty disabled />;
                }
                const key = makeKey(year, month, d);
                const info = byDay[key] || { count: 0, people: 0 };
                const weekday = (firstDayWeekday + d - 1) % 7;
                const isMax = key === maxKey && info.count > 0;
                const isToday = key === todayKey;
                return (
                  <DayCell
                    key={key}
                    $isMax={isMax}
                    onClick={() => onDayClick && onDayClick(key)}
                  >
                    {isToday && <TodayBadge>Today</TodayBadge>}
                    <DayNum
                      $sun={weekday === 0}
                      $sat={weekday === 6}
                      $isMax={isMax}
                    >
                      {d}
                    </DayNum>
                    {info.count > 0 && (
                      <CountText $isMax={isMax}>{info.count}건</CountText>
                    )}
                  </DayCell>
                );
              })}
            </Grid>
          </DragLayer>
        </GridOuter>
      )}
    </Wrapper>
  );
}
