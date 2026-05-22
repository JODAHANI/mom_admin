function isCapacitorNative() {
  if (typeof window === 'undefined') return false;
  try {
    return window?.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

function resolveWsURL() {
  // 네이티브 앱은 .env의 NEXT_PUBLIC_WS_URL보다 우선 — 빌드 시 DCE되지 않도록 순서 중요
  if (isCapacitorNative()) return 'ws://10.0.2.2:5001';
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  return 'wss://mom-store-server-production.up.railway.app';
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
