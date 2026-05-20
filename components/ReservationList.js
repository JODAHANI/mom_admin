import { useMemo } from 'react';
import styled from 'styled-components';
import { formatPhone } from '../lib/phone';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Empty = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #8B95A1;
  font-size: 14px;
  background: white;
  border-radius: 16px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  color: #8B95A1;
  font-weight: 600;
  padding: 4px 4px;
  letter-spacing: 0.4px;
`;

const Card = styled.button`
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 16px;
  background: white;
  border: 1px solid transparent;
  border-radius: 16px;
  padding: 18px 20px;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.1s ease, box-shadow 0.1s ease, border-color 0.1s ease;
  position: relative;

  &:hover {
    border-color: #E5E8EB;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 480px) {
    grid-template-columns: 56px 1fr;
    padding: 14px 16px;
    gap: 12px;
  }
`;

const TimeCol = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1B1D1F;
  letter-spacing: -0.3px;
  padding-top: 1px;
  line-height: 1.2;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const TimeMissing = styled(TimeCol)`
  color: #C8CDD2;
  font-size: 13px;
  font-weight: 600;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const Row1 = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
`;

const Name = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #1B1D1F;
`;

const Phone = styled.span`
  font-size: 13px;
  color: #8B95A1;
`;

const Meta = styled.div`
  font-size: 13px;
  color: #4B5563;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

const MetaSep = styled.span`
  color: #C8CDD2;
`;

const MetaTotal = styled.span`
  color: #8B95A1;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
`;

const MenuChip = styled.span`
  background: #F4F5F7;
  color: #1B1D1F;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
`;

const NotesBox = styled.div`
  background: #FFF8E1;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: #8A6A1C;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 4px;
  line-height: 1.4;
`;

const NotesIcon = styled.span`
  font-size: 14px;
  line-height: 1.2;
  flex-shrink: 0;
`;

function ReservationCard({ reservation, onClick, showTime = true }) {
  const r = reservation;
  const adults = r.adults || 0;
  const children = r.children || 0;
  const totalPeople = adults + children;

  return (
    <Card onClick={onClick}>
      {showTime ? (
        r.reservationTime ? (
          <TimeCol>{r.reservationTime}</TimeCol>
        ) : (
          <TimeMissing>시간<br />미정</TimeMissing>
        )
      ) : (
        <TimeCol />
      )}
      <Body>
        <Row1>
          <Name>{r.customerName || '(이름 없음)'}</Name>
          {r.phone && <Phone>{formatPhone(r.phone)}</Phone>}
        </Row1>
        {totalPeople > 0 && (
          <Meta>
            {adults > 0 && <span>성인 {adults}</span>}
            {adults > 0 && children > 0 && <MetaSep>·</MetaSep>}
            {children > 0 && <span>어린이 {children}</span>}
            <MetaSep>·</MetaSep>
            <MetaTotal>총 {totalPeople}명</MetaTotal>
          </Meta>
        )}
        {r.items && r.items.length > 0 && (
          <ChipRow>
            {r.items.map((it, i) => (
              <MenuChip key={i}>
                {it.name} ×{it.quantity || 1}
              </MenuChip>
            ))}
          </ChipRow>
        )}
        {r.notes && (
          <NotesBox>
            <NotesIcon>🗨</NotesIcon>
            <span>{r.notes}</span>
          </NotesBox>
        )}
      </Body>
    </Card>
  );
}

export default function ReservationList({ reservations, onReservationClick, loading }) {
  const { timed, untimed } = useMemo(() => {
    const list = reservations || [];
    const timedList = list
      .filter((r) => !!r.reservationTime)
      .slice()
      .sort((a, b) => {
        if (a.reservationTime < b.reservationTime) return -1;
        if (a.reservationTime > b.reservationTime) return 1;
        return 0;
      });
    const untimedList = list.filter((r) => !r.reservationTime);
    return { timed: timedList, untimed: untimedList };
  }, [reservations]);

  if (loading) {
    return <Empty>불러오는 중…</Empty>;
  }

  if (!reservations || reservations.length === 0) {
    return <Empty>이 날짜에 예약이 없습니다</Empty>;
  }

  return (
    <Wrapper>
      {timed.length > 0 && (
        <Section>
          {timed.map((r) => (
            <ReservationCard
              key={r._id}
              reservation={r}
              onClick={() => onReservationClick(r)}
            />
          ))}
        </Section>
      )}

      {untimed.length > 0 && (
        <Section>
          <SectionLabel>시간 미정</SectionLabel>
          {untimed.map((r) => (
            <ReservationCard
              key={r._id}
              reservation={r}
              onClick={() => onReservationClick(r)}
            />
          ))}
        </Section>
      )}
    </Wrapper>
  );
}
