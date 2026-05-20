import { useMemo } from 'react';
import styled from 'styled-components';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function makeKey(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

const Wrapper = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;

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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
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

  const cells = [];
  for (let i = 0; i < firstDayWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);

  return (
    <Wrapper>
      <Nav>
        <NavBtn onClick={onPrev} aria-label="이전 달">‹</NavBtn>
        <MonthLabel>{year}년 {month}월</MonthLabel>
        <NavBtn onClick={onNext} aria-label="다음 달">›</NavBtn>
        <TodayBtn onClick={onToday}>오늘</TodayBtn>
      </Nav>

      {loading ? (
        <Loading>불러오는 중...</Loading>
      ) : (
        <Grid>
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
      )}
    </Wrapper>
  );
}
