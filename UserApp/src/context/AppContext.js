// UserApp/src/context/AppContext.js
import React, { createContext, useState, useCallback, useContext } from 'react';

const DEFAULT_USER = { name: '', phone: '', location: 'HCM', address: '' };
const DEFAULT_WHEEL = { selectedGift: null, hasSpun: false };

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user,  setUser]  = useState({ ...DEFAULT_USER });
  const [wheel, setWheel] = useState({ ...DEFAULT_WHEEL });

  const updateUser    = useCallback((f) => setUser(p  => ({ ...p,  ...f })), []);
  const setSelectedGift = useCallback((g) => setWheel({ selectedGift: g, hasSpun: true }), []);

  const resetAll = useCallback(() => {
    setUser({ ...DEFAULT_USER });
    setWheel({ ...DEFAULT_WHEEL });
  }, []);

  return (
    <AppContext.Provider value={{
      user, updateUser,
      wheel, setSelectedGift,
      resetAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
