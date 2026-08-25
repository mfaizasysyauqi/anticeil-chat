import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';

/**
 * Safe hook to read language that avoids hydration mismatch.
 * Returns 'en' during SSR, then syncs to actual stored language on client.
 */
export function useHydratedLanguage() {
  const language = useSettingsStore((s) => s.language);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // During SSR and first render, always return 'en' to match server
  // After hydration, return the actual stored language
  return hydrated ? language : 'en';
}
