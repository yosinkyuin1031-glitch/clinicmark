// 院ごとのブランドカラー設定
export const CLINIC_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  oguchi: {
    bg:     'bg-blue-600',
    text:   'text-blue-600',
    border: 'border-blue-600',
    badge:  'bg-blue-100 text-blue-800',
  },
  seiyo: {
    bg:     'bg-green-600',
    text:   'text-green-600',
    border: 'border-green-600',
    badge:  'bg-green-100 text-green-800',
  },
};

export function getClinicColor(slug: string) {
  return CLINIC_COLORS[slug] ?? {
    bg:     'bg-gray-600',
    text:   'text-gray-600',
    border: 'border-gray-600',
    badge:  'bg-gray-100 text-gray-800',
  };
}

// cn ユーティリティ（clsx + tailwind-merge の簡易版）
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 日付フォーマット
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
    hour:  '2-digit',
    minute:'2-digit',
  }).format(new Date(date));
}

// テキストの先頭N文字を返す
export function truncate(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}
