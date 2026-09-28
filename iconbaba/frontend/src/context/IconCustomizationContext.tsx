// frontend/src/context/IconCustomizationContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { IconCustomization, IconStyle, StrokeLinecap, StrokeLinejoin } from '@/types/icon';
import { useTheme } from '@/context/ThemeContext';

interface IconCustomizationContextType {
  style: IconStyle;
  setStyle: (style: IconStyle) => void;
  customization: IconCustomization;
  setSize: (size: number) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setStrokeLinecap: (linecap: StrokeLinecap) => void;
  setStrokeLinejoin: (linejoin: StrokeLinejoin) => void;
  quickCopyMode: boolean;
  setQuickCopyMode: (enabled: boolean) => void;
  resetCustomization: () => void;
}

const IconCustomizationContext = createContext<IconCustomizationContextType | undefined>(undefined);

export function IconCustomizationProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [style, setStyle] = useState<IconStyle>('outlined');
  const [isCustomColorSet, setIsCustomColorSet] = useState<boolean>(false);

  const [customization, setCustomization] = useState<IconCustomization>(() => ({
    size: 128,
    color: '#0f172a',
    strokeWidth: 3.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }));

  const [quickCopyMode, setQuickCopyMode] = useState<boolean>(false);

  const setSize = (size: number) => setCustomization((prev) => ({ ...prev, size }));
  const setColor = (color: string) => {
    setIsCustomColorSet(true);
    setCustomization((prev) => ({ ...prev, color }));
  };
  const setStrokeWidth = (strokeWidth: number) =>
    setCustomization((prev) => ({
      ...prev,
      strokeWidth: Math.max(1, Math.min(15, Math.round(strokeWidth * 10) / 10)),
    }));
  const setStrokeLinecap = (strokeLinecap: StrokeLinecap) =>
    setCustomization((prev) => ({ ...prev, strokeLinecap }));
  const setStrokeLinejoin = (strokeLinejoin: StrokeLinejoin) =>
    setCustomization((prev) => ({ ...prev, strokeLinejoin }));

  const resetCustomization = () => {
    setIsCustomColorSet(false);
    setCustomization({
      size: 96,
      color: '#0f172a',
      strokeWidth: 5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    });
    setQuickCopyMode(false);
  };

  return (
    <IconCustomizationContext.Provider
      value={{
        style,
        setStyle,
        customization,
        setSize,
        setColor,
        setStrokeWidth,
        setStrokeLinecap,
        setStrokeLinejoin,
        quickCopyMode,
        setQuickCopyMode,
        resetCustomization,
      }}
    >
      {children}
    </IconCustomizationContext.Provider>
  );
}

export function useIconCustomization() {
  const context = useContext(IconCustomizationContext);
  if (!context) {
    throw new Error('useIconCustomization must be used within IconCustomizationProvider');
  }
  return context;
}
