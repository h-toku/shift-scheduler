# Shift Scheduler (シフト管理システム)

企業・店舗・個人の階層構造に対応した、高機能なシフト作成・管理プラットフォームです。

## 概要

本プロジェクトは、複雑な店舗運営におけるシフト作成の負担を軽減し、効率的な人員配置を実現するためのアプリケーションです。企業から個人まで、それぞれのロールに最適化されたインターフェースを提供します。

## 技術スタック

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Backend/Infrastructure**: [Vercel](https://vercel.com/), [Supabase](https://supabase.com/) (Database & Auth)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Linting**: [ESLint](https://eslint.org/)

## CI/CD 開発フロー

- **プルリクエスト (PR)**:
  - 提出時に ESLint によるコード品質チェックが自動実行されます。
- **マージ (Main Branch)**:
  - マージ完了後、Vercel への自動デプロイが実行されます。
  - **Prisma** によるデータベースマイグレーション（`prisma migrate deploy` 等）が自動的に適用されます。

## 認証・権限構造

システムは **企業 ＞ 店舗 ＞ 個人** の階層で管理されます。

### ロール別権限マトリクス

| ロール | 対象範囲 | 主な権限 |
| :--- | :--- | :--- |
| **一般権限** | 個人 | シフト希望の登録・編集（本人のみ）、シフトの確認 |
| **店舗運営担当** | 店舗全員 | シフトの自動生成・手動編集（店舗スタッフ全員分） |
| **店舗責任者** | 自店舗 | 店舗設定、ユーザー管理（運営担当者以下の招待・編集・削除） |
| **企業責任者** | 全店舗 | 店舗の追加・削除、全ユーザー操作（すべてのロール対象） |

## ディレクトリ構成案

将来的な機能拡張（給与計算、BIツール等）を見据えた構成です。

```text
.
├── app/                # Next.js App Router (各画面・レイアウト)
├── components/         # UIコンポーネント
│   ├── ui/             # 汎用部品 (Button, Input等)
│   ├── common/         # プロジェクト共通コンポーネント
│   └── features/       # 各機能固有のコンポーネント (Shift, Auth等)
├── hooks/              # カスタムReactフック
├── lib/                # 共通ユーティリティ、Prisma/Supabaseクライアント
├── prisma/             # Prisma スキーマ、マイグレーションファイル
├── server/             # Server Actions, サーバー側ロジック
├── types/              # TypeScript 型定義
├── public/             # 静的バイナリファイル
└── ... (各種設定ファイル)
```

## プロジェクトロードマップ

### Phase 1: 基盤構築 (Current)
- ロール別機能・権限の設定
- シフト提出、登録、確認機能の実装
- 各種設定画面（企業・店舗・ユーザー）の構築

### Phase 2: 勤怠管理の強化
- 給与計算ロジックの実装
- リアルタイム勤怠チェック機能

### Phase 3: データ分析と最適化 (BI)
- 売上、来客数、発注コスト、人件費の統合管理
- BIツール（可視化・分析ダッシュボード）の導入

### Phase 4: 高度な自動化
- AI/アルゴリズムによるシフトの自動生成ロジックの実装
