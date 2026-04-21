import { createContext, useContext, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const ToastContext = createContext();

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; transform: translateY(-10px); }
`;

const Container = styled.div`
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
  ${(p) => p.$position === 'center-bottom'
    ? 'bottom: 40px; left: 50%; transform: translateX(-50%);'
    : 'top: 24px; right: 24px;'}
`;

const ToastItem = styled.div`
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  animation: ${(p) => (p.$removing ? fadeOut : slideUp)} 0.25s ease forwards;
  cursor: pointer;
  background: ${(p) =>
    p.$type === 'success' ? '#1B1D1F' :
    p.$type === 'error' ? '#FF3B30' :
    p.$type === 'staffCall' ? '#FF9500' :
    p.$type === 'order' ? '#3182F6' :
    p.$type === 'auth' ? '#4CAF50' :
    '#1B1D1F'};
  color: white;
  transition: transform 0.1s;

  &:hover {
    ${(p) => p.$clickable && 'transform: scale(1.02);'}
  }
`;

const ToastSub = styled.div`
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
`;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', { duration = 4000, onClick, sub, position } = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, onClick, sub, position, removing: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    }, duration);
  }, []);

  const handleClick = (toast) => {
    if (toast.onClick) toast.onClick();
    setToasts((prev) =>
      prev.map((t) => (t.id === toast.id ? { ...t, removing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 250);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toasts.filter((t) => t.position !== 'center-bottom').length > 0 && (
        <Container>
          {toasts.filter((t) => t.position !== 'center-bottom').map((t) => (
            <ToastItem
              key={t.id}
              $type={t.type}
              $removing={t.removing}
              $clickable={!!t.onClick}
              onClick={() => handleClick(t)}
            >
              {t.message}
              {t.sub && <ToastSub>{t.sub}</ToastSub>}
            </ToastItem>
          ))}
        </Container>
      )}
      {toasts.filter((t) => t.position === 'center-bottom').length > 0 && (
        <Container $position="center-bottom">
          {toasts.filter((t) => t.position === 'center-bottom').map((t) => (
            <ToastItem
              key={t.id}
              $type={t.type}
              $removing={t.removing}
              $clickable={!!t.onClick}
              onClick={() => handleClick(t)}
            >
              {t.message}
              {t.sub && <ToastSub>{t.sub}</ToastSub>}
            </ToastItem>
          ))}
        </Container>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
