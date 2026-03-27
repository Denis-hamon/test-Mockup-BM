"use client";

import { useEffect, useCallback, useRef } from "react";
import type { SSEEvent } from "@/lib/sse/message-emitter";

export function useSSEMessages(onMessage: (data: SSEEvent) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/sse/messages");

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        onMessage(data);
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      // Auto-reconnect after 3s
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    eventSourceRef.current = es;
  }, [onMessage]);

  useEffect(() => {
    connect();

    // Tab visibility: close on hidden, reconnect on visible (pitfall 2)
    const handleVisibility = () => {
      if (document.hidden) {
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      } else {
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);
}
