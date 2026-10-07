import { useCallback, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { saveValue, writeProducts } from './db';
import type { CatalogProduct } from './db';

/** Commit before updating the UI. No delayed save, and no SQL inside React's replayable updater. */
export function useDatabaseState<T>(initial: T, persist: (next: T) => T):
  [T, Dispatch<SetStateAction<T>>, (value: T) => void] {
  const [value, setValue] = useState(initial);
  const current = useRef(initial);
  const hydrate = useCallback((next: T) => {
    current.current = next;
    setValue(next);
  }, []);
  const update: Dispatch<SetStateAction<T>> = useCallback((action) => {
    const next = typeof action === 'function' ? (action as (previous: T) => T)(current.current) : action;
    hydrate(persist(next));
  }, [hydrate, persist]);
  return [value, update, hydrate];
}

export function useCatalogState<T extends CatalogProduct>() {
  const persist = useCallback((next: T[]) => writeProducts(next), []);
  return useDatabaseState<T[]>([], persist);
}

export function useSavedValueState<T>(key: string, initial: T) {
  const persist = useCallback((next: T) => saveValue(key, next), [key]);
  return useDatabaseState(initial, persist);
}
