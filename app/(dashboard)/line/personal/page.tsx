'use client';

import { useState, useEffect, useCallback } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import {
  UserRound, Plus, Copy, Check, Loader2, ChevronRight,
  Calendar, Hash, MessageCircle, X, Save, Sparkles, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import { getClinicColor } from '@/lib/utils/clinic';
import { Patient, PatientVisit } from '@/types';

type LineType = 'follow_up' | 'reminder' | 'reactivation';
const LINE_TYPE_LABELS: Record<LineType, string> = {
  follow_up:    '施術後フォロー',
  reminder:     '来院リマインド',
  reactivation: '再来院促進',
};

// ─── Patient Card ─────────────────────────────────────────
function PatientCard({
  patient,
  selected,
  onClick,
}: {
  patient: Patient & { visits?: PatientVisit[] };
  selected: boolean;
  onClick: () => void;
}) {
  const lastVisit = patient.lastVisitAt
    ? new Date(patient.lastVisitAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    : '来院なし';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-3 rounded-lg transition mb-1',
        selected
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-slate-50 border border-transparent',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <UserRound size={14} className="text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{patient.name}</p>
            <p className="text-xs text-slate-400">{patient.symptom || '症状未入力'}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-400">{patient.visitCount}回来院</p>
          <p className="text-xs text-slate-400">{lastVisit}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function PersonalLinePage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // List state
  const [patients,         setPatients]         = useState<Patient[]>([]);
  const [selectedPatient,  setSelectedPatient]  = useState<(Patient & { visits: PatientVisit[] }) | null>(null);
  const [isLoadingList,    setIsLoadingList]     = useState(true);
  const [listError,        setListError]         = useState<string | null>(null);
  const [showNewPatient,   setShowNewPatient]    = useState(false);

  // New patient form
  const [newName,    setNewName]    = useState('');
  const [newSymptom, setNewSymptom] = useState('');
  const [newPhone,   setNewPhone]   = useState('');
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  // Visit form
  const [sessionNote, setSessionNote] = useState('');
  const [nextAction,  setNextAction]  = useState('');
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  // LINE generation
  const [lineType,    setLineType]    = useState<LineType>('follow_up');
  const [tone,        setTone]        = useState<'friendly' | 'formal' | 'casual'>('friendly');
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);

  // Load patients
  const loadPatients = useCallback(async () => {
    if (!currentClinic) return;
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await fetch(`/api/patients?clinicId=${currentClinic.id}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `サーバーエラー (${res.status})`);
      }
      const data = await res.json();
      setPatients(data.data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '患者一覧の取得に失敗しました';
      setListError(msg);
      console.error('[loadPatients]', e);
    } finally {
      setIsLoadingList(false);
    }
  }, [currentClinic]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  // Select patient (load detail)
  const selectPatient = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || '患者情報の取得に失敗しました');
      }
      const data = await res.json();
      setSelectedPatient(data.data);
      setGeneratedMsg('');
      setGenerateError(null);
      setSessionNote('');
      setNextAction('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '患者情報の取得に失敗しました';
      alert(msg);
      console.error('[selectPatient]', e);
    }
  };

  // Create patient
  const createPatient = async () => {
    if (!currentClinic || !newName.trim()) return;
    setIsSavingPatient(true);
    try {
      const res = await fetch('/api/patients', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clinicId: currentClinic.id, name: newName, symptom: newSymptom, phone: newPhone }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || '患者の追加に失敗しました');
      }
      setNewName(''); setNewSymptom(''); setNewPhone('');
      setShowNewPatient(false);
      await loadPatients();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '患者の追加に失敗しました';
      alert(msg);
      console.error('[createPatient]', e);
    } finally {
      setIsSavingPatient(false);
    }
  };

  // Add visit
  const addVisit = async () => {
    if (!selectedPatient || !sessionNote.trim()) return;
    setIsSavingVisit(true);
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/visits`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionNote, nextAction }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || '来院記録の保存に失敗しました');
      }
      await selectPatient(selectedPatient.id);
      await loadPatients();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '来院記録の保存に失敗しました';
      alert(msg);
      console.error('[addVisit]', e);
    } finally {
      setIsSavingVisit(false);
    }
  };

  // Generate LINE
  const generateLine = async () => {
    if (!currentClinic || !selectedPatient) return;
    const note = sessionNote || (selectedPatient.visits?.[0]?.sessionNote ?? '');
    if (!note.trim()) return;

    setIsGenerating(true);
    setGeneratedMsg('');
    setGenerateError(null);
    try {
      const res = await fetch('/api/generate/personal-line', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          clinicId:   currentClinic.id,
          patientId:  selectedPatient.id,
          sessionNote: note,
          lineType,
          tone,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'LINE生成に失敗しました');
      }
      const data = await res.json();
      if (data.data?.message) {
        setGeneratedMsg(data.data.message);
      } else {
        throw new Error('生成結果が空でした');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'LINE生成に失敗しました';
      setGenerateError(msg);
      console.error('[generateLine]', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyMsg = async () => {
    await navigator.clipboard.writeText(generatedMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* -- LEFT: 患者一覧 -- */}
      <div className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">患者一覧</h2>
            <button
              onClick={() => setShowNewPatient(v => !v)}
              className={cn('p-1.5 rounded-lg transition', color.bg, 'text-white')}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* 新規患者フォーム */}
          {showNewPatient && (
            <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="患者名 *"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <input
                value={newSymptom}
                onChange={e => setNewSymptom(e.target.value)}
                placeholder="症状・主訴"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="電話番号"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <div className="flex gap-1">
                <button
                  onClick={createPatient}
                  disabled={isSavingPatient || !newName.trim()}
                  className={cn('flex-1 text-xs py-1.5 rounded-lg text-white font-medium transition', isSavingPatient || !newName.trim() ? 'bg-slate-300' : cn('hover:opacity-90', color.bg))}
                >
                  {isSavingPatient ? '保存中...' : '追加'}
                </button>
                <button onClick={() => setShowNewPatient(false)} className="px-2 py-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 患者リスト */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {isLoadingList ? (
            <div className="flex justify-center pt-8">
              <Loader2 size={20} className="animate-spin text-slate-300" />
            </div>
          ) : listError ? (
            <div className="text-center pt-8 px-3">
              <AlertCircle size={28} className="mx-auto mb-2 text-red-300" />
              <p className="text-xs text-red-500">{listError}</p>
              <button onClick={loadPatients} className="mt-2 text-xs text-blue-600 hover:underline">再読み込み</button>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center pt-8 text-slate-400">
              <UserRound size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">患者を追加してください</p>
            </div>
          ) : (
            patients.map(p => (
              <PatientCard
                key={p.id}
                patient={p}
                selected={selectedPatient?.id === p.id}
                onClick={() => selectPatient(p.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* -- RIGHT: 患者詳細 + LINE生成 -- */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {!selectedPatient ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ChevronRight size={40} className="mb-3 opacity-20 rotate-180" />
            <p className="text-sm">患者を選択してください</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

            {/* 患者情報ヘッダー */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <UserRound size={18} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{selectedPatient.name}</p>
                  <p className="text-sm text-slate-500">{selectedPatient.symptom || '症状未入力'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Hash size={11} /> {selectedPatient.visitCount}回来院
                    </span>
                    {selectedPatient.lastVisitAt && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={11} />
                        最終来院: {new Date(selectedPatient.lastVisitAt).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 来院記録 + 新規メモ */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">施術メモを追加（任意）</h3>
              <textarea
                value={sessionNote}
                onChange={e => setSessionNote(e.target.value)}
                rows={3}
                placeholder="本日の施術内容・患者さんの声・気になった点などを記録してください"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
              <input
                value={nextAction}
                onChange={e => setNextAction(e.target.value)}
                placeholder="次回のアクション（例: 2週間後に来院推奨）"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={addVisit}
                disabled={isSavingVisit || !sessionNote.trim()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition',
                  isSavingVisit || !sessionNote.trim() ? 'bg-slate-300 cursor-not-allowed' : cn('hover:opacity-90', color.bg),
                )}
              >
                <Save size={14} />
                {isSavingVisit ? '保存中...' : '来院記録を保存'}
              </button>
            </div>

            {/* LINE生成 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MessageCircle size={16} />
                カスタマイズLINEを生成
              </h3>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(LINE_TYPE_LABELS) as LineType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setLineType(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                      lineType === t
                        ? cn('text-white border-transparent shadow-sm', color.bg)
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                    )}
                  >
                    {LINE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-600">文体:</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value as 'friendly' | 'formal' | 'casual')}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="friendly">やわらかく親しみやすい</option>
                  <option value="formal">丁寧でフォーマル</option>
                  <option value="casual">カジュアル</option>
                </select>
              </div>

              {!sessionNote.trim() && !selectedPatient.visits?.[0]?.sessionNote && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  施術メモがまだありません。上のフォームでメモを入力するか、保存してから生成してください。
                </p>
              )}

              <button
                onClick={generateLine}
                disabled={isGenerating || (!sessionNote.trim() && !selectedPatient.visits?.[0]?.sessionNote)}
                className={cn(
                  'w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition',
                  isGenerating || (!sessionNote.trim() && !selectedPatient.visits?.[0]?.sessionNote)
                    ? 'bg-slate-300 cursor-not-allowed'
                    : cn('hover:opacity-90', color.bg),
                )}
              >
                {isGenerating
                  ? <><Loader2 size={15} className="animate-spin" />生成中...</>
                  : <><Sparkles size={15} />{selectedPatient.name}さん向けLINEを生成</>}
              </button>
            </div>

            {/* 生成エラー */}
            {generateError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{generateError}</span>
                <button onClick={() => setGenerateError(null)} className="ml-auto text-red-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* 生成結果 */}
            {generatedMsg && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-700">
                    {LINE_TYPE_LABELS[lineType]}（{selectedPatient.name}さん向け）
                  </span>
                  <button
                    onClick={copyMsg}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600"
                  >
                    {copied
                      ? <><Check size={12} className="text-green-600" />コピー済</>
                      : <><Copy size={12} />コピー</>}
                  </button>
                </div>
                <div className="p-4">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{generatedMsg}</pre>
                </div>
              </div>
            )}

            {/* 来院履歴 */}
            {selectedPatient.visits && selectedPatient.visits.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">来院履歴</h3>
                <div className="space-y-3">
                  {selectedPatient.visits.map((v, i) => (
                    <div key={v.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn('w-2.5 h-2.5 rounded-full mt-1', i === 0 ? color.bg : 'bg-slate-200')} />
                        {i < selectedPatient.visits.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-100 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-xs text-slate-400 mb-1">
                          {new Date(v.visitedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {v.sessionNote && (
                          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{v.sessionNote}</p>
                        )}
                        {v.nextAction && (
                          <p className="text-xs text-blue-600 mt-1">→ {v.nextAction}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
