"use client";

import { createContext, useContext, ReactNode } from "react";

const I18nContext = createContext<any>(null);

export function I18nProvider({ dictionary, children }: { dictionary: any, children: ReactNode }) {
  return (
    <I18nContext.Provider value={dictionary}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const dictionary = useContext(I18nContext);
  if (!dictionary) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return dictionary;
}
