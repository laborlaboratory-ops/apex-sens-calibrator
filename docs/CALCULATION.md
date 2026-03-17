# 計算式・FOVデータ・スコープ倍率テーブル

## 基本公式

### ヒップファイアFOVの算出

```
cl_fovScale = 1 + (ゲーム内FOV値 - 70) × 0.01375
hipFOV_4:3 = 70 × cl_fovScale
```

例: FOV 104 → cl_fovScale = 1.4675 → hipFOV = 102.725°

**注意**: ゲーム内FOV「110」は実際には108.5°。この変換式自体が丸め誤差を含む。

### 各スコープのFOV算出

```
scopeFOV = hipFOV_4:3 × fovMulti
```

### 感度スケーリング（ゲームエンジン内部処理）

APEXはADS時にFocal Length Scalingを自動適用する:

```
zoomScalar = tan(hipFOV/2) / tan(scopeFOV/2)
```

デフォルト(per-optic=1.0)ではこのzoomScalarで感度が除算され、画面上のピクセル速度が揃う。
しかしゲーム世界の角速度はスコープ倍率に比例して遅くなる。

### per-optic比率の算出（リニアモード）

1倍と同じ角速度にするための比率:

```
fullRatio = tan(FOV_1x/2) / tan(FOV_scope/2)
ratio = fullRatio ^ power
```

- power=1.0: 完全な角速度統一（マウス向き）
- power=0.2: エイムアシスト考慮の緩やか補正（PADデフォルト）
- power=0.0: デフォルト（補正なし）

最終的なscalar値:
```
scalar = ユーザーの1x感度 × ratio
```

---

## スコープFOVデータ（データマイニング確認済み）

データソース: Drimzi（mouse-sensitivity.comコミュニティ、KovaaKフォーラム）

### fovMulti値

| スコープ | fovMulti | 算出方法 |
|---------|----------|---------|
| 1x (HCOG/Holo/デジスレ) | 6/7 ≈ 0.8571 | **Drimziデータマイニング確認済** |
| 2x (HCOG Bruiser) | 真倍率公式 | 2×arctan(tan(35°)/2)/70 |
| 3x (HCOG Ranger) | 真倍率公式 | 2×arctan(tan(35°)/3)/70 |
| 4x | 真倍率公式 | 2×arctan(tan(35°)/4)/70 |
| 6x Sniper | 13.3125/70 ≈ 0.1902 | **Drimziデータマイニング確認済** |
| 8x | 真倍率公式 | 2×arctan(tan(35°)/8)/70 |
| 10x Digi Sniper | 8.01/70 ≈ 0.1144 | **Drimziデータマイニング確認済** |

### 真倍率公式
```
scopeFOV = 2 × arctan(tan(baseFOV_4:3 / 2) / magnification)
fovMulti = scopeFOV / baseFOV_4:3
```
baseFOV_4:3 = 70°（cl_fovScale=1.0時）
tan(35°) ≈ 0.7002 がコード内でBASE_TAN_35として定義

### 1倍基準の実質倍率（FOV 70時）

APEXの公称倍率はヒップファイア基準。1倍スコープ自体が1.21倍ズームしているため、
1倍基準で見ると数字通りにならない。

| スコープ名 | ヒップファイアからの倍率 | 1倍基準の実質倍率 |
|-----------|---------------------|----------------|
| 1x | 1.21x | 1.00x（基準） |
| 2x | 2.00x | ≈1.65x |
| 3x | 3.00x | ≈2.48x |
| 4x | 4.00x | ≈3.30x |
| 6x | 6.00x | ≈4.95x |
| 8x | 8.00x | ≈6.60x |
| 10x | 10.00x | ≈8.25x |

### アイアンサイト

- AR/LMG/Sniper: fovMulti = 55/70 ≈ 0.7857（1xより狭い）
- SMG/SG/Pistol: fovMulti = 60/70（1xと同じ）
- RE-45: ズームなし

**本ツールではアイアンサイトを計算対象外とし、1xスコープを基準とする設計。**
cfg出力のscalar_7（アイアンサイト用）にはプリセットごとのIRON_RATIOS値を使用。

---

## FOV設定ごとのスコープFOV一覧（4:3水平）

| スコープ | FOV 70 | FOV 90 | FOV 100 | FOV 110 |
|---------|--------|--------|---------|---------|
| Hipfire | 70.0° | 90.0° | 100.0° | 108.5° |
| 1x | 60.0° | 77.1° | 85.7° | 93.0° |
| 2x | 38.6° | 49.6° | 55.1° | 59.8° |
| 3x | 26.3° | 33.8° | 37.5° | 40.7° |
| 4x | 19.9° | 25.5° | 28.4° | 30.8° |
| 6x | 13.3° | 17.1° | 19.0° | 20.6° |
| 8x | 10.0° | 12.9° | 14.3° | 15.5° |
| 10x | 8.0° | 10.3° | 11.4° | 12.4° |

---

## cm/360の計算（マウスのみ）

APEXの感度式: `Sens × Yaw = 回転角度/マウス移動量`
Yaw = 0.022°

```
実効感度 = ベース感度 × scalar / zoomScalar
cm/360 = (360 / (DPI × 実効感度 × 0.022)) × 2.54
```

---

## データソース

- Drimzi (mouse-sensitivity.com): fovMulti値のデータマイニング
  https://steamcommunity.com/app/824270/discussions/0/1778262124956492263/
- jscalc.io (Drimzi作): Apex Legends Calculator
  https://jscalc.io/embed/Q1gf45VCY4tmm2dq
- tsuiha.com: 日本語FOV/感度計算ツール
- Game*Spark: ゲーム内表記と内部データの差異検証記事
