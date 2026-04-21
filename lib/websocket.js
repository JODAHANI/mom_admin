class WebSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.reconnectTimer = null;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || 5001;
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    this.ws = new WebSocket(`ws://${host}:${wsPort}`);
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
