WP theme-json Converter bridges the gap between WordPress and Figma, making it easy to sync your design tokens.

## Features

### Import
Upload a WordPress theme.json file to automatically create Figma variables and text styles. Colors from the palette are converted to color variables, and font sizes become text styles.

### Export
Generate a theme.json file from your existing Figma variables and styles. Perfect for transferring your design system to WordPress block themes.
Each setting (appearanceTools, defaultPalette, textIndent, viewport, etc.) can be included or excluded, and its value chosen, individually.

### Generate
Create a starter set of variables and styles based on theme.json schema versions:
- Version 1 (WordPress 5.8+): Basic colors and font sizes
- Version 2 (WordPress 5.9+): Colors, font sizes, and spacing
- Version 3 (WordPress 6.6+): Full-featured with accent colors, spacing, and typography
- Version 3 (WordPress 7.0+ / 7.1+): Adds dimension sizes

## How It Works
- Colors: Stored in variable collections named "Theme Colors"
- Typography: Stored as text styles under "Typography/" folder
- Spacing: Stored in variable collections named "Theme Spacing"
- Dimensions: Stored in variable collections named "Theme Dimensions" (WordPress 7.0+)

## Use Cases
- Design WordPress block themes in Figma with accurate design tokens
- Keep your Figma design system in sync with WordPress
- Quickly bootstrap a new theme design with default WordPress presets

## Changelog

### v1.3.0 (2026-09-26)
- WordPress 7.1+ 対応（theme.json は version 3 のまま、`$schema` は WordPress 7.1 用）
    - プリセットに「Version 3 (WordPress 7.1+)」を追加
    - エクスポート: `settings.dimensions.minWidth` を追加
    - エクスポート: `settings.background.gradient`、`settings.blockVisibility.allowEditing` を追加
    - エクスポート: `settings.viewport`（`mobile` / `tablet` のブレークポイント。`px` / `em` / `rem` で指定）を追加

### v1.2.0 (2026-04-19)
- WordPress 7.0+ 対応（theme.json v3 の新機能）
    - エクスポート: `settings.typography.textIndent`（`subsequent` / `all`）、`settings.dimensions.width`、`settings.dimensions.height` を追加
    - エクスポート/生成: `settings.dimensions.dimensionSizes` に対応（Figma の `Theme Dimensions` バリアブルコレクションと相互変換）

### v1.1.0 (2026-02-04)
- エクスポート時に設定を追加（各オプションの出力有無と値を個別に設定可能に）

### v1.0.0 (2026-01-26)
- 公開
