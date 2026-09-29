# WP theme-json Converter

Convert WordPress theme.json to Figma variables/styles and vice versa. Import, export, and generate.

---

WP theme-json Converter bridges the gap between WordPress and Figma, making it easy to sync your design tokens.

## Features
Import
Upload a WordPress theme.json file to automatically create Figma variables and text styles. Colors from the palette are converted to color variables, and font sizes become text styles.

Export
Generate a theme.json file from your existing Figma variables and styles. Perfect for transferring your design system to WordPress block themes.

Generate
Create a starter set of variables and styles based on theme.json schema versions:
- Version 1 (WordPress 5.8+): Basic colors and font sizes
- Version 2 (WordPress 5.9+): Colors, font sizes, and spacing
- Version 3 (WordPress 6.6+): Full-featured with accent colors, spacing, and typography
- Version 3 (WordPress 7.0+ / 7.1+): Adds border radius and dimension sizes, plus viewport breakpoints on 7.1+ (theme.json schema version is still 3)
- Every version also creates font families, layout widths (contentSize / wideSize) and duotone pairs referencing the palette
- Version 3 also creates fluid font sizes (Desktop / Mobile modes)

## How It Works
1. Colors: Stored in variable collections named "Theme Colors"
2. Typography: Stored as text styles under "Typography/" folder
3. Spacing: Stored in variable collections named "Theme Spacing"
4. Font Families: Stored as string variables in collections named "Theme Font Families"
5. Layout: contentSize / wideSize stored in collections named "Theme Layout"
6. Border Radius: Stored in collections named "Theme Radius" (WordPress 6.9+)
7. Dimensions: Stored in collections named "Theme Dimensions" (WordPress 7.0+)
8. Viewport: mobile / tablet stored in collections named "Theme Viewport" (WordPress 7.1+)
9. Duotone: "<name>/shadow" and "<name>/highlight" color variables in collections named "Theme Duotone"
10. Fluid Font Sizes: Text style font sizes bound to "Theme Font Sizes" variables with Desktop / Mobile modes
11. Style Variations: Extra modes of "Theme Colors" are exported as styles/*.json

## Use Cases
- Design WordPress block themes in Figma with accurate design tokens
- Keep your Figma design system in sync with WordPress
- Quickly bootstrap a new theme design with default WordPress presets

## Changelog

### v1.3.0 (2026-09-26)
- WordPress 7.1+ プリセットを追加（theme.json スキーマは引き続き version 3、`$schema` は `https://schemas.wp.org/wp/7.1/theme.json`）
    - エクスポート: `settings.dimensions.minWidth` を追加（WordPress 7.1+ 選択時のみ）
    - エクスポート: `settings.background.gradient`、`settings.blockVisibility.allowEditing`、`settings.viewport`（`mobile` / `tablet`、`px` / `em` / `rem`）を追加（WordPress 7.1+ 選択時のみ）
    - 生成/インポート/エクスポート: 以下を Figma バリアブルと相互変換（インポートは `px` の値のみ）
        - `settings.layout.contentSize` / `wideSize` ⇔ `Theme Layout` コレクション（`contentSize` / `wideSize`）
        - `settings.typography.fontFamilies` ⇔ `Theme Font Families` コレクション（文字列バリアブル。フォールバックを含む CSS 指定は説明欄に保持）
        - `settings.border.radiusSizes` ⇔ `Theme Radius` コレクション（WordPress 6.9+ / 7.0+ プリセット以降）
        - `settings.viewport` ⇔ `Theme Viewport` コレクション（`mobile` / `tablet`、WordPress 7.1+）
    - エクスポート: `viewport` の値を「自由入力」か `Theme Viewport` のバリアブルから選択可能に
    - インポート: `settings.spacing.spacingSizes`（`Theme Spacing`）、`settings.dimensions.dimensionSizes`（`Theme Dimensions`）の取り込みに対応（`px` / `rem`（16px換算）の値のみ）
    - 生成/インポート: 各プリセットのスラッグを保持し、エクスポート時に復元するように（名前とスラッグが異なるプリセットも正しく往復）
        - カラー・フォントファミリー・スペーシング・角丸・ディメンション: バリアブルの WEB コードシンタックスに設定（例: `var(--wp--preset--spacing--20)`）
        - フォントサイズ: テキストスタイルの説明欄に追記（例: `var(--wp--preset--font-size--medium)`。既存の説明文は残す）
    - デュオトーン（`settings.color.duotone`）⇔ `Theme Duotone` コレクション（`<名前>/shadow` と `<名前>/highlight` のカラーバリアブルの組。`Theme Colors` のバリアブルを参照可能）
    - スタイルバリエーション: `Theme Colors` の2つ目以降のモードを `styles/<モード名>.json` として出力（theme.json と合わせて zip でダウンロード）
    - 可変フォントサイズ（`fontSizes[].fluid`）⇔ `Theme Font Sizes` コレクション（Desktop / Mobile の2モード。テキストスタイルのフォントサイズをバリアブルに割り当て、エクスポート時に `settings.typography.fluid: true` を自動設定）
- 修正
    - インポート: フォントサイズの単位判定を修正（`2vw` や `1.5em` などが単位を無視して px として取り込まれていた問題。`px` / `rem` のみ取り込み、`size` が `clamp()` 等でも `fluid.max` が `px` / `rem` ならその値を使用。取り込めなかった項目は通知に表示）
    - エクスポート: フォントサイズとして出力するテキストスタイルを `Typography/` 以下に限定（`Body/Bold` など他のスタイルが混ざらないように）

### v1.2.0 (2026-04-19)
- WordPress 7.0+ 対応（theme.json v3 の新機能）
    - エクスポート: `settings.typography.textIndent`（`subsequent` / `all`）、`settings.dimensions.width`、`settings.dimensions.height` を追加
    - エクスポート/生成: `settings.dimensions.dimensionSizes` に対応（Figma の `Theme Dimensions` バリアブルコレクションと相互変換）

### v1.1.0 (2026-02-04)
- エクスポート時に設定を追加（各オプションの出力有無と値を個別に設定可能に）

### v1.0.0 (2026-01-26)
- 公開