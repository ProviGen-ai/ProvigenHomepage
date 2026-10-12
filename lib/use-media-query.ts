'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Live `matchMedia` result. The server (and the hydration pass) see
 * `serverValue`; the client value follows right after hydration.
 */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
