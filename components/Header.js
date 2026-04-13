import { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAtom, useAtomValue } from 'jotai';
import { kioskModeAtom, notificationsAtom, sidebarOpenAtom } from '../store/atoms';
import Toggle from './Toggle';

const HeaderBar = styled.header`
  height: 60px;
  background: white;
  border-bottom: 1px solid #e5e8eb;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 240px;
  right: 0;
  z-index: 100;

  @media (max-width: 768px) {
    left: 0;
    padding: 0 12px;
  }
`;

const Left = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1b1d1f;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HamburgerBtn = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  font-size: 22px;
  color: #1b1d1f;
  line-height: 1;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const TitleText = styled.span`
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const Center = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 480px) {
    display: none;
  }
`;

const KioskLabel = styled.span`
  font-size: 14px;
  color: #8b95a1;
`;

const Right = styled.div`
  position: relative;
`;

const BellButton = styled.div`
  font-size: 22px;
  position: relative;
  cursor: pointer;
  user-select: none;

  &:active {
    transform: scale(0.9);
  }
`;

const Badge = styled.div`
  position: absolute;
  top: -4px;
  right: -6px;
  background: #ff3b30;
  color: white;
  font-size: 11px;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 36px;
  right: 0;
  width: 360px;
  max-height: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e5e8eb;
  overflow: hidden;
  animation: ${slideDown} 0.15s ease;
  z-index: 200;

  @media (max-width: 480px) {
    width: calc(100vw - 24px);
    right: -12px;
  }
`;

const DropdownHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e8eb;
`;

const DropdownTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #1b1d1f;
`;

const ClearButton = styled.button`
  font-size: 13px;
  color: #8b95a1;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: #3182f6;
  }
`;

const NotificationList = styled.div`
  overflow-y: auto;
  max-height: 420px;
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
  transition: background 0.1s;

  &:hover {
    background: #f8f9fa;
  }
`;

const NotiIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: ${(p) => (p.$type === 'staffCall' ? '#FFF3E0' : '#E8F0FE')};
`;

const NotiContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotiMessage = styled.div`
  font-size: 14px;
  color: #1b1d1f;
  line-height: 1.4;
`;

const NotiTime = styled.div`
  font-size: 12px;
  color: #8b95a1;
  margin-top: 2px;
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #8b95a1;
  font-size: 14px;
`;

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Header() {
  const [kioskMode, setKioskMode] = useAtom(kioskModeAtom);
  const [notifications, setNotifications] = useAtom(notificationsAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleClear = () => {
    setNotifications([]);
    setOpen(false);
  };

  const handleDismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <HeaderBar>
      <Left>
        <HamburgerBtn onClick={() => setSidebarOpen(!sidebarOpen)}>
          &#9776;
        </HamburgerBtn>
        <TitleText>테이블 홈</TitleText>
      </Left>
      <Center>
        <KioskLabel>키오스크 모드</KioskLabel>
        <Toggle checked={kioskMode} onChange={setKioskMode} size="sm" />
      </Center>
      <Right ref={dropdownRef}>
        <BellButton onClick={() => setOpen(!open)}>
          🔔
          {notifications.length > 0 && (
            <Badge>{notifications.length > 99 ? '99+' : notifications.length}</Badge>
          )}
        </BellButton>
        {open && (
          <Dropdown>
            <DropdownHeader>
              <DropdownTitle>알림 ({notifications.length})</DropdownTitle>
              {notifications.length > 0 && (
                <ClearButton onClick={handleClear}>모두 지우기</ClearButton>
              )}
            </DropdownHeader>
            <NotificationList>
              {notifications.length === 0 ? (
                <EmptyState>알림이 없습니다</EmptyState>
              ) : (
                [...notifications].reverse().map((noti) => (
                  <NotificationItem key={noti.id} onClick={() => handleDismiss(noti.id)}>
                    <NotiIcon $type={noti.type}>
                      {noti.type === 'staffCall' ? '🙋' : '🧾'}
                    </NotiIcon>
                    <NotiContent>
                      <NotiMessage>{noti.message}</NotiMessage>
                      <NotiTime>{formatTime(noti.time)}</NotiTime>
                    </NotiContent>
                  </NotificationItem>
                ))
              )}
            </NotificationList>
          </Dropdown>
        )}
      </Right>
    </HeaderBar>
  );
}
