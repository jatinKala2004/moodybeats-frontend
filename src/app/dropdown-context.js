'use client';


import React, { createContext, useContext, useState, useCallback } from 'react';

const DropdownContext = createContext();

export function DropdownProvider({ children }) {
  const [dropdown, setDropdown] = useState({
    type: null, // 'recentlyPlayed' | 'searchResults'
    anchorRef: null,
    data: null,
    extra: {},
  });

  const showDropdown = useCallback((type, anchorRef, data, extra = {}) => {
    setDropdown({ type, anchorRef, data, extra });
  }, []);

  const hideDropdown = useCallback(() => {
    setDropdown({ type: null, anchorRef: null, data: null, extra: {} });
  }, []);

  return (
    <DropdownContext.Provider value={{ dropdown, showDropdown, hideDropdown }}>
      {children}
    </DropdownContext.Provider>
  );
}

export function useDropdown() {
  return useContext(DropdownContext);
} 