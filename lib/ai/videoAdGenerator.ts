import { VideoAdLength, VideoAdScript, VideoAdScene } from '@/types';
import { generateText, IS_MOCK_MODE } from './client';

// ─── モックデータ ─────────────────────────────────────────
const MOCK_SCRIPTS: Record<VideoAdLength, VideoAdScript> = {
  '15s': {
    length:    '15s',
    label:     '15秒（バンパー広告）',
    opening:   '腰痛で毎朝つらい思いをしていませんか？',
    narration: '当院の整体で、多くの方が「楽になった」と実感。初回カウンセリング無料。まずはご相談ください。',
    scenes: [
      { timeCode: '0:00〜0:03', caption: '腰痛で毎朝つらい思いをしていませんか？',  visual: '朝起きあがれずに顔をしかめる人のシルエット（側面・暗め）' },
      { timeCode: '0:03〜0:10', caption: '多くの方が「楽になった」と実感しています', visual: '施術中の温かい照明の治療室、施術者の手元アップ' },
      { timeCode: '0:10〜0:15', caption: '初回カウンセリング無料／まずはご相談を',  visual: '院のロゴ＋電話番号＋QRコード。明るく清潔感のある白背景' },
    ],
    closing: '○○整体院 / まずは無料相談へ',
    cta:     '初回カウンセリング無料 → プロフィールURLへ',
  },
  '30s': {
    length:    '30s',
    label:     '30秒（標準）',
    opening:   '「腰が痛くて、朝起き上がるのがつらい…」そんなお悩み、ひとりで抱えていませんか？',
    narration: 'デスクワークや育児で腰に負担がかかり続けると、慢性的な痛みにつながることがあります。当院では、痛みの根本原因にアプローチする施術と、毎日できるセルフケア指導を組み合わせてサポート。多くの方が「施術後、体が軽くなった」と感じています。まずは初回カウンセリング（無料）でご相談ください。',
    scenes: [
      { timeCode: '0:00〜0:05', caption: '「腰が痛くて…朝が毎日つらい」',            visual: 'デスクで腰を押さえる人（白背景・明るい雰囲気）' },
      { timeCode: '0:05〜0:12', caption: '慢性的な腰痛は放置すると悪化することも',    visual: '腰の骨格アニメーション（シンプルな図解）' },
      { timeCode: '0:12〜0:22', caption: '根本原因へのアプローチ＋セルフケア指導',    visual: '施術シーン（清潔・プロフェッショナルな印象）、施術者と患者が話しているシーン' },
      { timeCode: '0:22〜0:27', caption: '「施術後、体が軽くなりました」（患者の声）', visual: 'テキストテロップ＋院内の温かみのある空間' },
      { timeCode: '0:27〜0:30', caption: '初回カウンセリング無料 → まずはご相談を',   visual: '院ロゴ＋予約URL・QRコード（白背景）' },
    ],
    closing: '腰痛でお悩みなら、まず無料相談から。○○整体院',
    cta:     '初回カウンセリング無料 / プロフィールリンクからご予約',
  },
  '60s': {
    length:    '60s',
    label:     '60秒（詳細訴求）',
    opening:   '「朝から腰が重くて、仕事も育児もしんどい……」そんな毎日を送っていませんか？',
    narration: '腰痛は我慢していると、どんどん慢性化してしまいます。デスクワークや長時間の立ち仕事、育児などで腰への負担が蓄積されると、筋肉や関節に炎症が広がり、日常生活に支障が出てしまうことも。当院では、まず「なぜ腰が痛むのか」を丁寧にカウンセリング。原因にあわせた施術プランを個別に作成し、深部の筋肉・骨格へのアプローチで根本からケアします。さらに、おうちで続けられるセルフケアも丁寧にお伝えするので、施術が終わっても安心。実際に「3回の施術で朝の痛みが半分以下になった」という声もいただいています。初回カウンセリングは無料。完全予約制・個室対応ですので、お気軽にご連絡ください。',
    scenes: [
      { timeCode: '0:00〜0:08', caption: '「朝から腰が重くて…毎日がしんどい」',             visual: '朝に腰を押さえる人。徐々に画面が明るくなる演出' },
      { timeCode: '0:08〜0:18', caption: '腰痛は我慢すると慢性化してしまいます',             visual: '腰まわりの図解アニメーション（炎症・筋肉の硬化を表現）' },
      { timeCode: '0:18〜0:30', caption: '丁寧なカウンセリングで原因を特定',                 visual: 'カウンセリングルームで話し合うシーン（温かい照明）' },
      { timeCode: '0:30〜0:42', caption: '深部の筋肉・骨格へのアプローチ＋セルフケア指導', visual: '施術シーン（手元アップ）→ 患者にセルフケアを教えるシーン' },
      { timeCode: '0:42〜0:52', caption: '「3回の施術で朝の痛みが半分以下に」（患者の声）',  visual: 'テロップ＋満足げな表情の人（後ろ姿 or イラスト）' },
      { timeCode: '0:52〜0:60', caption: '初回カウンセリング無料 / 完全予約制・個室対応',    visual: '院ロゴ・電話番号・QRコード（清潔感ある白背景）' },
    ],
    closing: '腰痛のお悩みはひとりで抱え込まないで。○○整体院がサポートします。',
    cta:     '初回カウンセリング無料 / プロフィールリンクからご予約 / 電話番号も掲載',
  },
};

// ─── CTA 強度 ─────────────────────────────────────────────
const CTA_STRENGTH_MAP: Record<1 | 2 | 3, string> = {
  1: '「気になる方はお気軽にご相談ください」のようなやさしいCTA',
  2: '「初回カウンセリング無料・まずはご予約を」の標準的なCTA',
  3: '「今すぐご予約を！先着○名様限定」のような強いCTA',
};

// ─── プロンプト構築 ────────────────────────────────────────
function buildPrompt(
  adLength: VideoAdLength,
  symptom: string,
  target: string,
  appealAxis: string,
  tone: string,
  ctaStrength: 1 | 2 | 3,
  brandContext: string,
  clinicName: string,
): string {
  const lengthConfig: Record<VideoAdLength, { seconds: number; sceneCount: number }> = {
    '15s': { seconds: 15, sceneCount: 3 },
    '30s': { seconds: 30, sceneCount: 5 },
    '60s': { seconds: 60, sceneCount: 6 },
  };
  const { seconds, sceneCount } = lengthConfig[adLength];
  const toneMap: Record<string, string> = {
    friendly: 'やわらかく親しみやすいトーン',
    formal:   '丁寧でフォーマルなトーン',
    casual:   'カジュアルで話しかけるようなトーン',
  };

  return `あなたは医療・健康系の動画広告クリエイターです。
以下の条件で ${seconds}秒 の動画広告台本を作成してください。

=== 広告条件 ===
院名: ${clinicName}
症状・お悩み: ${symptom}
ターゲット: ${target}
訴求軸: ${appealAxis}
文体トーン: ${toneMap[tone] ?? toneMap.friendly}
CTA強度: ${CTA_STRENGTH_MAP[ctaStrength]}

=== ブランド情報 ===
${brandContext}

=== 出力形式（JSON）===
以下のJSON形式で出力してください。前置きや説明文は不要です。

{
  "opening": "冒頭のつかみセリフ（視聴者の心をつかむ1〜2文）",
  "narration": "全体のナレーション原稿（自然な流れで ${seconds}秒に収まる文量）",
  "scenes": [
    {
      "timeCode": "0:00〜0:XX",
      "caption": "テロップ文（画面に表示するテキスト）",
      "visual": "映像の内容指示（どんな映像を撮るか・どんなビジュアルにするか）"
    }
  ],
  "closing": "エンディングのセリフ・テキスト",
  "cta": "CTA文（行動を促すメッセージ）"
}

scenes は ${sceneCount}個 作成してください。

=== 注意事項 ===
- 「完治」「治ります」「必ず」「100%」など医療広告ガイドラインに違反する表現は使用しないこと
- 視聴者が共感できる冒頭にすること
- 映像指示は具体的に書くこと（どんなシーン・角度・照明）
- JSON のみ出力すること`;
}

// ─── JSON パース ──────────────────────────────────────────
function parseScript(text: string, adLength: VideoAdLength): VideoAdScript {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSONが見つかりません');
  const parsed = JSON.parse(match[0]);
  return {
    length:    adLength,
    label:     ({ '15s': '15秒（バンパー広告）', '30s': '30秒（標準）', '60s': '60秒（詳細訴求）' })[adLength],
    opening:   String(parsed.opening   ?? ''),
    narration: String(parsed.narration ?? ''),
    scenes:    Array.isArray(parsed.scenes) ? parsed.scenes.map((s: VideoAdScene) => ({
      timeCode: String(s.timeCode ?? ''),
      caption:  String(s.caption  ?? ''),
      visual:   String(s.visual   ?? ''),
    })) : [],
    closing:   String(parsed.closing ?? ''),
    cta:       String(parsed.cta     ?? ''),
  };
}

// ─── 単体生成 ─────────────────────────────────────────────
async function generateOne(
  adLength: VideoAdLength,
  symptom: string,
  target: string,
  appealAxis: string,
  tone: 'friendly' | 'formal' | 'casual',
  ctaStrength: 1 | 2 | 3,
  brandContext: string,
  clinicName: string,
): Promise<VideoAdScript> {
  if (IS_MOCK_MODE) {
    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));
    // モック: 院名だけ置換
    const mock = { ...MOCK_SCRIPTS[adLength] };
    mock.closing = mock.closing.replace('○○整体院', clinicName);
    return mock;
  }

  const prompt = buildPrompt(adLength, symptom, target, appealAxis, tone, ctaStrength, brandContext, clinicName);
  const result = await generateText({ prompt });
  return parseScript(result.text, adLength);
}

// ─── 一括生成（並列） ─────────────────────────────────────
export async function generateVideoAds(
  adLengths: VideoAdLength[],
  symptom: string,
  target: string,
  appealAxis: string,
  tone: 'friendly' | 'formal' | 'casual',
  ctaStrength: 1 | 2 | 3,
  brandContext: string,
  clinicName: string,
): Promise<VideoAdScript[]> {
  return Promise.all(
    adLengths.map(len =>
      generateOne(len, symptom, target, appealAxis, tone, ctaStrength, brandContext, clinicName),
    ),
  );
}
