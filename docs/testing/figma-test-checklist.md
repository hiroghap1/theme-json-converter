# Figma 動作確認手順書（v1.3.0）

v1.2.0〜v1.3.0 で追加・修正した機能を Figma 上で確認するための手順です。
上から順に進めると、生成 → エクスポート → スタイルバリエーション → インポート → 往復（インポート→エクスポート）の順に一通り確認できます。

- 対象: WordPress 7.1 プリセット、viewport / background / blockVisibility / minWidth、レイアウト幅・フォントファミリー・角丸・ビューポートのバリアブル、デュオトーン、スタイルバリエーション、可変フォントサイズ、スラッグ保持、フォントサイズ取り込みの修正
- テスト用 theme.json: [`import-fixture.theme.json`](./import-fixture.theme.json)

---

## 0. 準備

- [ ] `npm run build` を実行し、エラーなく完了する
- [ ] Figma デスクトップアプリで **Plugins → Development → Import plugin from manifest…** から `manifest.json` を読み込む（読み込み済みなら不要）
- [ ] **Plugins → Development → Show/Hide console** でコンソールを開いておく（以降、エラーが出ていないかを随時確認）
- [ ] 確認用に **新規デザインファイルを 2 つ** 用意する
  - ファイル A: 生成・エクスポート・スタイルバリエーション用
  - ファイル B: インポート・往復確認用

> **プランについて**: 可変フォントサイズとスタイルバリエーションは、バリアブルの「モード」を使います。モードを追加できないプランのファイルでは、7章の手順で「スキップされること」を確認します。

---

## 1. 生成（ファイル A / Version 3 (WordPress 7.1+)）

プラグインを開き、**生成** タブで `Version 3 (WordPress 7.1+)` を選択。

- [ ] 「作成されるもの」に以下がすべて表示される
  - カラーパレット / デュオトーン / フォントサイズ / 可変フォントサイズ Desktop / Mobile / フォントファミリー / スペーシング / レイアウト幅 / 角丸 / ディメンション / ビューポート
- [ ] **Figmaにスタイルを生成** を押すと、完了通知にカラー・デュオトーン・フォント（可変サイズ）・フォントファミリー・スペーシング・ディメンション・レイアウト・角丸・ビューポートの件数が出る
- [ ] コンソールにエラーが出ていない

### 1-1. 作成されたコレクション（ローカルバリアブル画面）

| コレクション | 期待する中身 |
|---|---|
| [ ] `Theme Colors (v3-wp7.1)` | Base / Contrast / Accent 1〜5 |
| [ ] `Theme Duotone (v3-wp7.1)` | `Grayscale/shadow`→Contrast、`Grayscale/highlight`→Base、`Accent/shadow`→Accent 3、`Accent/highlight`→Accent 1（いずれも **参照（エイリアス）** になっている） |
| [ ] `Theme Font Sizes (v3-wp7.1)` | モードが **Desktop / Mobile** の 2 つ。値は Desktop/Mobile の順で Small 14/14、Medium 16/16、Large 20/18、X-Large 28/22、XX-Large 36/26 |
| [ ] `Theme Font Families (v3-wp7.1)` | Manrope（説明欄 `Manrope, sans-serif`）、Fira Code（説明欄 `"Fira Code", monospace`） |
| [ ] `Theme Spacing (v3-wp7.1)` | Tiny 10 〜 XX-Large 100（7 個） |
| [ ] `Theme Layout (v3-wp7.1)` | contentSize 645、wideSize 1340 |
| [ ] `Theme Radius (v3-wp7.1)` | Small 4、Medium 8、Large 16 |
| [ ] `Theme Dimensions (v3-wp7.1)` | Small 240、Medium 480、Large 720 |
| [ ] `Theme Viewport (v3-wp7.1)` | mobile 480、tablet 782 |

### 1-2. コードシンタックス（スラッグの保持）

バリアブルを選択 → 編集パネルの **Code syntax → Web** を確認。

- [ ] Base: `var(--wp--preset--color--base)`
- [ ] Grayscale/shadow: `var(--wp--preset--duotone--grayscale)`
- [ ] Tiny（Spacing）: `var(--wp--preset--spacing--20)` ← 名前と異なるスラッグ
- [ ] Fira Code: `var(--wp--preset--font-family--fira-code)`
- [ ] Small（Radius）: `var(--wp--preset--border-radius--small)`
- [ ] Small（Dimensions）: `var(--wp--preset--dimension--small)`

### 1-3. テキストスタイル

- [ ] `Typography/` 以下に Small / Medium / Large / X-Large / XX-Large がある
- [ ] 各スタイルの説明欄に `var(--wp--preset--font-size--<slug>)` が入っている
- [ ] 5 つすべてのフォントサイズが `Theme Font Sizes` のバリアブルに割り当てられている（サイズ欄にバリアブルのアイコン）
- [ ] サイズが Desktop の値（14 / 16 / 20 / 28 / 36）で表示されている

### 1-4. 再生成（上書き）の確認

- [ ] いずれかのテキストスタイルの説明欄に任意の文章（例: `見出し用`）を追記してから、もう一度生成する
- [ ] 追記した文章が残り、`var(--wp--preset--font-size--…)` の行だけが 1 行のまま（重複しない）
- [ ] 完了通知の件数が 0 個・0組になる（既存のものは作り直されない）。「可変サイズ: 5個」だけは割り当て直した数なので 5 のまま

### 1-5. 他のプリセットでの生成（任意）

同じファイルで続けて生成すると別名のコレクションが増えるだけなので、確認後は削除して構いません。

- [ ] `Version 3 (WordPress 7.0+)`: 角丸・ディメンションあり、**ビューポートなし**
- [ ] `Version 3 (WordPress 6.6+)`: 角丸・ディメンション・ビューポート **なし**、可変フォントサイズあり
- [ ] `Version 2 (WordPress 5.9+)`: 可変フォントサイズ **なし**、デュオトーンは Grayscale / Primary

---

## 2. エクスポート（ファイル A）

**エクスポート** タブで `Version 3 (WordPress 7.1+)` を選択。オプションは初期値のまま **theme.json をダウンロード**。

> 1-5 で他のプリセットも生成した場合は、`(v3-wp7.1)` 以外のコレクションを削除してから行ってください（同じスラッグは先に見つかったものが優先されます）。

### 2-1. 画面

- [ ] 「Dimensions設定」に width / height に加えて **minWidth** が表示される
- [ ] 「Background設定」「Block Visibility設定」「Viewport設定」が表示される
- [ ] Viewport の mobile / tablet の選択欄で、`Theme Viewport (v3-wp7.1) / mobile (480px)` などが **最初から選択されている**
- [ ] 一番下に「スタイルバリエーション」のチェックがある

### 2-2. 出力された theme.json

| 項目 | 期待値 |
|---|---|
| [ ] `$schema` / `version` | `https://schemas.wp.org/wp/7.1/theme.json` / `3` |
| [ ] `settings.color.palette` | base / contrast / accent-1〜5 |
| [ ] `settings.color.duotone` | `grayscale`: `["#111111", "#ffffff"]`、`accent`: `["#503aa8", "#ffee58"]` |
| [ ] `settings.typography.fontSizes` | small 14px / medium 16px / large は `size: "20px"` + `fluid: { min: "18px", max: "20px" }`、x-large・xx-large も同様 |
| [ ] `settings.typography.fluid` | `true`（自動付与） |
| [ ] `settings.typography.fontFamilies` | manrope: `Manrope, sans-serif`、fira-code: `"Fira Code", monospace` |
| [ ] `settings.typography.textIndent` | `subsequent` |
| [ ] `settings.spacing.spacingSizes` | slug が `20`〜`80`（`tiny` などになっていない） |
| [ ] `settings.layout` | `contentSize: "645px"`, `wideSize: "1340px"` |
| [ ] `settings.border.radiusSizes` | small 4px / medium 8px / large 16px |
| [ ] `settings.dimensions` | `width`, `height`, `minWidth`（すべて false）、`dimensionSizes` 3 件 |
| [ ] `settings.background` | `{ "gradient": false }` |
| [ ] `settings.blockVisibility` | `{ "allowEditing": true }` |
| [ ] `settings.viewport` | `{ "mobile": "480px", "tablet": "782px" }` |

### 2-3. オプションの切り替え

- [ ] `Theme Viewport` の mobile を 500 に変更 → エクスポートタブを開き直してエクスポート → `mobile: "500px"`
- [ ] Viewport の mobile を **自由入力** に切り替え、`30em` を入力 → `mobile: "30em"`
- [ ] 自由入力に `abc` を入力 → 入力欄の枠が赤くなり、出力から `mobile` が消える（tablet のみ出力）
- [ ] 「viewport を出力」「background.gradient を出力」「blockVisibility.allowEditing を出力」「minWidth を出力」をそれぞれ外す → 該当項目が出力されない
- [ ] プリセットを `Version 3 (WordPress 7.0+)` に変更 → 7.1 用の設定欄が消え、出力にも `viewport` / `background` / `blockVisibility` / `minWidth` が含まれない。`$schema` が 7.0 になる
- [ ] プリセットを `Version 3 (WordPress 6.6+)` に変更 → `border.radiusSizes` と `dimensions` が出力されない

### 2-4. テキストスタイルの対象範囲（修正 4 の確認）

- [ ] `Body/Bold` という名前のテキストスタイルを作ってエクスポート → `fontSizes` に **含まれない**
- [ ] `Typography/Caption`（説明欄なし）を作ってエクスポート → `slug: "caption"` として含まれる（説明欄がない場合は名前からスラッグを作る）

---

## 3. スタイルバリエーション（ファイル A）

- [ ] `Theme Colors (v3-wp7.1)` にモード **Dark** を追加し、Base を `#111111`、Contrast を `#FFFFFF` に変更
- [ ] エクスポート → **`theme-json.zip`** がダウンロードされ、完了メッセージに「スタイルバリエーション 1件」と出る
- [ ] zip を展開すると `theme.json` と `styles/dark.json` がある
- [ ] `styles/dark.json` の中身
  - `title: "Dark"`、`$schema` と `version` が theme.json と同じ
  - `settings.color.palette` の base が `#111111`、contrast が `#ffffff`（他の色は Mode 1 と同じ値で全色入っている）
  - `settings.color.duotone` があり、grayscale が `["#ffffff", "#111111"]`（Dark モードの色を参照）
- [ ] `theme.json` 側の palette / duotone は Mode 1 の値のまま
- [ ] もう一つモード **ダーク** を追加してエクスポート → `styles/variation-2.json` が作られ、`title: "ダーク"`（英数字以外のモード名は「variation-<2つ目以降のモードの通し番号>」）
- [ ] 「スタイルバリエーション」のチェックを外してエクスポート → `theme.json` 単体でダウンロードされる

---

## 4. インポート（ファイル B / `import-fixture.theme.json`）

**インポート** タブで [`import-fixture.theme.json`](./import-fixture.theme.json) を読み込む。

### 4-1. 通知

- [ ] フォントサイズについて「Skipped 1 sizes with unsupported units: Hero (4vw)」と表示される（**修正 3 の確認**）
  - この後に余白などの通知と「Theme imported successfully!」が続くため、置き換わって見えない場合があります。見えなかった場合は下の記録欄に残してください
- [ ] コンソールにエラーが出ていない

### 4-2. 取り込まれた内容

| コレクション / スタイル | 期待する中身 | 取り込まれないもの |
|---|---|---|
| [ ] `Theme Colors` | Base / Contrast / Brand（#0073AA）/ Short Hex（#FF6600） | Translucent（rgba） |
| [ ] `Theme Duotone` | `Mono/shadow`→**Contrast を参照**、`Mono/highlight`→**Base を参照**、`Sunset/*` は色を直接指定 | — |
| [ ] `Typography/` | Small 14 / Medium 16 / Large 24 / Huge 48 | Hero（4vw） |
| [ ] `Theme Font Sizes` | モード Desktop / Mobile。Large 24/20、Huge 48/32。Large・Huge のテキストスタイルに割り当て済み | Small / Medium（fluid なし） |
| [ ] `Theme Font Families` | Body Font = `Noto Sans JP`（説明欄 `"Noto Sans JP", sans-serif`）、Code = `ui-monospace` | — |
| [ ] `Theme Spacing` | Tiny 10、Small 20（1.25rem → 20） | Fluid（clamp） |
| [ ] `Theme Dimensions` | Card Width 320 | — |
| [ ] `Theme Layout` | contentSize 645 | wideSize（min()） |
| [ ] `Theme Radius` | Small Radius 4、Pill 9999 | — |
| [ ] `Theme Viewport` | mobile 600 | tablet（60em） |

- [ ] Brand の Code syntax が `var(--wp--preset--color--brand-main)`
- [ ] Tiny の Code syntax が `var(--wp--preset--spacing--20)`
- [ ] Small Radius の Code syntax が `var(--wp--preset--border-radius--sm)`
- [ ] Mono/shadow の Code syntax が `var(--wp--preset--duotone--mono)`
- [ ] Typography/Large の説明欄が `var(--wp--preset--font-size--large)`

### 4-3. 再インポート

- [ ] 同じファイルをもう一度インポート → バリアブルやスタイルが重複せず、値が上書きされる

---

## 5. 往復確認（ファイル B / インポート → エクスポート）

4 章の状態のまま、**エクスポート** タブで `Version 3 (WordPress 7.1+)` を選んでエクスポート。

- [ ] palette の slug が `base` / `contrast` / **`brand-main`** / **`short-hex`**（名前ではなく元のスラッグ）
- [ ] duotone が `mono: ["#111111", "#ffffff"]`、`sunset: ["#8c00b7", "#fcff41"]`
- [ ] fontFamilies が `body: "\"Noto Sans JP\", sans-serif"`、`code: "ui-monospace, monospace"`（元の指定に戻る）
- [ ] fontSizes が small 14px / medium 16px / large 24px（fluid 20px〜24px）/ huge 48px（fluid 32px〜48px）、`typography.fluid: true`
- [ ] spacingSizes の slug が **`20` / `30`**
- [ ] dimensionSizes の slug が `card`、radiusSizes の slug が **`sm`** / `pill`
- [ ] layout が `contentSize: "645px"` のみ
- [ ] viewport が `mobile: "600px"`（`Theme Viewport / mobile` が自動選択）、`tablet: "782px"`（自由入力の初期値）

> 取り込めなかった値（rgba、4vw、clamp()、min()、em）は往復後に消えるのが仕様です。

---

## 6. 既存ファイルとの互換性（任意）

v1.2.0 以前に作ったファイル（コードシンタックスや説明欄にスラッグがないもの）がある場合:

- [ ] エクスポートすると、これまで通り名前からスラッグが作られる（例: `Accent 1` → `accent-1`）
- [ ] エラーにならない

---

## 7. モードが使えない場合（該当プランのファイルがある場合のみ）

- [ ] 生成 → 完了通知に「可変サイズはモードが使えないためスキップ」と出て、他の生成は完了している
- [ ] インポート → 「fluid sizes were skipped」の旨が通知され、フォントサイズ自体は取り込まれている

---

## 既知の制限・気になった点の記録欄

- インポート時の「Imported N colors」の件数は、取り込めなかった色（rgba など）も含めた件数で表示される（既存の挙動）
- `styles/*.json` や zip のインポートには未対応
- インポートの通知は項目ごとに順番に出るため、フォントサイズのスキップ通知が後続の通知に置き換わる可能性がある（4-1 で要確認）

| # | 手順 | 事象 | メモ |
|---|---|---|---|
|  |  |  |  |
