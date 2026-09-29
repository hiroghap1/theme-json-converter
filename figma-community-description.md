WP theme-json Converter bridges the gap between WordPress and Figma, making it easy to sync your design tokens.

## Features

### Import
Upload (or drag and drop) a WordPress theme.json file to automatically create Figma variables and text styles. Colors, duotone, spacing, dimensions, layout widths, font families, border radius and viewport become variables, and font sizes become text styles (fluid sizes are bound to Desktop / Mobile variables).

### Export
Generate a theme.json file from your existing Figma variables and styles. Perfect for transferring your design system to WordPress block themes.
Each setting (appearanceTools, defaultPalette, textIndent, viewport, etc.) can be included or excluded, and its value chosen, individually.
Extra modes of your "Theme Colors" collection (e.g. Dark) are exported as style variations (styles/*.json) in a zip.

### Generate
Create a starter set of variables and styles based on theme.json schema versions:
- Version 1 (WordPress 5.8+): Basic colors and font sizes
- Version 2 (WordPress 5.9+): Colors, font sizes, and spacing
- Version 3 (WordPress 6.6+): Full-featured with accent colors, spacing, and typography
- Version 3 (WordPress 7.0+ / 7.1+): Adds border radius and dimension sizes, plus viewport breakpoints on 7.1+
- Every version also creates font families, layout widths (contentSize / wideSize) and duotone pairs referencing the palette
- Version 3 also creates fluid font sizes (Desktop / Mobile modes)

## How It Works
- Colors: Stored in variable collections named "Theme Colors"
- Typography: Stored as text styles under "Typography/" folder
- Spacing: Stored in variable collections named "Theme Spacing"
- Font Families: Stored as string variables in collections named "Theme Font Families"
- Layout: contentSize / wideSize stored in collections named "Theme Layout"
- Border Radius: Stored in collections named "Theme Radius" (WordPress 6.9+)
- Dimensions: Stored in variable collections named "Theme Dimensions" (WordPress 7.0+)
- Viewport: mobile / tablet stored in collections named "Theme Viewport" (WordPress 7.1+)
- Duotone: "<name>/shadow" and "<name>/highlight" color variables in collections named "Theme Duotone"
- Fluid Font Sizes: Text style font sizes bound to "Theme Font Sizes" variables with Desktop / Mobile modes
- Style Variations: Extra modes of "Theme Colors" are exported as styles/*.json

## Use Cases
- Design WordPress block themes in Figma with accurate design tokens
- Keep your Figma design system in sync with WordPress
- Quickly bootstrap a new theme design with default WordPress presets

## Changelog

### v1.3.0 (2026-09-30)
- WordPress 7.1 対応（theme.json は version 3 のまま、`$schema` は WordPress 7.1 用）
    - プリセットに「Version 3 (WordPress 7.1+)」を追加し、最新のプリセットを初期値に
    - エクスポート: `settings.dimensions.minWidth`、`settings.background.gradient`、`settings.blockVisibility.allowEditing`、`settings.viewport`（`mobile` / `tablet`）を追加
    - エクスポート: `viewport` の値を「自由入力」か `Theme Viewport` のバリアブルから選択可能に
- Figma バリアブルとの相互変換を追加（生成・インポート・エクスポート）
    - レイアウト幅 `settings.layout.contentSize` / `wideSize` ⇔ `Theme Layout`
    - フォントファミリー `settings.typography.fontFamilies` ⇔ `Theme Font Families`（文字列バリアブル。フォールバックを含む指定は説明欄に保持）
    - 角丸 `settings.border.radiusSizes` ⇔ `Theme Radius`（WordPress 6.9+）
    - ビューポート `settings.viewport` ⇔ `Theme Viewport`（WordPress 7.1+）
    - デュオトーン `settings.color.duotone` ⇔ `Theme Duotone`（`<名前>/shadow` と `<名前>/highlight` の組。パレットの色を参照可能）
    - 可変フォントサイズ `fontSizes[].fluid` ⇔ `Theme Font Sizes`（Desktop / Mobile の2モード。エクスポート時に `settings.typography.fluid: true` を自動設定）
    - インポート: スペーシング（`Theme Spacing`）とディメンション（`Theme Dimensions`）の取り込みに対応
- スタイルバリエーションの出力に対応
    - `Theme Colors` の2つ目以降のモード（Dark など）を `styles/<モード名>.json` として出力し、theme.json と合わせて zip でダウンロード
- スラッグの保持
    - 各プリセットのスラッグ（例: `spacing--20`）を Figma 側に保持し、名前とスラッグが異なるプリセットもエクスポートで元のスラッグに戻るように
    - バリアブルは WEB コードシンタックス（例: `var(--wp--preset--spacing--20)`）、テキストスタイルは説明欄に保存
- 改善
    - インポートでドラッグ＆ドロップに対応、同じファイルの再選択でも読み込めるように
    - 生成・インポートの完了やエラーを画面下のステータスに表示、タブ切り替えで表示をクリア
- 修正
    - インポート: フォントサイズの単位判定を修正（`2vw` や `1.5em` が px として取り込まれていた問題。`px` / `rem` のみ取り込み、取り込めなかった項目は通知に表示）
    - エクスポート: フォントサイズとして出力するテキストスタイルを `Typography/` 以下に限定
    - 環境によってプラグインが起動しない問題（`stack underflow`）を修正

### v1.2.0 (2026-04-19)
- WordPress 7.0+ 対応（theme.json v3 の新機能）
    - エクスポート: `settings.typography.textIndent`（`subsequent` / `all`）、`settings.dimensions.width`、`settings.dimensions.height` を追加
    - エクスポート/生成: `settings.dimensions.dimensionSizes` に対応（Figma の `Theme Dimensions` バリアブルコレクションと相互変換）

### v1.1.0 (2026-02-04)
- エクスポート時に設定を追加（各オプションの出力有無と値を個別に設定可能に）

### v1.0.0 (2026-01-26)
- 公開
