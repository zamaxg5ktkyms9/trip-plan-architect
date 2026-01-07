This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## プロジェクト概要

このアプリケーションは、旅行プランを自動生成するためのツールです。ユーザーの指定した条件に基づいて、最適な旅行プランを生成し、視覚的に表示します。

## 技術スタック

- **Next.js**: Reactベースのフレームワークで、サーバーサイドレンダリングや静的サイト生成をサポートします。
- **Vercel**: Next.jsアプリケーションのホスティングプラットフォーム。
- **OpenAI API**: 自然言語処理を利用して、旅行プランを生成します。
- **Unsplash API**: 高品質な画像を取得するために使用します。
- **Redis**: データのキャッシュやセッション管理に使用します。

## セットアップ手順

1. リポジトリをクローンします。
2. 必要なパッケージをインストールします。

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. 開発サーバーを起動します。

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. ブラウザで [http://localhost:3000](http://localhost:3000) を開いて結果を確認します。

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
