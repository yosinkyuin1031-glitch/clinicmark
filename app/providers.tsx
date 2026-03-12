'use client';

import { SessionProvider } from 'next-auth/react';
import { ClinicProvider } from '@/contexts/ClinicContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ClinicProvider>
        {children}
      </ClinicProvider>
    </SessionProvider>
  );
}
