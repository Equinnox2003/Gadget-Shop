import { useEffect, useState } from 'react';
import { loadProducts } from './db';
import type { CatalogProduct } from './db';

/** Reload after every inventory mutation and every search keystroke. */
export function useProductSearch<T extends CatalogProduct>(search: string, products: readonly T[], ready = true) {
  const [results, setResults] = useState<T[]>([]);
  useEffect(() => {
    if (ready) setResults(loadProducts<T>(search));
  }, [search, products, ready]);
  return results;
}
