import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tromot_saved_products';

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('tromot:saved-products-changed'));
  } catch {
    // ignore
  }
}

export function useSavedProducts() {
  const [savedIds, setSavedIds] = useState<string[]>(() => read());

  useEffect(() => {
    const sync = () => setSavedIds(read());
    window.addEventListener('storage', sync);
    window.addEventListener('tromot:saved-products-changed', sync as EventListener);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('tromot:saved-products-changed', sync as EventListener);
    };
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggleSaved = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    write(next);
    setSavedIds(next);
    return next.includes(id);
  }, []);

  return { savedIds, isSaved, toggleSaved };
}