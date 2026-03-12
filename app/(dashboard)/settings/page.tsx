'use client';

import { Settings, Building2, Info } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { useSession } from 'next-auth/react';
import { getClinicColor, cn } from '@/lib/utils/clinic';

export default function SettingsPage() {
  const { data: session }           = useSession();
  const { currentClinic, availableClinics, setClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">設定</h1>
          <p className="text-sm text-slate-500">アカウントと院の設定</p>
        </div>
      </div>

      {/* アカウント情報 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Info size={15} /> アカウント情報
        </h2>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-slate-500">名前</dt>
            <dd className="font-medium text-slate-800">{session?.user?.name}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-slate-500">メールアドレス</dt>
            <dd className="font-medium text-slate-800">{session?.user?.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-slate-500">ロール</dt>
            <dd className="font-medium text-slate-800">
              {session?.user?.role === 'admin' ? '管理者' : 'スタッフ'}
            </dd>
          </div>
        </dl>
      </section>

      {/* 院の切り替え */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Building2 size={15} /> アクセス可能な院
        </h2>
        <div className="space-y-2">
          {availableClinics.map((clinic) => {
            const c = getClinicColor(clinic.slug);
            const isActive = clinic.id === currentClinic?.id;
            return (
              <button
                key={clinic.id}
                onClick={() => setClinic(clinic)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition',
                  isActive
                    ? cn('border-current', c.text, 'bg-slate-50')
                    : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <div className={cn('w-3 h-3 rounded-full', c.bg)} />
                <div>
                  <p className={cn('font-semibold text-sm', isActive ? 'text-slate-900' : 'text-slate-700')}>
                    {clinic.name}
                  </p>
                  <p className="text-xs text-slate-400">{clinic.slug}</p>
                </div>
                {isActive && (
                  <span className={cn('ml-auto text-xs font-medium px-2 py-1 rounded-full', c.badge)}>
                    現在選択中
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* バージョン情報 */}
      <div className="text-center text-xs text-slate-400 mt-6">
        <p>ClinicMark v0.1.0 MVP</p>
        <p className="mt-1">患者個人情報は一切取り扱いません</p>
      </div>
    </div>
  );
}
