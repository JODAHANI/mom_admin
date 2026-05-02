import { useState } from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import OrderCard from '../components/OrderCard';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';

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

const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#E5E8EB')};
  border-radius: 24px;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #3182F6;
  }
`;

const OrderList = styled.div`
  max-width: 800px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #8b95a1;
  font-size: 15px;
`;

const statusTabs = [
  { label: '조리대기', value: 'pending' },
  { label: '조리시작', value: 'preparing' },
  { label: '조리완료', value: 'ready' },
  { label: '전달완료', value: 'served' },
  { label: '취소', value: 'cancelled' },
];

const DEFAULT_STATUSES = ['pending', 'preparing', 'ready'];

export default function OrdersPage() {
  const { loading } = useAuth();
  const [selectedStatuses, setSelectedStatuses] = useState(DEFAULT_STATUSES);
  const { data: orders = [], isLoading } = useOrders(selectedStatuses);

  const toggleStatus = (value) => {
    setSelectedStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const isAllSelected = selectedStatuses.length === 0;

  const ordersList = Array.isArray(orders) ? orders : orders?.data || [];

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="orders" />
      <MainArea>
        <Content>
          <Header title="주문 관리" />
          <TabsRow>
            <Tab
              $active={isAllSelected}
              onClick={() => setSelectedStatuses([])}
            >
              전체
            </Tab>
            {statusTabs.map((tab) => (
              <Tab
                key={tab.value}
                $active={selectedStatuses.includes(tab.value)}
                onClick={() => toggleStatus(tab.value)}
              >
                {tab.label}
              </Tab>
            ))}
          </TabsRow>
          {isLoading ? (
            <EmptyState>로딩 중...</EmptyState>
          ) : ordersList.length === 0 ? (
            <EmptyState>주문이 없습니다</EmptyState>
          ) : (
            <OrderList>
              {ordersList.map((order) => (
                <OrderCard key={order._id || order.id} order={order} />
              ))}
            </OrderList>
          )}
        </Content>
      </MainArea>
    </PageContainer>
  );
}
