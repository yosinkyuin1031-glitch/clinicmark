# ClinicMark デプロイ手順書

> この手順をClaude Codeに渡せばデプロイを進めてもらえます。

---

## 前提条件（先に自分でやること）

### 1. Homebrewをインストール（Macのターミナルで実行）
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. GitHub CLIとVercel CLIをインストール
```bash
brew install gh
brew install vercel-cli
```

### 3. GitHubにログイン
```bash
gh auth login
```
→ ブラウザが開くのでGitHubアカウントでログイン

### 4. Vercelにログイン
```bash
vercel login
```
→ ブラウザが開くのでVercelアカウントでログイン（GitHubアカウントで登録可能）

### 5. Supabaseのセットアップ
1. https://supabase.com にアクセス → GitHubアカウントで無料登録
2. 「New Project」でプロジェクト作成（名前: clinicmark、リージョン: Northeast Asia (Tokyo)）
3. データベースパスワードを控える
4. 作成後、Settings → Database → Connection string (URI) をコピー

---

## ここからClaude Codeへの指示

以下をClaude Codeに貼り付けてください：

---

### 指示：ClinicMarkをデプロイしてください

プロジェクト: `/Users/ooguchiyouhei/コード/clinicmark`

#### やること

1. **GitHubにリポジトリを作成してプッシュ**
```bash
cd ~/コード/clinicmark
gh repo create clinicmark --private --source=. --push
```

2. **Prismaのデータソースを本番対応に変更**
- `prisma/schema.prisma` の `provider` を `"postgresql"` に変更
- `prisma/schema.prisma` の `url` を `env("DATABASE_URL")` に設定

3. **Vercelにデプロイ**
```bash
cd ~/コード/clinicmark
vercel --yes
```

4. **Vercelに環境変数を設定**
```bash
vercel env add DATABASE_URL production
# → Supabaseの接続文字列を入力

vercel env add NEXTAUTH_SECRET production
# → 以下で生成した値を入力
openssl rand -base64 32

vercel env add NEXTAUTH_URL production
# → Vercelから割り当てられたURL（例: https://clinicmark-xxx.vercel.app）

vercel env add ANTHROPIC_API_KEY production
# → AnthropicのAPIキーを入力
```

5. **本番DBにマイグレーション実行**
```bash
DATABASE_URL="[SupabaseのURL]" npx prisma migrate deploy
DATABASE_URL="[SupabaseのURL]" npx prisma db seed
```

6. **本番デプロイ**
```bash
vercel --prod
```

7. **動作確認**
- 割り当てられたURLにアクセスしてログイン画面が出ればOK
- 完了したらURLを教えてください

---

## デプロイ後にやること

### README.mdを作成（他の人への配布用）
以下の内容でREADME.mdを作成してください：

- ClinicMarkとは何か（治療院向けAIマーケティング支援ツール）
- 必要なアカウント（Vercel無料、Supabase無料、Anthropic APIキー）
- セットアップ手順（上記の手順を簡潔にまとめる）
- 費用の説明（Anthropic API利用料のみ従量課金、それ以外は無料）
- 「利用者自身がデプロイ・API費用を負担する形です」と明記

---

## トラブルシューティング

- `gh: command not found` → `brew install gh` を実行
- `vercel: command not found` → `brew install vercel-cli` を実行
- Prismaエラー → `npx prisma generate` を実行
- ビルドエラー → `vercel logs [URL]` でログ確認
