import React, { useRef, useState } from 'react';
import { ThemeJson } from '../common/types';

// SVG Icons
const ImportIcon: React.FC<{ color?: string; size?: number }> = ({ color = 'currentColor', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const ExportIcon: React.FC<{ color?: string; size?: number }> = ({ color = 'currentColor', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const FolderIcon: React.FC<{ color?: string; size?: number }> = ({ color = 'currentColor', size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

const DownloadIcon: React.FC<{ color?: string; size?: number }> = ({ color = 'currentColor', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const GenerateIcon: React.FC<{ color?: string; size?: number }> = ({ color = 'currentColor', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

type TabType = 'import' | 'export' | 'generate';

interface OptionSetting<T = boolean> {
    include: boolean;  // 出力するかどうか
    value: T;          // 出力する値
}

interface ExportOptions {
    presetKey: string;  // "${schemaVersion}-${wpVersion}" e.g. "3-7.0"
    appearanceTools: OptionSetting;
    defaultPalette: OptionSetting;
    defaultGradients: OptionSetting;
    defaultDuotone: OptionSetting;
    defaultFontSizes: OptionSetting;
    defaultSpacingSizes: OptionSetting;
    textIndent: OptionSetting<'subsequent' | 'all'>;
    width: OptionSetting;
    height: OptionSetting;
    minWidth: OptionSetting;
    backgroundGradient: OptionSetting;
    blockVisibilityAllowEditing: OptionSetting;
    viewport: OptionSetting<{ mobile: string; tablet: string }>;
}

type BooleanOptionKey = 'appearanceTools' | 'defaultPalette' | 'defaultGradients' | 'defaultDuotone' | 'defaultFontSizes' | 'defaultSpacingSizes' | 'width' | 'height' | 'minWidth' | 'backgroundGradient' | 'blockVisibilityAllowEditing';

// Schema/WP version presets. Add new rows when a new WP release ships changes.
const PRESETS: { key: string; label: string; schemaVersion: number; wpVersion: string }[] = [
    { key: '1-5.8', label: 'Version 1 (WordPress 5.8+)', schemaVersion: 1, wpVersion: '5.8' },
    { key: '2-5.9', label: 'Version 2 (WordPress 5.9+)', schemaVersion: 2, wpVersion: '5.9' },
    { key: '3-6.6', label: 'Version 3 (WordPress 6.6+)', schemaVersion: 3, wpVersion: '6.6' },
    { key: '3-7.0', label: 'Version 3 (WordPress 7.0+)', schemaVersion: 3, wpVersion: '7.0' },
    { key: '3-7.1', label: 'Version 3 (WordPress 7.1+)', schemaVersion: 3, wpVersion: '7.1' },
];

const DEFAULT_PRESET_KEY = '3-6.6';

const getPreset = (key: string) =>
    PRESETS.find(p => p.key === key) ?? PRESETS.find(p => p.key === DEFAULT_PRESET_KEY)!;

// settings.viewport.mobile / tablet pattern (WordPress 7.1+)
const VIEWPORT_PATTERN = /^(?:\d+|\d*\.\d+)(?:px|em|rem)$/;

const wpAtLeast = (wpVersion: string, minVersion: string): boolean => {
    const parse = (s: string) => s.split('.').map(n => parseInt(n, 10) || 0);
    const a = parse(wpVersion);
    const b = parse(minVersion);
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        const ai = a[i] ?? 0;
        const bi = b[i] ?? 0;
        if (ai !== bi) return ai > bi;
    }
    return true;
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('import');
    const [generatePresetKey, setGeneratePresetKey] = useState<string>(DEFAULT_PRESET_KEY);
    const [status, setStatus] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Export options
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        presetKey: DEFAULT_PRESET_KEY,
        appearanceTools: { include: true, value: true },
        defaultPalette: { include: true, value: false },
        defaultGradients: { include: true, value: false },
        defaultDuotone: { include: true, value: false },
        defaultFontSizes: { include: true, value: false },
        defaultSpacingSizes: { include: true, value: false },
        textIndent: { include: true, value: 'subsequent' },
        width: { include: true, value: false },
        height: { include: true, value: false },
        minWidth: { include: true, value: false },
        backgroundGradient: { include: true, value: false },
        blockVisibilityAllowEditing: { include: true, value: true },
        viewport: { include: true, value: { mobile: '480px', tablet: '782px' } },
    });

    const exportPreset = getPreset(exportOptions.presetKey);
    const generatePreset = getPreset(generatePresetKey);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string) as ThemeJson;
                parent.postMessage({ pluginMessage: { type: 'import-theme-json', payload: json } }, '*');
                setStatus('インポートを実行中...');
            } catch (error) {
                console.error('Invalid JSON', error);
                setStatus('エラー: 無効なJSONファイルです');
            }
        };
        reader.readAsText(file);
    };

    React.useEffect(() => {
        window.onmessage = (event) => {
            const msg = event.data.pluginMessage;
            if (!msg) return;
            
            const { type, payload } = msg;
            if (type === 'export-theme-json-result') {
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'theme.json';
                a.click();
                URL.revokeObjectURL(url);
                setStatus('エクスポート完了！');
            }
        };
    }, []);

    const handleExport = () => {
        const { schemaVersion, wpVersion } = getPreset(exportOptions.presetKey);
        parent.postMessage({
            pluginMessage: {
                type: 'export-theme-json',
                payload: { ...exportOptions, schemaVersion, wpVersion },
            },
        }, '*');
        setStatus('エクスポート中...');
    };

    const handleExportPresetChange = (key: string) => {
        setExportOptions(prev => ({ ...prev, presetKey: key }));
    };

    const handleOptionSettingChange = (key: BooleanOptionKey, field: 'include' | 'value', value: boolean) => {
        setExportOptions(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleTextIndentChange = (field: 'include' | 'value', value: boolean | 'subsequent' | 'all') => {
        setExportOptions(prev => ({
            ...prev,
            textIndent: { ...prev.textIndent, [field]: value } as OptionSetting<'subsequent' | 'all'>
        }));
    };

    const handleViewportChange = (field: 'include' | 'mobile' | 'tablet', value: boolean | string) => {
        setExportOptions(prev => ({
            ...prev,
            viewport: field === 'include'
                ? { ...prev.viewport, include: value as boolean }
                : { ...prev.viewport, value: { ...prev.viewport.value, [field]: value as string } }
        }));
    };

    const handleGenerate = () => {
        const { schemaVersion, wpVersion, label } = getPreset(generatePresetKey);
        parent.postMessage({
            pluginMessage: {
                type: 'generate-theme-json',
                payload: { schemaVersion, wpVersion },
            },
        }, '*');
        setStatus(`${label} でスタイルを生成中...`);
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'import', label: 'インポート', icon: <ImportIcon size={16} /> },
        { id: 'export', label: 'エクスポート', icon: <ExportIcon size={16} /> },
        { id: 'generate', label: '生成', icon: <GenerateIcon size={16} /> },
    ];

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>WP theme-json</h1>
                <span style={styles.subtitle}>WordPress theme.json Converter</span>
            </div>

            {/* Tabs */}
            <div style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab.id ? styles.tabActive : {}),
                        }}
                    >
                        <span style={styles.tabIcon}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={styles.content}>
                {activeTab === 'import' && (
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>theme.json をインポート</h2>
                        <p style={styles.description}>
                            theme.jsonファイルをアップロードして、Figmaのバリアブルとスタイルを作成します。
                        </p>
                        <div style={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                            <FolderIcon color="#0073aa" size={40} />
                            <span style={styles.uploadText}>クリックしてファイルを選択</span>
                            <span style={styles.uploadHint}>または、ここにドロップ</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".json"
                            onChange={handleFileUpload}
                        />
                    </div>
                )}

                {activeTab === 'export' && (
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>theme.json をエクスポート</h2>
                        <p style={styles.description}>
                            Figmaの現在のバリアブルとスタイルからtheme.jsonを生成してダウンロードします。
                        </p>
                        
                        <div style={styles.versionSelector}>
                            <label style={styles.label}>theme.jsonバージョン:</label>
                            <select
                                value={exportOptions.presetKey}
                                onChange={(e) => handleExportPresetChange(e.target.value)}
                                style={styles.select}
                            >
                                {PRESETS.map(p => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.optionsSection}>
                            <p style={styles.optionsSectionTitle}>設定オプション:</p>
                            
                            <div style={styles.optionRow}>
                                <label style={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.appearanceTools.include}
                                        onChange={(e) => handleOptionSettingChange('appearanceTools', 'include', e.target.checked)}
                                        style={styles.checkbox}
                                    />
                                    appearanceTools を出力
                                </label>
                                {exportOptions.appearanceTools.include && (
                                    <div style={styles.valueSelector}>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="appearanceToolsValue"
                                                checked={exportOptions.appearanceTools.value === true}
                                                onChange={() => handleOptionSettingChange('appearanceTools', 'value', true)}
                                                style={styles.radio}
                                            />
                                            true
                                        </label>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="appearanceToolsValue"
                                                checked={exportOptions.appearanceTools.value === false}
                                                onChange={() => handleOptionSettingChange('appearanceTools', 'value', false)}
                                                style={styles.radio}
                                            />
                                            false
                                        </label>
                                    </div>
                                )}
                            </div>

                            <p style={styles.optionGroupTitle}>Color設定:</p>
                            
                            <div style={styles.optionRow}>
                                <label style={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.defaultPalette.include}
                                        onChange={(e) => handleOptionSettingChange('defaultPalette', 'include', e.target.checked)}
                                        style={styles.checkbox}
                                    />
                                    defaultPalette を出力
                                </label>
                                {exportOptions.defaultPalette.include && (
                                    <div style={styles.valueSelector}>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="defaultPaletteValue"
                                                checked={exportOptions.defaultPalette.value === true}
                                                onChange={() => handleOptionSettingChange('defaultPalette', 'value', true)}
                                                style={styles.radio}
                                            />
                                            true
                                        </label>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="defaultPaletteValue"
                                                checked={exportOptions.defaultPalette.value === false}
                                                onChange={() => handleOptionSettingChange('defaultPalette', 'value', false)}
                                                style={styles.radio}
                                            />
                                            false
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div style={styles.optionRow}>
                                <label style={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.defaultGradients.include}
                                        onChange={(e) => handleOptionSettingChange('defaultGradients', 'include', e.target.checked)}
                                        style={styles.checkbox}
                                    />
                                    defaultGradients を出力
                                </label>
                                {exportOptions.defaultGradients.include && (
                                    <div style={styles.valueSelector}>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="defaultGradientsValue"
                                                checked={exportOptions.defaultGradients.value === true}
                                                onChange={() => handleOptionSettingChange('defaultGradients', 'value', true)}
                                                style={styles.radio}
                                            />
                                            true
                                        </label>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="defaultGradientsValue"
                                                checked={exportOptions.defaultGradients.value === false}
                                                onChange={() => handleOptionSettingChange('defaultGradients', 'value', false)}
                                                style={styles.radio}
                                            />
                                            false
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div style={styles.optionRow}>
                                <label style={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.defaultDuotone.include}
                                        onChange={(e) => handleOptionSettingChange('defaultDuotone', 'include', e.target.checked)}
                                        style={styles.checkbox}
                                    />
                                    defaultDuotone を出力
                                </label>
                                {exportOptions.defaultDuotone.include && (
                                    <div style={styles.valueSelector}>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="defaultDuotoneValue"
                                                checked={exportOptions.defaultDuotone.value === true}
                                                onChange={() => handleOptionSettingChange('defaultDuotone', 'value', true)}
                                                style={styles.radio}
                                            />
                                            true
                                        </label>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="defaultDuotoneValue"
                                                checked={exportOptions.defaultDuotone.value === false}
                                                onChange={() => handleOptionSettingChange('defaultDuotone', 'value', false)}
                                                style={styles.radio}
                                            />
                                            false
                                        </label>
                                    </div>
                                )}
                            </div>

                            <p style={styles.optionGroupTitle}>Typography設定:</p>
                            
                            <div style={styles.optionRow}>
                                <label style={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.defaultFontSizes.include}
                                        onChange={(e) => handleOptionSettingChange('defaultFontSizes', 'include', e.target.checked)}
                                        style={styles.checkbox}
                                    />
                                    defaultFontSizes を出力
                                </label>
                                {exportOptions.defaultFontSizes.include && (
                                    <div style={styles.valueSelector}>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="defaultFontSizesValue"
                                                checked={exportOptions.defaultFontSizes.value === true}
                                                onChange={() => handleOptionSettingChange('defaultFontSizes', 'value', true)}
                                                style={styles.radio}
                                            />
                                            true
                                        </label>
                                        <label style={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="defaultFontSizesValue"
                                                checked={exportOptions.defaultFontSizes.value === false}
                                                onChange={() => handleOptionSettingChange('defaultFontSizes', 'value', false)}
                                                style={styles.radio}
                                            />
                                            false
                                        </label>
                                    </div>
                                )}
                            </div>

                            {exportPreset.schemaVersion >= 2 && (
                                <>
                                    <p style={styles.optionGroupTitle}>Spacing設定:</p>
                                    <div style={styles.optionRow}>
                                        <label style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.defaultSpacingSizes.include}
                                                onChange={(e) => handleOptionSettingChange('defaultSpacingSizes', 'include', e.target.checked)}
                                                style={styles.checkbox}
                                            />
                                            defaultSpacingSizes を出力
                                        </label>
                                        {exportOptions.defaultSpacingSizes.include && (
                                            <div style={styles.valueSelector}>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="defaultSpacingSizesValue"
                                                        checked={exportOptions.defaultSpacingSizes.value === true}
                                                        onChange={() => handleOptionSettingChange('defaultSpacingSizes', 'value', true)}
                                                        style={styles.radio}
                                                    />
                                                    true
                                                </label>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="defaultSpacingSizesValue"
                                                        checked={exportOptions.defaultSpacingSizes.value === false}
                                                        onChange={() => handleOptionSettingChange('defaultSpacingSizes', 'value', false)}
                                                        style={styles.radio}
                                                    />
                                                    false
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {wpAtLeast(exportPreset.wpVersion, '7.0') && (
                                <>
                                    <p style={styles.optionGroupTitle}>Typography 追加設定 (WordPress 7.0+):</p>
                                    <div style={styles.optionRow}>
                                        <label style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.textIndent.include}
                                                onChange={(e) => handleTextIndentChange('include', e.target.checked)}
                                                style={styles.checkbox}
                                            />
                                            textIndent を出力
                                        </label>
                                        {exportOptions.textIndent.include && (
                                            <div style={styles.valueSelector}>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="textIndentValue"
                                                        checked={exportOptions.textIndent.value === 'subsequent'}
                                                        onChange={() => handleTextIndentChange('value', 'subsequent')}
                                                        style={styles.radio}
                                                    />
                                                    subsequent
                                                </label>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="textIndentValue"
                                                        checked={exportOptions.textIndent.value === 'all'}
                                                        onChange={() => handleTextIndentChange('value', 'all')}
                                                        style={styles.radio}
                                                    />
                                                    all
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <p style={styles.optionGroupTitle}>Dimensions設定 (WordPress 7.0+):</p>
                                    <div style={styles.optionRow}>
                                        <label style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.width.include}
                                                onChange={(e) => handleOptionSettingChange('width', 'include', e.target.checked)}
                                                style={styles.checkbox}
                                            />
                                            width を出力
                                        </label>
                                        {exportOptions.width.include && (
                                            <div style={styles.valueSelector}>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="widthValue"
                                                        checked={exportOptions.width.value === true}
                                                        onChange={() => handleOptionSettingChange('width', 'value', true)}
                                                        style={styles.radio}
                                                    />
                                                    true
                                                </label>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="widthValue"
                                                        checked={exportOptions.width.value === false}
                                                        onChange={() => handleOptionSettingChange('width', 'value', false)}
                                                        style={styles.radio}
                                                    />
                                                    false
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.optionRow}>
                                        <label style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.height.include}
                                                onChange={(e) => handleOptionSettingChange('height', 'include', e.target.checked)}
                                                style={styles.checkbox}
                                            />
                                            height を出力
                                        </label>
                                        {exportOptions.height.include && (
                                            <div style={styles.valueSelector}>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="heightValue"
                                                        checked={exportOptions.height.value === true}
                                                        onChange={() => handleOptionSettingChange('height', 'value', true)}
                                                        style={styles.radio}
                                                    />
                                                    true
                                                </label>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="heightValue"
                                                        checked={exportOptions.height.value === false}
                                                        onChange={() => handleOptionSettingChange('height', 'value', false)}
                                                        style={styles.radio}
                                                    />
                                                    false
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {wpAtLeast(exportPreset.wpVersion, '7.1') && (
                                        <div style={styles.optionRow}>
                                            <label style={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={exportOptions.minWidth.include}
                                                    onChange={(e) => handleOptionSettingChange('minWidth', 'include', e.target.checked)}
                                                    style={styles.checkbox}
                                                />
                                                minWidth を出力
                                            </label>
                                            {exportOptions.minWidth.include && (
                                                <div style={styles.valueSelector}>
                                                    <label style={styles.radioLabel}>
                                                        <input
                                                            type="radio"
                                                            name="minWidthValue"
                                                            checked={exportOptions.minWidth.value === true}
                                                            onChange={() => handleOptionSettingChange('minWidth', 'value', true)}
                                                            style={styles.radio}
                                                        />
                                                        true
                                                    </label>
                                                    <label style={styles.radioLabel}>
                                                        <input
                                                            type="radio"
                                                            name="minWidthValue"
                                                            checked={exportOptions.minWidth.value === false}
                                                            onChange={() => handleOptionSettingChange('minWidth', 'value', false)}
                                                            style={styles.radio}
                                                        />
                                                        false
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {wpAtLeast(exportPreset.wpVersion, '7.1') && (
                                <>
                                    <p style={styles.optionGroupTitle}>Background設定 (WordPress 7.1+):</p>
                                    <div style={styles.optionRow}>
                                        <label style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.backgroundGradient.include}
                                                onChange={(e) => handleOptionSettingChange('backgroundGradient', 'include', e.target.checked)}
                                                style={styles.checkbox}
                                            />
                                            background.gradient を出力
                                        </label>
                                        {exportOptions.backgroundGradient.include && (
                                            <div style={styles.valueSelector}>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="backgroundGradientValue"
                                                        checked={exportOptions.backgroundGradient.value === true}
                                                        onChange={() => handleOptionSettingChange('backgroundGradient', 'value', true)}
                                                        style={styles.radio}
                                                    />
                                                    true
                                                </label>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="backgroundGradientValue"
                                                        checked={exportOptions.backgroundGradient.value === false}
                                                        onChange={() => handleOptionSettingChange('backgroundGradient', 'value', false)}
                                                        style={styles.radio}
                                                    />
                                                    false
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <p style={styles.optionGroupTitle}>Block Visibility設定 (WordPress 7.1+):</p>
                                    <div style={styles.optionRow}>
                                        <label style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.blockVisibilityAllowEditing.include}
                                                onChange={(e) => handleOptionSettingChange('blockVisibilityAllowEditing', 'include', e.target.checked)}
                                                style={styles.checkbox}
                                            />
                                            blockVisibility.allowEditing を出力
                                        </label>
                                        {exportOptions.blockVisibilityAllowEditing.include && (
                                            <div style={styles.valueSelector}>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="blockVisibilityAllowEditingValue"
                                                        checked={exportOptions.blockVisibilityAllowEditing.value === true}
                                                        onChange={() => handleOptionSettingChange('blockVisibilityAllowEditing', 'value', true)}
                                                        style={styles.radio}
                                                    />
                                                    true
                                                </label>
                                                <label style={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="blockVisibilityAllowEditingValue"
                                                        checked={exportOptions.blockVisibilityAllowEditing.value === false}
                                                        onChange={() => handleOptionSettingChange('blockVisibilityAllowEditing', 'value', false)}
                                                        style={styles.radio}
                                                    />
                                                    false
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <p style={styles.optionGroupTitle}>Viewport設定 (WordPress 7.1+):</p>
                                    <div style={styles.optionRow}>
                                        <label style={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={exportOptions.viewport.include}
                                                onChange={(e) => handleViewportChange('include', e.target.checked)}
                                                style={styles.checkbox}
                                            />
                                            viewport を出力
                                        </label>
                                        {exportOptions.viewport.include && (
                                            <div style={styles.valueSelector}>
                                                <label style={styles.radioLabel}>
                                                    mobile
                                                    <input
                                                        type="text"
                                                        value={exportOptions.viewport.value.mobile}
                                                        onChange={(e) => handleViewportChange('mobile', e.target.value)}
                                                        placeholder="480px"
                                                        style={{
                                                            ...styles.textInput,
                                                            ...(exportOptions.viewport.value.mobile && !VIEWPORT_PATTERN.test(exportOptions.viewport.value.mobile) ? styles.textInputError : {}),
                                                        }}
                                                    />
                                                </label>
                                                <label style={styles.radioLabel}>
                                                    tablet
                                                    <input
                                                        type="text"
                                                        value={exportOptions.viewport.value.tablet}
                                                        onChange={(e) => handleViewportChange('tablet', e.target.value)}
                                                        placeholder="782px"
                                                        style={{
                                                            ...styles.textInput,
                                                            ...(exportOptions.viewport.value.tablet && !VIEWPORT_PATTERN.test(exportOptions.viewport.value.tablet) ? styles.textInputError : {}),
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <button style={styles.primaryButton} onClick={handleExport}>
                            <DownloadIcon color="white" size={18} />
                            theme.json をダウンロード
                        </button>
                    </div>
                )}

                {activeTab === 'generate' && (
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>テンプレートから生成</h2>
                        <p style={styles.description}>
                             theme.jsonのバージョンを選択して、デフォルトのスタイルとバリアブルをFigmaに作成します。
                        </p>
                        <div style={styles.versionSelector}>
                            <label style={styles.label}>theme.jsonバージョン:</label>
                            <select
                                value={generatePresetKey}
                                onChange={(e) => setGeneratePresetKey(e.target.value)}
                                style={styles.select}
                            >
                                {PRESETS.map(p => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.featureList}>
                            <p style={styles.featureTitle}>作成されるもの:</p>
                            <ul style={styles.featureItems}>
                                <li>カラーパレット（バリアブル）</li>
                                <li>フォントサイズ（テキストスタイル）</li>
                                <li>スペーシング（バリアブル）</li>
                                {wpAtLeast(generatePreset.wpVersion, '7.0') && <li>ディメンション（バリアブル）</li>}
                            </ul>
                        </div>
                        <button style={styles.primaryButton} onClick={handleGenerate}>
                            <GenerateIcon color="white" size={18} />
                            Figmaにスタイルを生成
                        </button>
                    </div>
                )}
            </div>

            {/* Status */}
            {status && (
                <div style={styles.statusBar}>
                    {status}
                </div>
            )}
        </div>
    );
};

// WordPress brand colors
const wpColors = {
    blue: '#0073aa',
    darkBlue: '#005a87',
    lightBlue: '#00a0d2',
    darkGray: '#23282d',
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        backgroundColor: '#ffffff',
        color: '#333333',
    },
    header: {
        padding: '20px 16px 12px',
        borderBottom: '1px solid #e5e5e5',
        background: `linear-gradient(135deg, ${wpColors.blue} 0%, ${wpColors.darkBlue} 100%)`,
        color: 'white',
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 700,
    },
    subtitle: {
        fontSize: '12px',
        opacity: 0.9,
    },
    tabContainer: {
        display: 'flex',
        borderBottom: '1px solid #e5e5e5',
        backgroundColor: '#fafafa',
    },
    tab: {
        flex: 1,
        padding: '12px 8px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        color: '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        borderBottom: '2px solid transparent',
    },
    tabActive: {
        color: wpColors.blue,
        borderBottomColor: wpColors.blue,
        backgroundColor: '#ffffff',
    },
    tabIcon: {
        display: 'flex',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: '20px 16px',
        overflowY: 'auto',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    sectionTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: '#333',
    },
    description: {
        margin: 0,
        fontSize: '13px',
        color: '#666',
        lineHeight: 1.5,
    },
    uploadArea: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        border: `2px dashed ${wpColors.blue}40`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: '#f8fbfd',
    },
    uploadText: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#333',
        marginTop: '12px',
    },
    uploadHint: {
        fontSize: '12px',
        color: '#999',
        marginTop: '4px',
    },
    primaryButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '14px 24px',
        border: 'none',
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${wpColors.blue} 0%, ${wpColors.darkBlue} 100%)`,
        color: 'white',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: `0 4px 12px ${wpColors.blue}40`,
    },
    statusBar: {
        padding: '12px 16px',
        backgroundColor: '#f0f8ff',
        borderTop: `1px solid ${wpColors.blue}30`,
        fontSize: '13px',
        color: wpColors.blue,
        textAlign: 'center',
    },
    versionSelector: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#333',
    },
    select: {
        padding: '12px 16px',
        fontSize: '14px',
        border: '1px solid #d0d0d0',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        cursor: 'pointer',
        outline: 'none',
    },
    featureList: {
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '12px 16px',
    },
    featureTitle: {
        margin: '0 0 8px 0',
        fontSize: '13px',
        fontWeight: 600,
        color: '#333',
    },
    featureItems: {
        margin: 0,
        paddingLeft: '20px',
        fontSize: '13px',
        color: '#666',
        lineHeight: 1.8,
    },
    optionsSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    optionsSectionTitle: {
        margin: '0 0 4px 0',
        fontSize: '13px',
        fontWeight: 600,
        color: '#333',
    },
    optionGroupTitle: {
        margin: '8px 0 4px 0',
        fontSize: '12px',
        fontWeight: 600,
        color: '#666',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#333',
        cursor: 'pointer',
    },
    checkbox: {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
    },
    optionRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '8px 0',
        borderBottom: '1px solid #eee',
    },
    valueSelector: {
        display: 'flex',
        gap: '16px',
        marginLeft: '24px',
        padding: '4px 8px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
    },
    radioLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: '#555',
        cursor: 'pointer',
    },
    textInput: {
        width: '72px',
        padding: '2px 6px',
        fontSize: '12px',
        border: '1px solid #d0d0d0',
        borderRadius: '4px',
        outline: 'none',
    },
    textInputError: {
        borderColor: '#d63638',
    },
    radio: {
        width: '14px',
        height: '14px',
        cursor: 'pointer',
    },
};

export default App;
