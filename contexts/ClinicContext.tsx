'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
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
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);
  const [availableClinics, setAvailableClinics] = useState<Clinic[]>([]);

  // APIからクリニック一覧を取得（認証不要）
  useEffect(() => {
    fetch('/api/clinics')
      .then((r) => r.json())
      .then((clinics: Clinic[]) => {
        setAvailableClinics(clinics);
        if (clinics.length === 0) return;

        const saved = localStorage.getItem(STORAGE_KEY);
        const savedClinic = saved ? JSON.parse(saved) as Clinic : null;
        const valid = savedClinic
          ? clinics.find((c) => c.id === savedClinic.id)
          : null;
        setCurrentClinic(valid ?? clinics[0]);
      })
      .catch(() => {});
  }, []);

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
