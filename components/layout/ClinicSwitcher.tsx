'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';

export function ClinicSwitcher() {
  const { currentClinic, availableClinics, setClinic } = useClinic();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 外クリックで閉じる
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!currentClinic) return null;

  const color = getClinicColor(currentClinic.slug);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition hover:bg-slate-50',
          color.border,
        )}
        aria-label="院を切り替え"
        aria-expanded={open}
      >
        <div className={cn('w-2.5 h-2.5 rounded-full', color.bg)} />
        <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
          {currentClinic.name}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-slate-500 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
          <p className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
            院を切り替え
          </p>
          {availableClinics.map((clinic) => {
            const c = getClinicColor(clinic.slug);
            const isSelected = clinic.id === currentClinic.id;
            return (
              <button
                key={clinic.id}
                onClick={() => {
                  setClinic(clinic);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50 transition',
                  isSelected && 'bg-slate-50',
                )}
              >
                <Building2 size={15} className={cn(c.text)} />
                <span className={cn('flex-1 text-left font-medium', isSelected ? 'text-slate-900' : 'text-slate-700')}>
                  {clinic.name}
                </span>
                {isSelected && <Check size={14} className={c.text} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
