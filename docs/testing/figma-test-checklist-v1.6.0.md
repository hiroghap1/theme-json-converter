# Figma 動作確認手順書（v1.6.0）

v1.6.0 で追加・修正した機能を Figma 上で確認するための手順です。共通の準備と、v1.5.0 以前の機能の確認は [`figma-test-checklist.md`](./figma-test-checklist.md) を参照してください。

- 対象: WordPress 7.2 プリセット、テキストシャドウ（エフェクトスタイル）、`textShadow` / `defaultTextShadowPresets` / `backgroundClip`、`textIndent: false`、Version 1 / 2 の出力の絞り込み
- テスト用 theme.json: [`import-fixture.theme.json`](./import-fixture.theme.json)（`textShadowPresets` を追加済み）

---

## 0. 準備

- [ ] `npm run build` を実行し、エラーなく完了する
- [ ] Figma でプラグインを開き直す（コードを再読み込みするため）
- [ ] 新規デザインファイルを 2 つ用意する（ファイル A: 生成・エクスポート用、ファイル B: インポート用）

## 1. 生成（ファイル A / Version 3 (WordPress 7.2+)）

- [ ] 生成タブのバージョンの初期値が `Version 3 (WordPress 7.2+)` になっている
- [ ] 「作成されるもの」の最後に「テキストシャドウ（エフェクトスタイル）」が表示される
- [ ] 生成すると、完了通知の最後に「テキストシャドウ: 2個」が表示される
- [ ] ローカルスタイルのエフェクトに `Text Shadow/Light`（X 1 / Y 1 / ぼかし 2 / 黒 30%）と `Text Shadow/Strong`（X 2 / Y 2 / ぼかし 4 / 黒 50%）がある
- [ ] `Text Shadow/Light` の説明欄が次の 2 行になっている
  - `var(--wp--preset--text-shadow--light)`
  - `text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3)`
- [ ] テキストにエフェクトスタイルを適用すると、文字にシャドウが付く

## 2. エクスポート（ファイル A / Version 3 (WordPress 7.2+)）

### 2-1. 画面
- [ ] 「Typography 追加設定」に `textIndent`、`textShadow`、`defaultTextShadowPresets` がある
- [ ] `textIndent` の値に `subsequent` / `all` / `false` の 3 つがある
- [ ] 「Background設定」に `background.gradient` と `background.backgroundClip` がある
- [ ] `backgroundClip` で「値を選択」を選ぶと、`text` / `padding-box` / `border-box` / `content-box` のチェックボックスが出て、`text` にチェックが入っている
- [ ] 幅 400px の画面で、チェックボックスがはみ出さずに折り返される

### 2-2. 出力（初期値のまま）
- [ ] `$schema` が `https://schemas.wp.org/wp/7.2/theme.json`
- [ ] `settings.typography` に `textShadow: true`、`defaultTextShadowPresets: false`、`textShadowPresets`（Light / Strong）がある
- [ ] `settings.background` に `gradient: false` と `backgroundClip: false` がある

### 2-3. オプションの切り替え
- [ ] `textIndent` を `false` にすると `"textIndent": false` が出力される
- [ ] `backgroundClip` を「値を選択」にして `content-box` と `text` をチェックすると、スキーマ順の `["text", "content-box"]` が出力される
- [ ] 「値を選択」ですべてのチェックを外すと `"backgroundClip": false` が出力される
- [ ] `Version 3 (WordPress 7.1+)` に切り替えると `textShadow` / `defaultTextShadowPresets` / `backgroundClip` が画面から消え、出力にも `textShadowPresets` が含まれない

## 3. インポート（ファイル B / `import-fixture.theme.json`）

- [ ] 通知に「テキストシャドウ 4件をエフェクトスタイルにインポートしました。対応していない値の 1件をスキップ: Mixed (…)」が出る
- [ ] エフェクトスタイルに `Text Shadow/Light`、`Soft`、`Brand Glow`、`Double` がある（`Mixed` はない）
- [ ] `Soft`: X 0.8 / Y 0.8 / ぼかし 1.6（`0.05em` を 1em = 16px で換算）
- [ ] `Brand Glow`: 色が `Theme Colors` の `Brand` バリアブルに紐づいている
- [ ] `Double`: ドロップシャドウが 2 つ（白 1/1/0 と黒 50% 2/2/0）

## 4. 往復確認（ファイル B / インポート → エクスポート）

- [ ] `Version 3 (WordPress 7.2+)` でエクスポートすると、`textShadowPresets` の値がテスト用 theme.json と同じ文字列になる（`0.05em …`、`var(--wp--preset--color--brand-main)`、`rgb(0 0 0 / 50%)` がそのまま残る）
- [ ] `Text Shadow/Soft` の X を 3 に変えてエクスポートすると、`Soft` の値が `3px 0.8px 1.6px rgba(0, 0, 0, 0.3)` のように px で出力される
- [ ] `Theme Colors` の `Brand` の色を変えても、`Brand Glow` は `var(--wp--preset--color--brand-main)` のまま出力される

## 5. Version 1 / 2 の絞り込み（ファイル A）

### 5-1. エクスポート画面
- [ ] `Version 1 (WordPress 5.8+)`: 設定オプションに「このバージョンで選べる設定はありません。」とだけ表示され、スタイルバリエーションの項目もない
- [ ] `Version 2 (WordPress 5.9+)`: `appearanceTools`、`defaultPalette`、`defaultGradients` だけが表示される（`defaultDuotone`、Typography設定、Spacing設定、スタイルバリエーションはない）

### 5-2. 出力（ファイル B のように全部入りのファイルで確認）
- [ ] Version 1: `defaultPalette` などの `default*`、`fontFamilies`、`fluid` が出力されない。`Theme Colors` に Dark モードがあっても zip にならない
- [ ] Version 2: `defaultDuotone`、`defaultFontSizes`、`spacing`、`fluid` が出力されない

### 5-3. 生成
- [ ] Version 1: 「作成されるもの」にフォントファミリーとスペーシングがない。生成しても `Theme Font Families` / `Theme Spacing` は作られない
- [ ] Version 2: フォントファミリーはあり、スペーシングはない

## 6. 既存プリセットの互換性（任意）

- [ ] `Version 3 (WordPress 6.6+ / 7.0+ / 7.1+)` のエクスポート結果が v1.5.0 と同じ（テキストシャドウ関連の項目が増えていない）

---

## 確認結果・気になった点の記録欄

| 日付 | 項目 | 内容 |
|---|---|---|
|  |  |  |
