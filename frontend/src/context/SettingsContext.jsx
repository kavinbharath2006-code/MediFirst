import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'ers.settings.v1';
export const DEFAULT_SETTINGS = {
  useLocation: false,
  area: 'tambaram',
  emergencyNumber: '108',
  contacts: [],
  textSize: 'normal',
  theme: 'auto',
};

const Ctx = createContext(null);

function load() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage may be blocked */ }
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.text = settings.textSize;
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return <Ctx.Provider value={{ settings, update, reset }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
