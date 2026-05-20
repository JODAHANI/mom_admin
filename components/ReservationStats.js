import { useMemo } from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 14px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const StatBox = styled.div`
  background: #F4F5F7;
  border-radius: 12px;
  padding: 18px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #1B1D1F;
  line-height: 1.1;

  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #4B5563;
  font-weight: 500;
`;

const StatSub = styled.div`
  font-size: 12px;
  color: #8B95A1;
`;

export default function ReservationStats({ reservations }) {
  const stats = useMemo(() => {
    const list = reservations || [];
    const total = list.length;
    const adults = list.reduce((s, r) => s + (r.adults || 0), 0);
    const children = list.reduce((s, r) => s + (r.children || 0), 0);

    const menuMap = new Map();
    for (const r of list) {
      for (const it of r.items || []) {
        const key = it.name || '';
        if (!key) continue;
        menuMap.set(key, (menuMap.get(key) || 0) + (Number(it.quantity) || 1));
      }
    }
    const menuChips = Array.from(menuMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, qty]) => ({ name, qty }));
    const totalMenuQty = menuChips.reduce((s, c) => s + c.qty, 0);

    return { total, adults, children, totalMenuQty, menuChips };
  }, [reservations]);

  const peopleTotal = stats.adults + stats.children;

  return (
    <Card>
      <StatGrid>
        <StatBox>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>예약</StatLabel>
        </StatBox>
        <StatBox>
          <StatValue>{peopleTotal}</StatValue>
          {(stats.adults > 0 || stats.children > 0) ? (
            <StatSub>성인 {stats.adults} · 아이 {stats.children}</StatSub>
          ) : (
            <StatLabel>인원</StatLabel>
          )}
        </StatBox>
        <StatBox>
          <StatValue>{stats.totalMenuQty}</StatValue>
          <StatLabel>총 메뉴</StatLabel>
        </StatBox>
      </StatGrid>
    </Card>
  );
}
