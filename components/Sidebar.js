import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';

const SidebarContainer = styled.aside`
  width: 240px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #1b1d1f;
  padding-top: 60px;
  z-index: 101;
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: white;
`;

const MenuSection = styled.div`
  flex: 1;
`;

const MenuItem = styled.div`
  padding: 12px 20px;
  color: ${(p) => (p.$active ? 'white' : '#8B95A1')};
  cursor: pointer;
  border-left: 3px solid ${(p) => (p.$active ? '#3182F6' : 'transparent')};
  background: ${(p) => (p.$active ? 'rgba(255,255,255,0.05)' : 'transparent')};
  font-size: 15px;
  transition: color 0.15s;

  &:hover {
    color: white;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #333;
  margin: 8px 20px;
`;

const LowerItem = styled.div`
  padding: 10px 20px;
  color: #8b95a1;
  cursor: pointer;
  font-size: 13px;
  transition: color 0.15s;

  &:hover {
    color: white;
  }
`;

const menuItems = [
  { label: '상품', key: 'products', href: '/products' },
  { label: '주문', key: 'orders', href: '/orders' },
  { label: '주문내역', key: 'order-history', href: '/order-history' },
  { label: '테이블 현황', key: 'tables', href: '/tables' },
  { label: '카테고리', key: 'categories', href: '/categories' },
  { label: '공지사항', key: 'notices', href: '/notices' },
];

const lowerItems = ['상품 편집', '상품 한번에 등록', '의견 보내기'];

export default function Sidebar({ active = 'products' }) {
  const router = useRouter();
  const { logout } = useAuth({ redirectIfUnauthenticated: false });
  const showToast = useToast();

  const handleLogout = () => {
    showToast('로그아웃 되었습니다', 'auth', { position: 'center-bottom' });
    logout();
  };

  return (
    <SidebarContainer>
      <Logo>테이블 홈</Logo>
      <MenuSection>
        {menuItems.map((item) => (
          <MenuItem
            key={item.key}
            $active={active === item.key}
            onClick={() => router.push(item.href)}
          >
            {item.label}
          </MenuItem>
        ))}
      </MenuSection>
      <Divider />
      <LowerItem onClick={handleLogout}>로그아웃</LowerItem>
      <div style={{ height: 20 }} />
    </SidebarContainer>
  );
}
