'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-red-600" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-2">
        エラーが発生しました
      </h2>
      <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
        予期しないエラーが発生しました。再試行するか、ページをリロードしてください。
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
        aria-label="再試行"
      >
        <RefreshCw size={15} />
        再試行する
      </button>
      {error.digest && (
        <p className="mt-4 text-xs text-slate-400">エラーID: {error.digest}</p>
      )}
    </div>
  );
}
