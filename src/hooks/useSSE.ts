'use client';

import { useEffect } from 'react';

export function useSSE<T>(url: string, onMessage: (data: T) => void) {
  useEffect(() => {
    const es = new EventSource(url, { withCredentials: true });
    es.addEventListener('message', (e) => onMessage(JSON.parse(e.data)));
    es.onerror = () => es.close();
    return () => es.close();
  }, [url, onMessage]);
}
