'use client';

import { Menu } from 'lucide-react';
import { useMobileNav } from '@/contexts/MobileNavContext';

export function MobileMenuButton() {
  const { toggle } = useMobileNav();
  return (
    <button
      onClick={toggle}
      className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition"
      aria-label="メニューを開く"
    >
      <Menu size={22} />
    </button>
  );
}
