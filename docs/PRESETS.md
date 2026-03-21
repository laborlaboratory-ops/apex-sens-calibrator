# プリセット情報・追加手順

## 現在のプリセット一覧

### リニア（計算ベース）
- **ID**: `unified`
- **方式**: FOVから数学的に算出。べき乗パラメータ(power)で強度調整可能
- **計算式**: `ratio = (tan(FOV_1x/2) / tan(FOV_scope/2)) ^ power`
- **デフォルトpower**: 0.2（PAD向き）

---

### あるた（配信者）
- **ID**: `aruta`
- **ベース設定**: PAD / FOV 110
- **データソース**: profile.cfg（本人提供）、2026年3月

---

### satuki（ZETA DIVISION）
- **ID**: `satuki`
- **ベース設定**: 4-1リニア / デッドゾーンなし / FOV 104
- **データソース**: b-gamers.net（2026年3月14日更新）
- **ソースURL**: https://b-gamers.net/apex-satuki/

---

### Lykq（らいか、元Fnatic → GROW Gaming）
- **ID**: `lykq`
- **ベース設定**: 4-1リニア / デッドゾーンなし / FOV 104
- **データソース**: fx-tencho.com（YouTube動画から記録、2024年2月時点）
- **注意**: 2024年9月以降はフルALCに移行済み。このデータは数字感度時代のもの
- **ソースURL**: https://www.fx-tencho.com/apex最強感度見つけた！/

---

### Lスターしゅんしゅん（Lしゅん）
- **ID**: `lshun`
- **ベース設定**: 4-3クラシック / デッドゾーンなし / FOV 104
- **データソース**: 本人のcfgスクリーンショット + X(@shunshun_Games)
- **ソースURL**:https://www.youtube.com/watch?v=tNCzS0h0YFY&t=1677s

---

### shiro（感度研究者）
- **ID**: `shiro`
- **ベース設定**: 3-3クラシック
- **データソース**: note.com/shiro15g（「APEXのPAD感度の裏仕様」2023年12月）
- **ソースURL**: https://note.com/shiro15g/n/n01235a262bcb

---

### Curihara（元REIGNITE/FENNEL）
- **ID**: `curihara`
- **ベース設定**: 4-3リニア / デッドゾーンなし / FOV 104
- **データソース**: b-gamers.net（2026年3月9日更新）
- **ソースURL**: https://b-gamers.net/apex-curihara/

---

### kentoboss（配信者）
- **ID**: `kentoboss`
- **ベース設定**: 4-1リニア / FOV 106

---

### デフォルト（参考用）
- **ID**: `default`
- 全スコープ 1.0。APEXの初期値。

---

## プリセット追加手順

### 1. データ収集
- 選手のスコープ別感度値（1x〜10x + アイアンサイト）を確認
- ソース（URL、日付）を記録
- ベース設定（数字感度、反応曲線、デッドゾーン）もメモ

### 2. このファイルに記録
上記フォーマットでソース情報を追加。値テーブルは不要（App.jsxが正）。

### 3. コードに追加

`src/App.jsx` の `PRESET_DATA` に追加:
```javascript
newplayer: {
  fov: 104,
  raw: { "1x": 値, "2x": 値, "3x": 値, "4x": 値, "6x": 値, "8x": 値, "10x": 値 },
  iron: アイアンサイト値
}
```

`PRESETS` 配列に追加:
```javascript
{ id: "newplayer", name: "表示名", tag: "プロ", curve: "4-1 リニア" }
```

tagの種類: `計算` / `プロ` / `配信者` / `研究者` / `参考`

---

## cfg変数とスコープの対応（PAD）

| scalar番号 | スコープ |
|-----------|---------|
| _0 | 1x / アイアンサイト(SMG,SG,Pistol) |
| _1 | 2x |
| _2 | 3x |
| _3 | 4x |
| _4 | 6x |
| _5 | 8x |
| _6 | 10x |
| _7 | アイアンサイト(AR,LMG,Sniper) |

## cfg変数とスコープの対応（マウス）

| scalar番号 | スコープ |
|-----------|---------|
| _0 | 1x |
| _1 | 2x |
| _2 | 3x |
| _3 | 4x |
| _4 | 6x |
| _5 | 8x |
| _6 | 10x |
