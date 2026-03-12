import { PrismaClient } from '@prisma/client';
// SQLite対応: enumをローカル定数として定義
const BrandCategory = {
  TONE: 'TONE', TARGET: 'TARGET', SERVICE: 'SERVICE',
  KEYWORD: 'KEYWORD', TAGLINE: 'TAGLINE', NG_WORD: 'NG_WORD',
} as const;
const ContentType = {
  FAQ: 'FAQ', INSTAGRAM_POST: 'INSTAGRAM_POST', INSTAGRAM_STORY: 'INSTAGRAM_STORY',
} as const;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 シードデータ投入開始...');

  // ─── 院マスタ ───────────────────────────────────────
  const oguchi = await prisma.clinic.upsert({
    where: { slug: 'oguchi' },
    update: {},
    create: {
      name: '大口神経整体院',
      slug: 'oguchi',
      color: '#2563eb', // blue-600
    },
  });

  const seiyo = await prisma.clinic.upsert({
    where: { slug: 'seiyo' },
    update: {},
    create: {
      name: '晴陽鍼灸院',
      slug: 'seiyo',
      color: '#16a34a', // green-600
    },
  });

  console.log(`✅ 院マスタ: ${oguchi.name} / ${seiyo.name}`);

  // ─── ブランド辞書（大口神経整体院） ──────────────────
  const okuchiEntries = [
    // TONE
    { category: BrandCategory.TONE, key: '基本トーン', value: '親しみやすく、専門的すぎない言葉で。難しい医学用語は避け、患者が「わかった、行ってみよう」と感じる文体。', order: 1 },
    { category: BrandCategory.TONE, key: '禁止トーン', value: '上から目線、過度な医療的権威感、不安を煽る表現', order: 2 },

    // TARGET
    { category: BrandCategory.TARGET, key: 'メインターゲット', value: '30〜50代のデスクワーク中心の会社員・主婦。肩こり・腰痛・頭痛に長年悩んでいる。病院では「異常なし」と言われ続けている。', order: 1 },
    { category: BrandCategory.TARGET, key: 'サブターゲット', value: 'スポーツをしている10〜20代（部活・社会人スポーツ）。姿勢が気になり始めた40代後半〜60代。', order: 2 },
    { category: BrandCategory.TARGET, key: 'ターゲットの悩み', value: '毎日薬を飲んでいる。マッサージに通っても翌日には戻る。どこに行けばいいかわからない。仕事・家事に支障が出ている。', order: 3 },

    // SERVICE
    { category: BrandCategory.SERVICE, key: '主力施術', value: '神経整体（自律神経・骨格・筋肉の3軸アプローチ）、骨格矯正、姿勢改善', order: 1 },
    { category: BrandCategory.SERVICE, key: '強み・差別化', value: '「根本改善」にフォーカス。症状ではなく原因にアプローチ。再発しにくい体づくりを目指す。ボキボキしない優しい施術。', order: 2 },
    { category: BrandCategory.SERVICE, key: '施術の流れ', value: '問診 → 姿勢・骨格チェック → 施術 → セルフケア指導 → 次回プランの提案', order: 3 },

    // KEYWORD
    { category: BrandCategory.KEYWORD, key: '訴求キーワード（SEO）', value: '神経整体、骨格矯正、根本改善、再発しない、肩こり原因、腰痛原因、姿勢改善', order: 1 },
    { category: BrandCategory.KEYWORD, key: '感情訴求ワード', value: '「もう薬に頼らなくていい」「原因から治す」「体が変わった」「毎日が楽になった」', order: 2 },

    // TAGLINE
    { category: BrandCategory.TAGLINE, key: 'メインキャッチコピー', value: '「痛みの原因から、あなたの体を変える。」', order: 1 },
    { category: BrandCategory.TAGLINE, key: 'サブコピー', value: '「薬もマッサージも続かなかった人へ」「再発しない体づくり」', order: 2 },

    // NG_WORD
    { category: BrandCategory.NG_WORD, key: '法的NGワード', value: '治る、完治、保証する、効果がある（断言形）、治癒、医療行為を連想させる表現', order: 1 },
    { category: BrandCategory.NG_WORD, key: 'ブランドNGワード', value: '安い、格安、どこでもある、普通の整体、マッサージ（当院は整体院のため）', order: 2 },
  ];

  for (const entry of okuchiEntries) {
    await prisma.brandEntry.upsert({
      where: {
        id: `oguchi-${entry.category}-${entry.order}`,
      },
      update: { value: entry.value },
      create: {
        id: `oguchi-${entry.category}-${entry.order}`,
        clinicId: oguchi.id,
        ...entry,
      },
    });
  }

  // ─── ブランド辞書（晴陽鍼灸院） ──────────────────────
  const seiyoEntries = [
    // TONE
    { category: BrandCategory.TONE, key: '基本トーン', value: '落ち着いた、信頼感のある言葉で。東洋医学の深さを感じさせつつ、初心者にも優しい説明。温かみのある文体。', order: 1 },
    { category: BrandCategory.TONE, key: '禁止トーン', value: '過度にカジュアル、派手な煽り系コピー、西洋医学を否定する表現', order: 2 },

    // TARGET
    { category: BrandCategory.TARGET, key: 'メインターゲット', value: '40〜60代の女性。更年期症状・冷え・不眠・自律神経の乱れに悩んでいる。西洋医学で解決できなかった不定愁訴がある。', order: 1 },
    { category: BrandCategory.TARGET, key: 'サブターゲット', value: '妊活中・産後ケアを希望する20〜30代女性。仕事のストレスから体の不調を感じている30〜40代男性。', order: 2 },
    { category: BrandCategory.TARGET, key: 'ターゲットの悩み', value: '検査で異常がないのに体がつらい。薬を飲み続けたくない。体の内側から整えたい。東洋医学を試してみたいが、はじめてで不安。', order: 3 },

    // SERVICE
    { category: BrandCategory.SERVICE, key: '主力施術', value: '鍼灸治療（経絡・ツボへのアプローチ）、吸い玉（カッピング）、灸、自律神経調整', order: 1 },
    { category: BrandCategory.SERVICE, key: '強み・差別化', value: '東洋医学の「体全体を診る」視点。西洋医学では見えない「気・血・水」のバランス調整。不定愁訴・慢性症状に強い。', order: 2 },
    { category: BrandCategory.SERVICE, key: '施術の流れ', value: '舌診・脈診・問診 → 証（体質）の判断 → 鍼灸施術 → 養生アドバイス', order: 3 },

    // KEYWORD
    { category: BrandCategory.KEYWORD, key: '訴求キーワード（SEO）', value: '鍼灸、自律神経、冷え性、更年期、不眠、不定愁訴、東洋医学、体質改善', order: 1 },
    { category: BrandCategory.KEYWORD, key: '感情訴求ワード', value: '「体が内側から変わる」「原因不明の不調に」「ほっと一息つける時間」「体と心をリセット」', order: 2 },

    // TAGLINE
    { category: BrandCategory.TAGLINE, key: 'メインキャッチコピー', value: '「体の内側から、本来の自分を取り戻す。」', order: 1 },
    { category: BrandCategory.TAGLINE, key: 'サブコピー', value: '「検査で異常なしと言われた不調へ」「東洋医学で、あなたらしい毎日を」', order: 2 },

    // NG_WORD
    { category: BrandCategory.NG_WORD, key: '法的NGワード', value: '治る、完治、効果がある（断言形）、医療行為、診断', order: 1 },
    { category: BrandCategory.NG_WORD, key: 'ブランドNGワード', value: '安い、格安、リラクゼーション（医療的鍼灸との混同を避ける）、西洋医学を否定する言葉', order: 2 },
  ];

  for (const entry of seiyoEntries) {
    await prisma.brandEntry.upsert({
      where: {
        id: `seiyo-${entry.category}-${entry.order}`,
      },
      update: { value: entry.value },
      create: {
        id: `seiyo-${entry.category}-${entry.order}`,
        clinicId: seiyo.id,
        ...entry,
      },
    });
  }

  console.log('✅ ブランド辞書（大口・晴陽）投入完了');

  // ─── 基本プロフィール（ClinicBrandProfile） ───────────
  const okuchiProfile = {
    description:
      '大阪にある神経整体専門院。腰痛・肩こり・頭痛などに特化した独自の神経アプローチで施術を提供。駐車場完備・完全予約制。',
    brandTone:
      '親しみやすく、専門的すぎない言葉。患者さん目線で分かりやすく。堅苦しくなく、でも信頼感を大切に。',
    primaryKeywords: '神経整体\n腰痛改善\n肩こり解消\nデスクワーク\n頭痛改善\nぎっくり腰',
    areaKeywords: '大阪\n大阪市\n近隣エリア',
    greeting:
      'いつも大口神経整体院をご利用いただきありがとうございます。スタッフ一同、皆さまのお体の回復を全力でサポートいたします。',
    ctaText: 'ご予約・お問い合わせは今すぐこちらから｜当日予約OK・初回カウンセリング無料',
    recommendedPhrases:
      'お身体のケア\n根本から見直す\nご自身のペースで\n丁寧なカウンセリング\n日常生活に戻れるよう',
    forbiddenPhrases: '完治\n治ります\n必ず効果が出ます\n他院より優れている\n100%改善',
    notes: '初回限定割引あり。完全予約制。駐車場完備。施術時間60〜90分。',
  };
  await prisma.clinicBrandProfile.upsert({
    where:  { clinicId: oguchi.id },
    update: okuchiProfile,
    create: { clinicId: oguchi.id, ...okuchiProfile },
  });

  const seiyoProfile = {
    description:
      '大阪府堺市を中心に訪問鍼灸・リハビリを提供する専門院。通院が難しい方のご自宅や施設に伺い、鍼灸施術・機能訓練・日常生活動作のサポートを行う。',
    brandTone:
      '安心感と温かみを大切に、患者さんやご家族に寄り添う言葉遣い。専門的すぎず、でも信頼感のある丁寧な表現。訪問という距離の近さを活かした親しみやすいトーン。',
    primaryKeywords: '訪問鍼灸\n訪問リハビリ\n在宅医療\n機能訓練\n寝たきり予防\n介護保険',
    areaKeywords: '堺市\n大阪府\n堺区\n北区\n中区\n西区\n南区\n東区',
    greeting:
      '晴陽鍼灸院をご利用いただきありがとうございます。ご自宅やお体の状態に合わせて、安心して施術をお受けいただけるよう努めてまいります。',
    ctaText: 'まずはお気軽にお電話を｜訪問エリア・介護保険適用について無料でご相談',
    recommendedPhrases:
      'ご自宅でのケア\n日常生活の質を高める\nお体の回復を支える\n安心して続けられる\n在宅でのリハビリ',
    forbiddenPhrases: '治る\n完治\n100%改善\n必ず効果が出ます\n他院より優れている',
    notes: '介護保険・医療保険対応。訪問エリア：堺市全域・近隣市町村（要確認）。要医師同意書。',
  };
  await prisma.clinicBrandProfile.upsert({
    where:  { clinicId: seiyo.id },
    update: seiyoProfile,
    create: { clinicId: seiyo.id, ...seiyoProfile },
  });

  console.log('✅ 基本プロフィール（大口・晴陽）投入完了');

  // ─── コンテンツテンプレート ────────────────────────────
  const templates = [
    {
      id: 'tmpl-faq-symptom',
      type: ContentType.FAQ,
      name: 'FAQ・症状ページ生成',
      description: '症状名と対象患者を入力して、SEO対応のFAQ＋症状ページを生成',
      promptTemplate: `あなたは{{clinicName}}のマーケティング担当者です。
以下のブランド情報を参考に、症状ページ用のコンテンツを生成してください。

【院のブランド情報】
{{brandContext}}

【症状名】
{{symptom}}

【対象患者像】
{{targetPatient}}

【追加情報（任意）】
{{additionalInfo}}

以下の形式でMarkdown形式で出力してください：

# {{symptom}}でお悩みの方へ

## この症状について（200字程度）

## よくある原因

## 当院のアプローチ

## よくある質問（Q&A形式で3〜5問）

## こんな方におすすめ（箇条書き）

重要な制約：
- 「治る」「完治」「効果がある（断言形）」などの表現は使わない
- 患者が共感できる言葉で書く
- SEOを意識した自然なキーワードを含める`,
      variables: [
        { name: 'symptom', label: '症状名', type: 'text', required: true, placeholder: '例: 肩こり・首こり' },
        { name: 'targetPatient', label: '対象患者像（任意）', type: 'textarea', required: false, placeholder: '例: デスクワーク中心の30〜40代' },
        { name: 'additionalInfo', label: '補足情報（任意）', type: 'textarea', required: false, placeholder: '特別に伝えたいこと、除外したい内容など' },
      ],
    },
    {
      id: 'tmpl-instagram-post',
      type: ContentType.INSTAGRAM_POST,
      name: 'Instagram投稿台本生成',
      description: 'テーマを入力して、エンゲージメント重視のInstagram投稿文を生成',
      promptTemplate: `あなたは{{clinicName}}のSNS担当者です。
以下のブランド情報を参考に、Instagramの投稿台本を生成してください。

【院のブランド情報】
{{brandContext}}

【投稿テーマ】
{{theme}}

【投稿の目的】
{{purpose}}

【ターゲット読者】
{{target}}

以下の形式で出力してください：

## 📸 投稿文（140字以内）

## 🏷️ ハッシュタグ（15〜20個）

## 💡 画像・動画のイメージ

## 📣 CTA（コールトゥアクション）

重要な制約：
- 絵文字を適度に使い、親しみやすく
- 「治る」「完治」などの断言表現は使わない
- 読んだ人が「いいね」「保存」したくなるコンテンツに
- ハッシュタグは人気タグ〜ニッチタグをバランスよく`,
      variables: [
        { name: 'theme', label: '投稿テーマ', type: 'text', required: true, placeholder: '例: 肩こりの原因3選' },
        { name: 'purpose', label: '投稿の目的', type: 'select', required: true, options: ['認知拡大', 'エンゲージメント向上', '来院促進', '教育・信頼構築'], placeholder: '' },
        { name: 'target', label: 'ターゲット読者（任意）', type: 'text', required: false, placeholder: '例: 肩こりに悩む30代女性' },
      ],
    },
    {
      id: 'tmpl-instagram-story',
      type: ContentType.INSTAGRAM_STORY,
      name: 'Instagramストーリーズ台本生成',
      description: 'ストーリーズ向けの短い台本（スライド構成付き）を生成',
      promptTemplate: `あなたは{{clinicName}}のSNS担当者です。
以下のブランド情報を参考に、Instagramストーリーズの台本を生成してください。

【院のブランド情報】
{{brandContext}}

【ストーリーのテーマ】
{{theme}}

【スライド枚数】
{{slideCount}}枚

以下の形式で出力してください（スライドごとに）：

### スライド1
- **背景・デザインイメージ**:
- **テキスト（30字以内）**:
- **スタンプ・インタラクション**:

### スライド2...（続けて）

重要：
- 各スライドは単独で意味が通じること
- 最後のスライドにCTA（アクション誘導）を含める
- 親しみやすいデザインイメージを提案する`,
      variables: [
        { name: 'theme', label: 'ストーリーのテーマ', type: 'text', required: true, placeholder: '例: 今日の院内の様子・施術の流れ紹介' },
        { name: 'slideCount', label: 'スライド枚数', type: 'select', required: true, options: ['3', '5', '7', '10'], placeholder: '' },
      ],
    },
  ];

  for (const tmpl of templates) {
    await prisma.contentTemplate.upsert({
      where: { id: tmpl.id },
      update: {},
      create: {
        id: tmpl.id,
        clinicId: null, // 全院共通
        type: tmpl.type,
        name: tmpl.name,
        description: tmpl.description,
        promptTemplate: tmpl.promptTemplate,
        variables: JSON.stringify(tmpl.variables), // SQLite: JSON文字列として保存
        isActive: true,
      },
    });
  }

  console.log('✅ コンテンツテンプレート投入完了');

  // ─── 管理者ユーザー ───────────────────────────────────
  const passwordHash = await bcrypt.hash('clinicmark2024', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinicmark.local' },
    update: {},
    create: {
      name: '管理者',
      email: 'admin@clinicmark.local',
      passwordHash,
      role: 'admin',
    },
  });

  // 管理者は全院にアクセス可能
  await prisma.userClinic.upsert({
    where: { userId_clinicId: { userId: admin.id, clinicId: oguchi.id } },
    update: {},
    create: { userId: admin.id, clinicId: oguchi.id },
  });
  await prisma.userClinic.upsert({
    where: { userId_clinicId: { userId: admin.id, clinicId: seiyo.id } },
    update: {},
    create: { userId: admin.id, clinicId: seiyo.id },
  });

  console.log(`✅ 管理者ユーザー作成: ${admin.email}`);
  console.log('');
  console.log('🎉 シード完了！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ログイン情報:');
  console.log('  Email: admin@clinicmark.local');
  console.log('  Password: clinicmark2024');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ シードエラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
