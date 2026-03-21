# ClinicMark

治療院・整体院・鍼灸院向けの **AI マーケティング支援ツール**です。
院のブランド辞書をもとに、FAQ・ブログ・SNS 投稿・LINE メッセージ・チラシなど多様なコンテンツを一括生成・管理できます。

---

## 主な機能

| カテゴリ | 機能 |
|---|---|
| **コンテンツ生成** | 一括生成（19 種）、FAQ・症状ページ、Instagram 台本、ストーリーズ、Meta 広告コピー、訴求軸別広告・LP、LP セクション、画像指示文 |
| **SNS 連携** | Threads 自動投稿 |
| **LINE 管理** | テンプレート管理、ステップ配信シナリオ |
| **集客ツール** | チラシ管理（AI コピー生成 + ファイルアップロード） |
| **競合分析** | テキスト貼り付け → 強み・弱み・差別化ポイントを分析 |
| **コンテンツ管理** | ライブラリ（一括ステータス変更）、コンテンツ管理マップ |
| **その他ツール** | 口コミ返信文生成、音声文字起こし、画像リミックス |

---

## 必要なもの

| サービス | 用途 | 費用 |
|---|---|---|
| **Vercel** | ホスティング | 無料プラン可 |
| **Supabase** | PostgreSQL データベース | 無料プラン可 |
| **Anthropic API** | AI コンテンツ生成 | 従量課金（利用分のみ） |
| GitHub アカウント | ソースコード管理 | 無料 |

> 💡 Anthropic API の利用料のみ従量課金です。それ以外のサービスは無料プランで利用できます。
> 利用者自身がデプロイ・API 費用を負担する形です。

---

## セットアップ（ローカル開発）

### 1. リポジトリをクローン

```bash
git clone https://github.com/YOUR_USERNAME/clinicmark.git
cd clinicmark
npm install
```

### 2. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を開いて最低限以下を設定してください：

```env
DATABASE_URL="file:./dev.db"          # ローカルは SQLite で OK
NEXTAUTH_SECRET="任意の文字列"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."        # 未設定でもモックモードで動作
```

### 3. データベースの初期化

```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. 開発サーバー起動

```bash
npm run dev
```

`http://localhost:3000` にアクセスして、シードで作成されたアカウントでログインしてください。

---

## 本番デプロイ（Vercel + Supabase）

詳細な手順は [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) を参照してください。

### 概要

1. Supabase でプロジェクトを作成し、接続文字列（`DATABASE_URL`）を取得
2. GitHub にリポジトリを作成してプッシュ
3. Vercel にデプロイ（`vercel --yes`）
4. Vercel の環境変数に `DATABASE_URL`・`NEXTAUTH_SECRET`・`NEXTAUTH_URL`・`ANTHROPIC_API_KEY` を設定
5. 本番 DB にマイグレーション実行：`DATABASE_URL="..." npx prisma migrate deploy`
6. `vercel --prod` で本番公開

---

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Next.js 14（App Router） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| データベース | PostgreSQL（Prisma ORM）/ SQLite（ローカル） |
| 認証 | NextAuth.js |
| AI | Anthropic Claude API |
| デプロイ | Vercel |

---

## ディレクトリ構成

```
clinicmark/
├── app/
│   ├── (dashboard)/          # メインUI（認証済みページ）
│   │   ├── page.tsx           # ダッシュボード
│   │   ├── brand/             # ブランド辞書
│   │   ├── generate/          # コンテンツ生成系
│   │   ├── library/           # コンテンツライブラリ
│   │   ├── line/              # LINE テンプレート・ステップ配信
│   │   ├── flyers/            # チラシ管理
│   │   ├── tools/             # ツール群（競合分析など）
│   │   └── content-map/       # コンテンツ管理マップ
│   ├── api/                  # API ルート
│   └── auth/                 # 認証ページ
├── components/               # 再利用コンポーネント
├── lib/
│   ├── ai/                   # AI 生成ロジック
│   ├── auth.ts               # NextAuth 設定
│   └── db/                   # Prisma クライアント
├── prisma/
│   ├── schema.prisma         # DB スキーマ
│   └── seed.ts               # シードデータ
├── types/                    # TypeScript 型定義
└── hooks/                    # カスタム React Hooks
```

---

## 環境変数一覧

`.env.example` に全変数の説明があります。必須は以下の 4 つです：

| 変数名 | 説明 |
|---|---|
| `DATABASE_URL` | データベース接続文字列 |
| `NEXTAUTH_SECRET` | セッション署名キー（`openssl rand -base64 32`） |
| `NEXTAUTH_URL` | アプリの URL |
| `ANTHROPIC_API_KEY` | Claude API キー（未設定でもモックモードで起動） |

---

## ライセンス

Private — 利用者自身がデプロイ・運用してください。
