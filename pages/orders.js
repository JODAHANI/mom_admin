import { useState } from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import OrderCard from '../components/OrderCard';
import { useOrders, useWebSocketOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainArea = styled.div`
  margin-left: 240px;
  padding-top: 60px;
  flex: 1;
`;

const Content = styled.div`
  padding: 24px;
`;

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1b1d1f;
`;

const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 8px 16px;
  border: 1px solid ${(p) => (p.$active ? '#3182F6' : '#E5E8EB')};
  border-radius: 20px;
  background: ${(p) => (p.$active ? '#3182F6' : 'white')};
  color: ${(p) => (p.$active ? 'white' : '#333')};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: #3182f6;
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
  { label: '미완료', value: 'incomplete' },
  { label: '대기중', value: 'pending' },
  { label: '준비중', value: 'preparing' },
  { label: '준비완료', value: 'ready' },
  { label: '서빙완료', value: 'served' },
];

export default function OrdersPage() {
  const { loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState('incomplete');
  const { data: orders = [], isLoading } = useOrders(statusFilter);

  useWebSocketOrders();

  const ordersList = Array.isArray(orders) ? orders : orders?.data || [];

  if (loading) return null;

  return (
    <PageContainer>
      <Sidebar active="orders" />
      <MainArea>
        <Header />
        <Content>
          <PageTitle>주문 관리</PageTitle>
          <TabsRow>
            {statusTabs.map((tab) => (
              <Tab
                key={tab.value}
                $active={statusFilter === tab.value}
                onClick={() => setStatusFilter(tab.value)}
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
