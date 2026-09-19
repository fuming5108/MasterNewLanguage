# MasterNewLanguage

フランス語の小説・記事を**原文で読めるようになる**ための語彙・読解トレーニングアプリ。
1日10分から続けられることを設計の前提にしています。

スマートフォンのブラウザから使える静的な SPA で、サーバーは不要です。
学習記録はブラウザの localStorage に保存します。

## セットアップ

```bash
npm install
npm run dev
```

## コマンド

| 目的 | コマンド |
|---|---|
| テスト | `npm test` |
| Lint | `npm run lint` |
| ビルド | `npm run build` |
| 一括検証（lint → test → build） | `npm run verify` |

## 技術スタック

Vite 8 / React 19 / TypeScript（strict）/ Vitest + Testing Library / Biome

## 開発の進め方

受け入れ基準 → Implementer → Reviewer → 反復（最大5回）→ 人間の最終判断、
というループで開発します。詳細な運用ルールは [CLAUDE.md](./CLAUDE.md) を参照してください。
