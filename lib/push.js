import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import api from './api';

let initialized = false;
let backendRegistered = false;
let routerRef = null;

function isNative() {
  try {
    return Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

export async function initPush(router) {
  if (!isNative()) return;
  routerRef = router;
  if (initialized) return;
  initialized = true;

  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') {
      console.warn('[push] 푸시 권한 거부됨 — 백그라운드 알림 비활성화');
      return;
    }
    try {
      await LocalNotifications.requestPermissions();
    } catch {}

    await PushNotifications.removeAllListeners();
    await LocalNotifications.removeAllListeners();

    PushNotifications.addListener('registration', async (token) => {
      try {
        localStorage.setItem('fcmToken', token.value);
        await maybeRegisterToken();
      } catch (e) {
        console.error('[push] registration handler error:', e);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', async (push) => {
      const data = push?.data || {};
      try {
        const { isActive } = await App.getState();
        if (isActive) return; // 포그라운드 — WebSocket Toast가 이미 처리
      } catch {}

      const { title, body } = formatNotification(data);
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() % 2147483647),
              title,
              body,
              extra: data,
            },
          ],
        });
      } catch (e) {
        console.error('[push] local notification 표시 실패:', e);
      }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action?.notification?.data || {};
      routeByPushData(data);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const data = action?.notification?.extra || {};
      routeByPushData(data);
    });

    await PushNotifications.register();
  } catch (e) {
    console.error('[push] init 실패:', e);
  }
}

function formatNotification(data) {
  switch (data?.type) {
    case 'NEW_ORDER':
      return {
        title: '새 주문',
        body: `테이블 ${data.tableNumber || ''}${
          data.itemCount ? ` · ${data.itemCount}건` : ''
        }`,
      };
    case 'STAFF_CALL': {
      const items = data.callItems ? ` · ${data.callItems}` : '';
      return {
        title: '직원 호출',
        body: `테이블 ${data.tableNumber || ''}${items}`,
      };
    }
    default:
      return { title: '알림', body: '' };
  }
}

function routeByPushData(data) {
  if (!routerRef || !data?.type) return;
  if (data.type === 'NEW_ORDER') {
    routerRef.push('/orders');
  } else if (data.type === 'STAFF_CALL') {
    routerRef.push('/tables');
  }
}

export async function maybeRegisterToken() {
  if (!isNative() || backendRegistered) return;
  if (typeof window === 'undefined') return;

  const fcmToken = localStorage.getItem('fcmToken');
  const authToken = localStorage.getItem('token');
  if (!fcmToken || !authToken) return;

  try {
    await api.post('/devices', { fcmToken, deviceType: 'android' });
    backendRegistered = true;
  } catch (err) {
    console.error('[push] 백엔드 토큰 등록 실패:', err?.message || err);
  }
}

export async function unregisterToken() {
  if (!isNative()) return;
  if (typeof window === 'undefined') return;

  const fcmToken = localStorage.getItem('fcmToken');
  if (!fcmToken) {
    backendRegistered = false;
    return;
  }
  try {
    await api.delete(`/devices/${encodeURIComponent(fcmToken)}`);
  } catch (err) {
    // 401 등은 무시 (서버에 등록 안 됐을 수 있음)
  }
  backendRegistered = false;
}
