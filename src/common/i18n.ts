// UI texts and notifications in each language. Japanese is the source; `en` must have the same keys (checked by the type)
export type Lang = 'ja' | 'en';

export const LANGS: { id: Lang; label: string }[] = [
    { id: 'ja', label: '日本語' },
    { id: 'en', label: 'English' },
];

export const isLang = (value: unknown): value is Lang => value === 'ja' || value === 'en';

// Plugin UI language when the user has not chosen one: Japanese for a Japanese browser / app, otherwise English
export const detectLang = (language: string): Lang => (/^ja\b/i.test(language) ? 'ja' : 'en');

// Counts in the generate result. Optional parts are left out when the preset does not create them
interface GenerateCounts {
    colors: number;
    duotone: number;
    fontSizes: number;
    fluidBound: number;
    fluidUnavailable: boolean;
    fontFamilies: number;
    spacing: number;
    dimensions?: number;
    layout: number;
    radius?: number;
    viewport?: number;
}

const ja = {
    // Tabs
    tabImport: 'インポート',
    tabExport: 'エクスポート',
    tabGenerate: '生成',
    languageLabel: '表示言語',

    // Import
    importTitle: 'theme.json をインポート',
    importDescription: 'theme.jsonファイルをアップロードして、Figmaのバリアブルとスタイルを作成します。',
    uploadText: 'クリックしてファイルを選択',
    uploadHint: 'または、ここにドロップ',
    importing: 'インポートを実行中...',
    invalidJson: 'エラー: 無効なJSONファイルです',
    dropJsonOnly: 'エラー: .json ファイルをドロップしてください',

    // Export
    exportTitle: 'theme.json をエクスポート',
    exportDescription: 'Figmaの現在のバリアブルとスタイルからtheme.jsonを生成してダウンロードします。',
    versionLabel: 'theme.jsonバージョン:',
    optionsTitle: '設定オプション:',
    groupColor: 'Color設定:',
    groupTypography: 'Typography設定:',
    groupSpacing: 'Spacing設定:',
    groupTypographyExtra: 'Typography 追加設定 (WordPress 7.0+):',
    groupDimensions: 'Dimensions設定 (WordPress 7.0+):',
    groupBackground: 'Background設定 (WordPress 7.1+):',
    groupBlockVisibility: 'Block Visibility設定 (WordPress 7.1+):',
    groupViewport: 'Viewport設定 (WordPress 7.1+):',
    groupStyleVariations: 'スタイルバリエーション:',
    includeOption: (key: string) => `${key} を出力`,
    freeInput: '自由入力',
    styleVariationsLabel: 'Theme Colors の2つ目以降のモードを styles/*.json として出力',
    styleVariationsHint: 'バリエーションがある場合は theme.json と合わせて zip でダウンロードします。',
    downloadButton: 'theme.json をダウンロード',
    exporting: 'エクスポート中...',
    exportDone: (variations: number) => variations > 0
        ? `エクスポート完了！（theme.json + スタイルバリエーション ${variations}件）`
        : 'エクスポート完了！',

    // Generate
    generateTitle: 'テンプレートから生成',
    generateDescription: 'theme.jsonのバージョンを選択して、デフォルトのスタイルとバリアブルをFigmaに作成します。',
    generateListTitle: '作成されるもの:',
    generateItemColors: 'カラーパレット（バリアブル）',
    generateItemDuotone: 'デュオトーン（カラーを参照するバリアブル）',
    generateItemFontSizes: 'フォントサイズ（テキストスタイル）',
    generateItemFluid: '可変フォントサイズ Desktop / Mobile（バリアブル）',
    generateItemFontFamilies: 'フォントファミリー（バリアブル）',
    generateItemSpacing: 'スペーシング（バリアブル）',
    generateItemLayout: 'レイアウト幅 contentSize / wideSize（バリアブル）',
    generateItemRadius: '角丸（バリアブル）',
    generateItemDimensions: 'ディメンション（バリアブル）',
    generateItemViewport: 'ビューポート mobile / tablet（バリアブル）',
    generateButton: 'Figmaにスタイルを生成',
    generating: (preset: string) => `${preset} でスタイルを生成中...`,

    // Notifications from the plugin code
    importedColors: (count: number) => `カラー ${count}個をバリアブルにインポートしました。`,
    skippedFontSizes: (items: string[]) => `対応していない単位の ${items.length}件をスキップ: ${items.join(', ')}`,
    skippedFluid: (count: number) => `可変サイズ ${count}件をスキップ（このプランではバリアブルのモードを使えません）`,
    importedFontSizes: (notes: string[]) => notes.length > 0
        ? `フォントサイズをインポートしました。${notes.join('。')}。`
        : 'フォントサイズをインポートしました。',
    importedSizes: (presetType: 'spacing' | 'dimension', imported: number, total: number) =>
        `${presetType === 'spacing' ? 'スペーシング' : 'ディメンション'} ${total}件中 ${imported}件をインポートしました。`,
    importDone: 'インポート完了！',
    importFailed: (error: string) => `エラー: インポートに失敗しました（${error}）`,
    exported: (preset: string, variations: number) => variations > 0
        ? `${preset} の theme.json とスタイルバリエーション ${variations}件をエクスポートしました！`
        : `${preset} の theme.json をエクスポートしました！`,
    exportFailed: (error: string) => `エラー: エクスポートに失敗しました（${error}）`,
    generated: (c: GenerateCounts) => {
        const fluid = c.fluidBound > 0 ? `（可変サイズ: ${c.fluidBound}個）` : (c.fluidUnavailable ? '（可変サイズはモードが使えないためスキップ）' : '');
        return `生成完了！ カラー: ${c.colors}個, デュオトーン: ${c.duotone}組, フォント: ${c.fontSizes}個${fluid}, フォントファミリー: ${c.fontFamilies}個, スペーシング: ${c.spacing}個`
            + (c.dimensions !== undefined ? `, ディメンション: ${c.dimensions}個` : '')
            + `, レイアウト: ${c.layout}個`
            + (c.radius !== undefined ? `, 角丸: ${c.radius}個` : '')
            + (c.viewport !== undefined ? `, ビューポート: ${c.viewport}個` : '');
    },
    generateFailed: (error: string) => `エラー: 生成に失敗しました（${error}）`,
};

export type Messages = typeof ja;

const en: Messages = {
    // Tabs
    tabImport: 'Import',
    tabExport: 'Export',
    tabGenerate: 'Generate',
    languageLabel: 'Language',

    // Import
    importTitle: 'Import theme.json',
    importDescription: 'Upload a theme.json file to create Figma variables and styles.',
    uploadText: 'Click to choose a file',
    uploadHint: 'or drop it here',
    importing: 'Importing...',
    invalidJson: 'Error: Invalid JSON file',
    dropJsonOnly: 'Error: Please drop a .json file',

    // Export
    exportTitle: 'Export theme.json',
    exportDescription: 'Generate a theme.json from the current Figma variables and styles, and download it.',
    versionLabel: 'theme.json version:',
    optionsTitle: 'Options:',
    groupColor: 'Color:',
    groupTypography: 'Typography:',
    groupSpacing: 'Spacing:',
    groupTypographyExtra: 'More Typography (WordPress 7.0+):',
    groupDimensions: 'Dimensions (WordPress 7.0+):',
    groupBackground: 'Background (WordPress 7.1+):',
    groupBlockVisibility: 'Block Visibility (WordPress 7.1+):',
    groupViewport: 'Viewport (WordPress 7.1+):',
    groupStyleVariations: 'Style Variations:',
    includeOption: (key: string) => `Include ${key}`,
    freeInput: 'Custom value',
    styleVariationsLabel: 'Export additional Theme Colors modes as styles/*.json',
    styleVariationsHint: 'When there are variations, they are downloaded as a zip together with theme.json.',
    downloadButton: 'Download theme.json',
    exporting: 'Exporting...',
    exportDone: (variations: number) => variations > 0
        ? `Export complete! (theme.json + ${variations} style variation${variations === 1 ? '' : 's'})`
        : 'Export complete!',

    // Generate
    generateTitle: 'Generate from a template',
    generateDescription: 'Choose a theme.json version to create the default styles and variables in Figma.',
    generateListTitle: 'What gets created:',
    generateItemColors: 'Color palette (variables)',
    generateItemDuotone: 'Duotone (variables referencing the colors)',
    generateItemFontSizes: 'Font sizes (text styles)',
    generateItemFluid: 'Fluid font sizes, Desktop / Mobile (variables)',
    generateItemFontFamilies: 'Font families (variables)',
    generateItemSpacing: 'Spacing (variables)',
    generateItemLayout: 'Layout widths contentSize / wideSize (variables)',
    generateItemRadius: 'Border radius (variables)',
    generateItemDimensions: 'Dimensions (variables)',
    generateItemViewport: 'Viewport mobile / tablet (variables)',
    generateButton: 'Generate styles in Figma',
    generating: (preset: string) => `Generating styles for ${preset}...`,

    // Notifications from the plugin code
    importedColors: (count: number) => `Imported ${count} colors to Variables.`,
    skippedFontSizes: (items: string[]) => `Skipped ${items.length} sizes with unsupported units: ${items.join(', ')}`,
    skippedFluid: (count: number) => `${count} fluid sizes were skipped (variable modes are not available on this plan)`,
    importedFontSizes: (notes: string[]) => notes.length > 0
        ? `Imported typography sizes. ${notes.join('. ')}.`
        : 'Imported typography sizes.',
    importedSizes: (presetType: 'spacing' | 'dimension', imported: number, total: number) =>
        `Imported ${imported} of ${total} ${presetType} sizes.`,
    importDone: 'Import complete!',
    importFailed: (error: string) => `Error: Import failed (${error})`,
    exported: (preset: string, variations: number) => variations > 0
        ? `${preset} theme.json + ${variations} style variation${variations === 1 ? '' : 's'} exported!`
        : `${preset} theme.json exported!`,
    exportFailed: (error: string) => `Error: Export failed (${error})`,
    generated: (c: GenerateCounts) => {
        const fluid = c.fluidBound > 0 ? ` (fluid: ${c.fluidBound})` : (c.fluidUnavailable ? ' (fluid sizes skipped: variable modes are not available)' : '');
        return `Done! Colors: ${c.colors}, Duotone pairs: ${c.duotone}, Font sizes: ${c.fontSizes}${fluid}, Font families: ${c.fontFamilies}, Spacing: ${c.spacing}`
            + (c.dimensions !== undefined ? `, Dimensions: ${c.dimensions}` : '')
            + `, Layout: ${c.layout}`
            + (c.radius !== undefined ? `, Radius: ${c.radius}` : '')
            + (c.viewport !== undefined ? `, Viewport: ${c.viewport}` : '');
    },
    generateFailed: (error: string) => `Error: Generation failed (${error})`,
};

export const MESSAGES: Record<Lang, Messages> = { ja, en };
