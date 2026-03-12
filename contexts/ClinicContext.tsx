'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import type { Clinic } from '@/types';

interface ClinicContextType {
  currentClinic: Clinic | null;
  availableClinics: Clinic[];
  setClinic: (clinic: Clinic) => void;
}

const ClinicContext = createContext<ClinicContextType>({
  currentClinic:    null,
  availableClinics: [],
  setClinic:        () => {},
});

const STORAGE_KEY = 'clinicmark_current_clinic';

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);

  const availableClinics = (session?.user?.clinics ?? []) as Clinic[];

  // セッションロード後に前回選択院を復元
  useEffect(() => {
    if (availableClinics.length === 0) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    const savedClinic = saved ? JSON.parse(saved) as Clinic : null;

    // 保存された院がまだアクセス可能か確認
    const valid = savedClinic
      ? availableClinics.find((c) => c.id === savedClinic.id)
      : null;

    setCurrentClinic(valid ?? availableClinics[0]);
  }, [availableClinics.length]); // eslint-disable-line

  function setClinic(clinic: Clinic) {
    setCurrentClinic(clinic);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clinic));
  }

  return (
    <ClinicContext.Provider value={{ currentClinic, availableClinics, setClinic }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  return useContext(ClinicContext);
}
