import { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAtom } from 'jotai';
import { notificationsAtom, sidebarOpenAtom, sidebarCollapsedAtom } from '../store/atoms';
import { useResolveStaffCall } from '../hooks/useStaffCalls';
import { useToast } from './Toast';

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const HamburgerBtn = styled.button`
  width: 36px;
  height: 56px;
  padding: 0;
  border: none;
  border-radius: 0 18px 18px 0;
  background: #f2f3f5;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: -24px;
  position: relative;
  transition: background 0.15s ease, padding 0.15s ease;

  &:hover {
    background: #e5e8eb;
    padding-left: 4px;
  }

  &:active {
    background: #d1d5da;
  }

  @media (min-width: 769px) {
    display: ${(p) => (p.$sidebarCollapsed ? 'inline-flex' : 'none')};
  }

  @media (max-width: 768px) {
    display: ${(p) => (p.$sidebarOpen ? 'none' : 'inline-flex')};
  }
`;

const HamburgerHandle = styled.span`
  width: 4px;
  height: 28px;
  background: #8b95a1;
  border-radius: 2px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1b1d1f;
  margin: 0;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  user-select: none;

  &:active {
    opacity: 0.7;
  }
`;

const BellWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const BellButton = styled.button`
  width: 40px;
  height: 40px;
  border: 1px solid #e5e8eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 20px;
  color: #1b1d1f;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;
  transition: background 0.15s ease, transform 0.1s ease;

  &:hover {
    background: #f8f9fb;
  }

  &:active {
    transform: scale(0.96);
  }
`;

const Badge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff3b30;
  color: white;
  font-size: 11px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 2px solid white;
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
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

export default function Header({ title }) {
  const [notifications, setNotifications] = useAtom(notificationsAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const [open, setOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const dropdownRef = useRef(null);
  const resolveCall = useResolveStaffCall();
  const showToast = useToast();

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

  const handleNotiClick = (noti) => {
    if (noti.type === 'staffCall' && noti.callId) {
      if (resolvingId) return;
      setResolvingId(noti.id);
      resolveCall.mutate(noti.callId, {
        onSuccess: () => {
          showToast('호출 처리 완료', 'success');
          setNotifications((prev) => prev.filter((n) => n.id !== noti.id));
        },
        onError: (err) => {
          const msg = err?.response?.data?.message || '처리에 실패했습니다';
          showToast(msg, 'error');
        },
        onSettled: () => setResolvingId(null),
      });
      return;
    }
    handleDismiss(noti.id);
  };

  const openSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(false);
    }
  };

  return (
    <Bar>
      <HamburgerBtn
        $sidebarOpen={sidebarOpen}
        $sidebarCollapsed={sidebarCollapsed}
        onClick={openSidebar}
        aria-label="네비게이션 열기"
      >
        <HamburgerHandle />
      </HamburgerBtn>
      <Title onClick={openSidebar}>{title}</Title>
      <BellWrapper ref={dropdownRef}>
        <BellButton onClick={() => setOpen(!open)} aria-label="알림">
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
                [...notifications].reverse().map((noti) => {
                  const isResolving = resolvingId === noti.id;
                  const isCall = noti.type === 'staffCall' && !!noti.callId;
                  return (
                    <NotificationItem
                      key={noti.id}
                      onClick={() => handleNotiClick(noti)}
                      style={isResolving ? { opacity: 0.6, cursor: 'wait' } : undefined}
                    >
                      <NotiIcon $type={noti.type}>
                        {noti.type === 'staffCall' ? '🙋' : '🧾'}
                      </NotiIcon>
                      <NotiContent>
                        <NotiMessage>
                          {noti.message}
                          {isCall && !isResolving && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#3182F6', fontWeight: 700 }}>
                              · 터치하여 처리
                            </span>
                          )}
                          {isResolving && (
                            <span style={{ marginLeft: 8, fontSize: 12, color: '#8b95a1' }}>
                              · 처리중…
                            </span>
                          )}
                        </NotiMessage>
                        <NotiTime>{formatTime(noti.time)}</NotiTime>
                      </NotiContent>
                    </NotificationItem>
                  );
                })
              )}
            </NotificationList>
          </Dropdown>
        )}
      </BellWrapper>
    </Bar>
  );
}
