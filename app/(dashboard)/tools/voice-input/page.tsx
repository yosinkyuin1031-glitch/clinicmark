'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClinic } from '@/contexts/ClinicContext';
import { Voicemail, Mic, Square, Upload, Copy, Check, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import { getClinicColor } from '@/lib/utils/clinic';

type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export default function VoiceInputPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');
  const router = useRouter();

  const [state,        setState]        = useState<RecordingState>('idle');
  const [transcript,   setTranscript]   = useState('');
  const [editedText,   setEditedText]   = useState('');
  const [error,        setError]        = useState('');
  const [elapsed,      setElapsed]      = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef   = useRef<HTMLInputElement | null>(null);
  const interimRef     = useRef('');

  // ─── Web Speech API 対応チェック ─────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // ─── リアルタイム音声認識（Web Speech API）開始 ──────────
  const startRecording = useCallback(async () => {
    setError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('お使いのブラウザは音声認識に対応していません。Chrome をお使いください。');
      return;
    }

    try {
      // マイクアクセスの確認
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalText = '';
      interimRef.current = '';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        interimRef.current = interim;
        setTranscript(finalText + interim);
        setEditedText(finalText + interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech') return; // 無音は無視
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('マイクへのアクセスが拒否されました。ブラウザの設定をご確認ください。');
        } else {
          setError(`音声認識エラー: ${event.error}`);
        }
        setState('error');
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognition.onend = () => {
        // continuous モードで予期せず終了した場合は自動再開
        if (recognitionRef.current && state === 'recording') {
          try { recognition.start(); } catch { /* ignore */ }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      setState('recording');
      setTranscript('');
      setEditedText('');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(v => v + 1), 1000);
    } catch {
      setError('マイクへのアクセスが拒否されました。ブラウザの設定をご確認ください。');
    }
  }, [state]);

  // ─── 録音停止 ─────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // 自動再開を防止
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (transcript.trim()) {
      setState('done');
    } else {
      setState('idle');
      setError('音声が認識されませんでした。もう一度お試しください。');
    }
  }, [transcript]);

  // ─── ファイルアップロード（Whisper API）───────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState('processing');
    setError('');

    try {
      const form = new FormData();
      form.append('audio', file, file.name);

      const res = await fetch('/api/tools/transcribe', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '文字起こしに失敗しました');
        setState('error');
        return;
      }

      setTranscript(data.data.text);
      setEditedText(data.data.text);
      setState('done');
    } catch {
      setError('通信エラーが発生しました');
      setState('error');
    }
  };

  // ─── 患者の声生成ページへ連携 ─────────────────────────
  const goToGenerate = () => {
    const text = encodeURIComponent(editedText);
    router.push(`/generate/patient-voice?voice=${text}`);
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', color.bg)}>
          <Voicemail size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">音声文字起こし</h1>
          <p className="text-sm text-slate-500">
            患者さんとの会話を録音 or 音声ファイルをアップロードして文字起こしします
          </p>
        </div>
      </div>

      {/* ── 録音パネル ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">

        {/* 録音ボタン */}
        <div className="flex flex-col items-center gap-4">
          {state === 'idle' || state === 'error' ? (
            <button
              onClick={startRecording}
              disabled={!speechSupported}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105 text-white',
                speechSupported ? color.bg : 'bg-slate-300 cursor-not-allowed',
              )}
            >
              <Mic size={32} />
            </button>
          ) : state === 'recording' ? (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105 bg-red-500 text-white"
            >
              <Square size={28} />
            </button>
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-slate-100">
              <Loader2 size={32} className="animate-spin text-slate-400" />
            </div>
          )}

          {/* State label */}
          <div className="text-center">
            {state === 'idle' && (
              <p className="text-sm text-slate-500">
                {speechSupported
                  ? 'マイクボタンをタップして録音開始'
                  : 'お使いのブラウザは音声認識に対応していません'}
              </p>
            )}
            {state === 'recording' && (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-red-600">録音中（リアルタイム認識）</span>
                </div>
                <span className="text-lg font-mono text-slate-700">{formatTime(elapsed)}</span>
                <p className="text-xs text-slate-400">停止ボタンで録音を終了</p>
              </div>
            )}
            {state === 'processing' && (
              <p className="text-sm text-slate-500">文字起こし中…しばらくお待ちください</p>
            )}
            {state === 'done' && (
              <p className="text-sm text-emerald-600 font-medium">文字起こし完了！</p>
            )}
          </div>
        </div>

        {/* リアルタイムプレビュー（録音中） */}
        {state === 'recording' && transcript && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">認識中のテキスト:</p>
            <p className="text-sm text-slate-700 leading-relaxed">{transcript}</p>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-100" />
          <span className="relative bg-white px-3 text-xs text-slate-400 mx-auto block w-fit">または</span>
        </div>

        {/* ファイルアップロード */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={state === 'recording' || state === 'processing'}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload size={16} />
            音声ファイルをアップロード（MP3・M4A・WAV・WebM）
          </button>
        </div>

        {/* エラー */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ── 文字起こし結果 ── */}
      {state === 'done' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">文字起こし結果</span>
            <button
              onClick={copyText}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600"
            >
              {copied ? <><Check size={12} className="text-green-600" />コピー済</> : <><Copy size={12} />コピー</>}
            </button>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-400 mb-2">内容を確認・修正してから生成ページへ進んでください</p>
            <textarea
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={goToGenerate}
              className={cn(
                'w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition hover:opacity-90',
                color.bg,
              )}
            >
              この内容でコンテンツ生成へ <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── 使い方ヒント ── */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 space-y-2">
        <p className="text-xs font-semibold text-blue-700">使い方のヒント</p>
        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
          <li>マイクボタンで録音するとリアルタイムで文字起こしされます（Chrome推奨）</li>
          <li>事前に録音した音声ファイルをアップロードすることもできます</li>
          <li>文字起こし後は内容を確認・修正してから「コンテンツ生成へ」で患者の声ページへ連携できます</li>
        </ul>
      </div>
    </div>
  );
}
