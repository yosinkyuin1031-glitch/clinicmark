'use client';

import { useState } from 'react';
import { Star, ExternalLink, MessageCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';

interface ReviewConfig {
  clinicName:           string;
  googleUrl:            string;
  hotpepperUrl:         string;
  positiveThreshold:    number;
  guidancePositive:     string;
  guidanceHotpepper:    string;
  guidanceNegative:     string;
  pageTitle:            string;
  satisfactionQuestion: string;
}

export default function ReviewPageClient({ config }: { config: ReviewConfig }) {
  const [score,    setScore]    = useState<number | null>(null);
  const [hovering, setHovering] = useState<number | null>(null);
  const [step,     setStep]     = useState<'rating' | 'positive' | 'negative'>('rating');

  const handleScore = (s: number) => {
    setScore(s);
    if (s >= config.positiveThreshold) {
      setStep('positive');
    } else {
      setStep('negative');
    }
  };

  const displayScore = hovering ?? score;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo / clinic name */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Star size={28} className="text-white fill-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">{config.clinicName}</h1>
          <p className="text-sm text-slate-500 mt-1">{config.pageTitle}</p>
        </div>

        {/* ── STEP 1: Rating ── */}
        {step === 'rating' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
            <p className="text-center text-slate-700 font-medium text-sm leading-relaxed">
              {config.satisfactionQuestion}
            </p>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onMouseEnter={() => setHovering(n)}
                  onMouseLeave={() => setHovering(null)}
                  onClick={() => handleScore(n)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={cn(
                      'transition-colors',
                      displayScore != null && n <= displayScore
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-200',
                    )}
                  />
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-slate-400">
              星をタップして評価してください
            </p>
          </div>
        )}

        {/* ── STEP 2a: Positive → Google / Hotpepper ── */}
        {step === 'positive' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-center mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    size={22}
                    className={cn(
                      n <= (score ?? 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-200',
                    )}
                  />
                ))}
              </div>
              <p className="text-center text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {config.guidancePositive}
              </p>
            </div>

            {/* Google */}
            <a
              href={config.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 text-sm font-semibold shadow transition"
            >
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                </svg>
                Google マップに口コミを書く
              </span>
              <ExternalLink size={16} />
            </a>

            {/* Hotpepper */}
            {config.hotpepperUrl && (
              <>
                <p className="text-center text-xs text-slate-500 whitespace-pre-line leading-relaxed">
                  {config.guidanceHotpepper}
                </p>
                <a
                  href={config.hotpepperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full bg-red-500 hover:bg-red-600 text-white rounded-xl px-5 py-4 text-sm font-semibold shadow transition"
                >
                  <span className="flex items-center gap-2">
                    <Star size={18} className="fill-white" />
                    ホットペッパーに口コミを書く
                  </span>
                  <ExternalLink size={16} />
                </a>
              </>
            )}

            <button
              onClick={() => { setStep('rating'); setScore(null); }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 underline"
            >
              最初に戻る
            </button>
          </div>
        )}

        {/* ── STEP 2b: Negative → Direct feedback ── */}
        {step === 'negative' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-center mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    size={22}
                    className={cn(
                      n <= (score ?? 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-200',
                    )}
                  />
                ))}
              </div>
              <p className="text-center text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {config.guidanceNegative}
              </p>
            </div>

            <a
              href={`tel:${''}`}
              className="flex items-center justify-between w-full bg-slate-700 hover:bg-slate-800 text-white rounded-xl px-5 py-4 text-sm font-semibold shadow transition"
            >
              <span className="flex items-center gap-2">
                <MessageCircle size={18} />
                スタッフに直接お伝えする
              </span>
              <ArrowRight size={16} />
            </a>

            <button
              onClick={() => { setStep('rating'); setScore(null); }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 underline"
            >
              最初に戻る
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-300">Powered by ClinicMark</p>
      </div>
    </div>
  );
}
