# APEX SENS CALIBRATOR

APEX Legendsのスコープ間感度を統一・比較するためのWebツール。

## 機能

- **リニア計算**: 1倍スコープを基準に全スコープの角速度を計算（PAD/マウス対応、べき乗パラメータで強度調整）
- **プロ選手プリセット**: satuki, Lykq, Lしゅん, Curihara, shiro, あるたの感度バランスを自分の1倍感度にスケーリング
- **比較表示**: 2つのプリセット + 現在の感度を並べてグラフ比較
- **cfg出力**: PAD用/マウス用のcfgテキストをワンクリックコピー＆ダウンロード
- **設定保存**: 現在の感度設定をブラウザに保存、次回アクセス時に復元

## セットアップ

```bash
npm install
npm run dev
```

## 開発ドキュメント

- [CLAUDE.md](./CLAUDE.md) — プロジェクト全体の設計意図
- [docs/CALCULATION.md](./docs/CALCULATION.md) — 計算式・FOVデータ
- [docs/PRESETS.md](./docs/PRESETS.md) — プリセット元データ・追加手順
- [docs/AIM_ASSIST.md](./docs/AIM_ASSIST.md) — エイムアシスト調査結果

## 技術スタック

React + Recharts + Vite

## 注意

現在 `src/App.jsx` はclaude.aiのArtifactとして開発されたプロトタイプです。
Viteプロジェクトへの正式移行（CSS分離、index.html整備等）が次のステップです。
