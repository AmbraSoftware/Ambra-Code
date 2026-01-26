
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CensorshipContextType {
  isCensored: boolean;
  toggleCensorship: () => void;
  individualCensorship: Record<string, boolean>;
  toggleIndividualCensorship: (key: string) => void;
  isGloballyCensored: boolean;
}

const CensorshipContext = createContext<CensorshipContextType | undefined>(undefined);

export const CensorshipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isGloballyCensored, setIsGloballyCensored] = useState(true);
  const [individualCensorship, setIndividualCensorship] = useState<Record<string, boolean>>({});

  const toggleCensorship = useCallback(() => {
    setIsGloballyCensored(prev => !prev);
    // When toggling global, reset individual states to sync with global
    setIndividualCensorship({});
  }, []);

  const toggleIndividualCensorship = useCallback((key: string) => {
    setIndividualCensorship(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const isCensored = isGloballyCensored;

  return (
    <CensorshipContext.Provider value={{ isCensored, toggleCensorship, individualCensorship, toggleIndividualCensorship, isGloballyCensored }}>
      {children}
    </CensorshipContext.Provider>
  );
};

export const useCensorship = () => {
  const context = useContext(CensorshipContext);
  if (context === undefined) {
    throw new Error('useCensorship must be used within a CensorshipProvider');
  }
  return context;
};

interface CensoredProps {
  value: string | number;
  censorChar?: string;
}

export const Censored: React.FC<CensoredProps> = ({ value, censorChar = '*' }) => {
  const { isGloballyCensored, individualCensorship, toggleIndividualCensorship } = useCensorship();
  const id = React.useId();

  const invert = individualCensorship[id] || false;

  // It's censored if global is on XOR it has been individually inverted.
  // If Global=True, Invert=False -> True (Censored)
  // If Global=True, Invert=True -> False (Revealed)
  // If Global=False, Invert=False -> False (Revealed)
  // If Global=False, Invert=True -> True (Censored)
  const isEffectivelyCensored = isGloballyCensored ? !invert : invert;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleIndividualCensorship(id);
  };

  // Validate value exists before processing
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const stringValue = String(value);
  const censoredValue = stringValue.replace(/[^\s]/g, censorChar);


  return (
    <div className="flex items-center gap-2 font-code">
      <span>{isEffectivelyCensored ? censoredValue : stringValue}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleToggle}
        title={isEffectivelyCensored ? "Mostrar" : "Ocultar"}
      >
        {isEffectivelyCensored ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
};
