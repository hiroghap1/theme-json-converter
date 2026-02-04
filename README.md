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

## How It Works
1. Colors: Stored in variable collections named "Theme Colors"
2. Typography: Stored as text styles under "Typography/" folder
3. Spacing: Stored in variable collections named "Theme Spacing"

## Use Cases
- Design WordPress block themes in Figma with accurate design tokens
- Keep your Figma design system in sync with WordPress
- Quickly bootstrap a new theme design with default WordPress presets

## Changelog

### v1.1.0 (2026-02-04)
- エクスポート時に設定を追加（各オプションの出力有無と値を個別に設定可能に）

### v1.0.0 (2026-01-26)
- 公開