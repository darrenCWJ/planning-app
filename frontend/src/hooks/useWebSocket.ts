import { useEffect, useRef, useCallback } from "react";

export function useWebSocket(
  url: string,
  onMessage: (event: unknown) => void
): React.MutableRefObject<WebSocket | null> {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep the callback ref current without re-connecting on every render
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const stableHandler = useCallback((event: MessageEvent) => {
    try {
      const data: unknown = JSON.parse(event.data as string);
      onMessageRef.current(data);
    } catch {
      // Ignore non-JSON frames silently
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = stableHandler;

    ws.onerror = () => {
      // Error surface is handled at the application level via connection state
    };

    return () => {
      ws.close();
    };
  }, [url, stableHandler]);

  return wsRef;
}
