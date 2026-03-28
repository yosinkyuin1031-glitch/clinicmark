'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AuthError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 mb-4">
          <AlertTriangle size={28} className="text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          認証エラーが発生しました
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          ログイン処理中にエラーが発生しました。再度お試しください。
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          aria-label="再試行"
        >
          <RefreshCw size={15} />
          再試行する
        </button>
      </div>
    </div>
  );
}
