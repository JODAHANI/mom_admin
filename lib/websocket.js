function isCapacitorNative() {
  if (typeof window === 'undefined') return false;
  try {
    return window?.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

const PRODUCTION_WS = 'wss://mom-store-server-production.up.railway.app';

function resolveWsURL() {
  // 네이티브 앱은 실기기 설치 가능 → 프로덕션 고정. 에뮬레이터 로컬 테스트 시 임시로 ws://10.0.2.2:5001 로 바꿔 사용.
  if (isCapacitorNative()) return PRODUCTION_WS;
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  return PRODUCTION_WS;
}

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectTimer = null;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const wsURL = resolveWsURL();
    this.ws = new WebSocket(wsURL);
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.listeners.forEach((fn) => fn(data));
    };
    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  addListener(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }
}

const wsManager =
  typeof window !== 'undefined' ? new WebSocketManager() : null;
export default wsManager;
