import { useCallback, useRef, useState } from 'react';

/**
 * Guards one-shot actions (checkout, buy now, save, upload, delete)
 * against rapid double clicks. Only one invocation runs at a time.
 */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const run = useCallback(async (fn: () => void | Promise<void>): Promise<boolean> => {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      console.warn('action failed', e);
      throw e;
    } finally {
      running.current = false;
      setBusy(false);
    }
    return true;
  }, []);

  return { busy, run };
}
