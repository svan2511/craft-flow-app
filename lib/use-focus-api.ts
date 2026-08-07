import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import { useApi } from '@/lib/use-api';

/**
 * `useApi` that also refetches every time the screen regains focus. Tab screens
 * stay mounted, so without this they keep showing stale data until the user
 * pulls to refresh. The initial mount load is not duplicated.
 */
export function useFocusApi<T>(fetcher: () => Promise<T>) {
  const api = useApi(fetcher);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      api.reload();
    }, [api.reload]),
  );

  return api;
}
