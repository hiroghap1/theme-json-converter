figma.showUI(__html__, { width: 400, height: 600 });

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : null;
}

async function importThemeJson(theme: any) {
    console.log('Importing theme...', theme);

    // 1. Process Colors -> Variables
    if (theme.settings?.color?.palette) {
        const collectionName = "Theme Colors";
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        let collection = collections.find(c => c.name === collectionName);
        if (!collection) {
            collection = figma.variables.createVariableCollection(collectionName);
        }

        const allVariables = await figma.variables.getLocalVariablesAsync();
        
        for (const colorItem of theme.settings.color.palette) {
            const rgb = hexToRgb(colorItem.color);
            if (rgb) {
                let variable = allVariables.find(v => v.variableCollectionId === collection!.id && v.name === colorItem.name);
                if (!variable) {
                    variable = figma.variables.createVariable(colorItem.name, collection, "COLOR");
                }

                const modes = collection.modes;
                if (modes.length > 0) {
                    variable.setValueForMode(modes[0].modeId, rgb);
                }
            }
        }
        figma.notify(`Imported ${theme.settings.color.palette.length} colors to Variables.`);
    }

    // 2. Process Font Sizes -> Text Styles
    if (theme.settings?.typography?.fontSizes) {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });

        const textStyles = await figma.getLocalTextStylesAsync();

        for (const fontSize of theme.settings.typography.fontSizes) {
            let size = parseFloat(fontSize.size);
            if (fontSize.size.endsWith('rem')) {
                size = parseFloat(fontSize.size) * 16;
            } else if (fontSize.size.endsWith('px')) {
                size = parseFloat(fontSize.size);
            } else {
                const parsed = parseFloat(fontSize.size);
                if (!isNaN(parsed)) size = parsed;
            }

            if (!isNaN(size)) {
                const styleName = `Typography/${fontSize.name}`;
                let style = textStyles.find(s => s.name === styleName);
                if (!style) {
                    style = figma.createTextStyle();
                    style.name = styleName;
                }
                style.fontSize = size;
            }
        }
        figma.notify(`Imported typography sizes.`);
    }
}


// Helper to convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface OptionSetting<T = boolean> {
    include: boolean;
    value: T;
}

interface ExportOptions {
    schemaVersion: number;
    wpVersion: string;
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

function getSchemaUrl(wpVersion: string): string {
    return `https://schemas.wp.org/wp/${wpVersion}/theme.json`;
}

// Compare WP version strings like "6.6" / "7.0" / "7.1.2" numerically
function wpAtLeast(wpVersion: string, minVersion: string): boolean {
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
}

async function exportThemeJson(options?: ExportOptions) {
    const schemaVersion = options?.schemaVersion ?? 3;
    const wpVersion = options?.wpVersion ?? '6.6';
    const isWp7Plus = wpAtLeast(wpVersion, '7.0');

    const theme: any = {
        $schema: getSchemaUrl(wpVersion),
        version: schemaVersion,
        settings: {}
    };

    // Add appearanceTools if enabled (schema version 2+)
    if (schemaVersion >= 2 && options?.appearanceTools?.include) {
        theme.settings.appearanceTools = options.appearanceTools.value;
    }

    // Color settings
    theme.settings.color = {};
    
    if (options) {
        if (options.defaultPalette?.include) {
            theme.settings.color.defaultPalette = options.defaultPalette.value;
        }
        if (options.defaultGradients?.include) {
            theme.settings.color.defaultGradients = options.defaultGradients.value;
        }
        if (options.defaultDuotone?.include) {
            theme.settings.color.defaultDuotone = options.defaultDuotone.value;
        }
    }
    
    theme.settings.color.palette = [];

    // 1. Export Colors from Variables
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const allVariables = await figma.variables.getLocalVariablesAsync();
    
    const colorCollections = collections.filter(c => c.name.startsWith("Theme Colors"));
    for (const collection of colorCollections) {
        const modeId = collection.modes[0]?.modeId;
        if (modeId) {
            const variables = allVariables.filter(v => v.variableCollectionId === collection.id);
            for (const variable of variables) {
                const value = variable.valuesByMode[modeId];
                if (value && typeof value === 'object' && 'r' in value) {
                    const slug = variable.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    if (!theme.settings.color.palette.some((c: any) => c.slug === slug)) {
                        theme.settings.color.palette.push({
                            slug: slug,
                            name: variable.name,
                            color: rgbToHex(value.r, value.g, value.b)
                        });
                    }
                }
            }
        }
    }

    // Typography settings
    theme.settings.typography = {};

    if (options?.defaultFontSizes?.include) {
        theme.settings.typography.defaultFontSizes = options.defaultFontSizes.value;
    }

    // textIndent (WordPress 7.0+)
    if (isWp7Plus && options?.textIndent?.include) {
        theme.settings.typography.textIndent = options.textIndent.value;
    }

    theme.settings.typography.fontSizes = [];

    // 2. Export Typography from Text Styles
    const textStyles = await figma.getLocalTextStylesAsync();
    for (const style of textStyles) {
        const displayName = style.name.startsWith('Typography/') 
            ? style.name.replace('Typography/', '') 
            : style.name;
        const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        if (!theme.settings.typography.fontSizes.some((f: any) => f.slug === slug)) {
            theme.settings.typography.fontSizes.push({
                slug: slug,
                name: displayName,
                size: `${style.fontSize}px`
            });
        }
    }

    // Spacing settings (schema version 2+)
    if (schemaVersion >= 2) {
        theme.settings.spacing = {};
        
        if (options?.defaultSpacingSizes?.include) {
            theme.settings.spacing.defaultSpacingSizes = options.defaultSpacingSizes.value;
        }
        
        theme.settings.spacing.spacingSizes = [];

        // 3. Export Spacing from Variables
        const spacingCollections = collections.filter(c => c.name.startsWith("Theme Spacing"));
        for (const collection of spacingCollections) {
            const modeId = collection.modes[0]?.modeId;
            if (modeId) {
                const variables = allVariables.filter(v => v.variableCollectionId === collection.id);
                for (const variable of variables) {
                    const value = variable.valuesByMode[modeId];
                    if (typeof value === 'number') {
                        const slug = variable.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        if (!theme.settings.spacing.spacingSizes.some((s: any) => s.slug === slug)) {
                            theme.settings.spacing.spacingSizes.push({
                                slug: slug,
                                name: variable.name,
                                size: `${value}px`
                            });
                        }
                    }
                }
            }
        }

        if (theme.settings.spacing.spacingSizes.length === 0) {
            delete theme.settings.spacing.spacingSizes;
        }
    }

    // Dimensions settings (WordPress 7.0+)
    if (isWp7Plus) {
        const dimensions: any = {};

        if (options?.width?.include) {
            dimensions.width = options.width.value;
        }
        if (options?.height?.include) {
            dimensions.height = options.height.value;
        }
        // minWidth (WordPress 7.1+)
        if (wpAtLeast(wpVersion, '7.1') && options?.minWidth?.include) {
            dimensions.minWidth = options.minWidth.value;
        }

        const dimensionSizes: any[] = [];
        const dimensionCollections = collections.filter(c => c.name.startsWith("Theme Dimensions"));
        for (const collection of dimensionCollections) {
            const modeId = collection.modes[0]?.modeId;
            if (modeId) {
                const variables = allVariables.filter(v => v.variableCollectionId === collection.id);
                for (const variable of variables) {
                    const value = variable.valuesByMode[modeId];
                    if (typeof value === 'number') {
                        const slug = variable.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        if (!dimensionSizes.some(d => d.slug === slug)) {
                            dimensionSizes.push({
                                slug: slug,
                                name: variable.name,
                                size: `${value}px`
                            });
                        }
                    }
                }
            }
        }

        if (dimensionSizes.length > 0) {
            dimensions.dimensionSizes = dimensionSizes;
        }

        if (Object.keys(dimensions).length > 0) {
            theme.settings.dimensions = dimensions;
        }
    }

    // Background / Block Visibility / Viewport settings (WordPress 7.1+)
    if (wpAtLeast(wpVersion, '7.1')) {
        if (options?.backgroundGradient?.include) {
            theme.settings.background = { gradient: options.backgroundGradient.value };
        }
        if (options?.blockVisibilityAllowEditing?.include) {
            theme.settings.blockVisibility = { allowEditing: options.blockVisibilityAllowEditing.value };
        }
        if (options?.viewport?.include) {
            // Values not matching the schema pattern are skipped (WordPress ignores them anyway)
            const viewportPattern = /^(?:\d+|\d*\.\d+)(?:px|em|rem)$/;
            const viewport: any = {};
            const { mobile, tablet } = options.viewport.value;
            if (viewportPattern.test(mobile)) viewport.mobile = mobile;
            if (viewportPattern.test(tablet)) viewport.tablet = tablet;
            if (Object.keys(viewport).length > 0) {
                theme.settings.viewport = viewport;
            }
        }
    }

    if (theme.settings.color.palette.length === 0) {
        delete theme.settings.color.palette;
    }

    if (theme.settings.typography.fontSizes.length === 0) {
        delete theme.settings.typography.fontSizes;
    }

    figma.ui.postMessage({ type: 'export-theme-json-result', payload: theme });
    figma.notify(`Version ${schemaVersion} (WordPress ${wpVersion}+) theme.json exported!`);
}

// Default theme.json templates for each (schemaVersion, wpVersion) pair
function getDefaultTemplate(schemaVersion: number, wpVersion: string) {
    const isWp7Plus = wpAtLeast(wpVersion, '7.0');
    const baseColors = [
        { name: 'Base', slug: 'base', color: '#FFFFFF' },
        { name: 'Contrast', slug: 'contrast', color: '#111111' },
        { name: 'Primary', slug: 'primary', color: '#0073aa' },
        { name: 'Secondary', slug: 'secondary', color: '#23282d' },
        { name: 'Accent', slug: 'accent', color: '#cd2653' },
    ];

    const baseFontSizes = [
        { name: 'Small', slug: 'small', size: '14px' },
        { name: 'Medium', slug: 'medium', size: '16px' },
        { name: 'Large', slug: 'large', size: '20px' },
        { name: 'X-Large', slug: 'x-large', size: '28px' },
        { name: 'XX-Large', slug: 'xx-large', size: '36px' },
    ];

    const baseSpacing = [
        { name: 'Tiny', slug: '20', size: '10px' },
        { name: 'X-Small', slug: '30', size: '20px' },
        { name: 'Small', slug: '40', size: '30px' },
        { name: 'Regular', slug: '50', size: '40px' },
        { name: 'Large', slug: '60', size: '60px' },
        { name: 'X-Large', slug: '70', size: '80px' },
        { name: 'XX-Large', slug: '80', size: '100px' },
    ];

    const baseDimensions = [
        { name: 'Small', slug: 'small', size: '240px' },
        { name: 'Medium', slug: 'medium', size: '480px' },
        { name: 'Large', slug: 'large', size: '720px' },
    ];

    const v3Colors = [
        { name: 'Base', slug: 'base', color: '#FFFFFF' },
        { name: 'Contrast', slug: 'contrast', color: '#111111' },
        { name: 'Accent 1', slug: 'accent-1', color: '#FFEE58' },
        { name: 'Accent 2', slug: 'accent-2', color: '#F6CFF4' },
        { name: 'Accent 3', slug: 'accent-3', color: '#503AA8' },
        { name: 'Accent 4', slug: 'accent-4', color: '#686868' },
        { name: 'Accent 5', slug: 'accent-5', color: '#FBFAF3' },
    ];

    if (schemaVersion === 1) {
        return {
            colors: baseColors.slice(0, 3),
            fontSizes: baseFontSizes.slice(0, 3),
            spacing: [],
            dimensions: [],
        };
    } else if (schemaVersion === 2) {
        return {
            colors: baseColors,
            fontSizes: baseFontSizes,
            spacing: baseSpacing.slice(0, 5),
            dimensions: [],
        };
    } else {
        return {
            colors: v3Colors,
            fontSizes: baseFontSizes,
            spacing: baseSpacing,
            dimensions: isWp7Plus ? baseDimensions : [],
        };
    }
}

async function generateThemeJson(schemaVersion: number, wpVersion: string) {
    const template = getDefaultTemplate(schemaVersion, wpVersion);
    const suffix = `v${schemaVersion}-wp${wpVersion}`;
    let createdColors = 0;
    let createdFontSizes = 0;
    let createdSpacing = 0;
    let createdDimensions = 0;

    // Get existing collections and variables
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let allVariables = await figma.variables.getLocalVariablesAsync();

    // 1. Create Color Variables
    const colorCollectionName = `Theme Colors (${suffix})`;
    let colorCollection = collections.find(c => c.name === colorCollectionName);
    if (!colorCollection) {
        colorCollection = figma.variables.createVariableCollection(colorCollectionName);
    }

    for (const colorItem of template.colors) {
        const rgb = hexToRgb(colorItem.color);
        if (rgb) {
            let variable = allVariables.find(
                v => v.variableCollectionId === colorCollection!.id && v.name === colorItem.name
            );
            if (!variable) {
                variable = figma.variables.createVariable(colorItem.name, colorCollection, 'COLOR');
                createdColors++;
            }
            const modes = colorCollection.modes;
            if (modes.length > 0) {
                variable.setValueForMode(modes[0].modeId, rgb);
            }
        }
    }

    // 2. Create Spacing Variables (Version 2+)
    if (template.spacing.length > 0) {
        const spacingCollectionName = `Theme Spacing (${suffix})`;
        let spacingCollection = collections.find(c => c.name === spacingCollectionName);
        if (!spacingCollection) {
            spacingCollection = figma.variables.createVariableCollection(spacingCollectionName);
        }

        // Refresh variables list after creating new collection
        allVariables = await figma.variables.getLocalVariablesAsync();

        for (const spacingItem of template.spacing) {
            let size = parseFloat(spacingItem.size);
            let variable = allVariables.find(
                v => v.variableCollectionId === spacingCollection!.id && v.name === spacingItem.name
            );
            if (!variable) {
                variable = figma.variables.createVariable(spacingItem.name, spacingCollection, 'FLOAT');
                createdSpacing++;
            }
            const modes = spacingCollection.modes;
            if (modes.length > 0) {
                variable.setValueForMode(modes[0].modeId, size);
            }
        }
    }

    // 3. Create Dimension Variables (Version 4: WordPress 7.0+)
    if (template.dimensions.length > 0) {
        const dimensionCollectionName = `Theme Dimensions (${suffix})`;
        let dimensionCollection = collections.find(c => c.name === dimensionCollectionName);
        if (!dimensionCollection) {
            dimensionCollection = figma.variables.createVariableCollection(dimensionCollectionName);
        }

        allVariables = await figma.variables.getLocalVariablesAsync();

        for (const dimensionItem of template.dimensions) {
            let size = parseFloat(dimensionItem.size);
            let variable = allVariables.find(
                v => v.variableCollectionId === dimensionCollection!.id && v.name === dimensionItem.name
            );
            if (!variable) {
                variable = figma.variables.createVariable(dimensionItem.name, dimensionCollection, 'FLOAT');
                createdDimensions++;
            }
            const modes = dimensionCollection.modes;
            if (modes.length > 0) {
                variable.setValueForMode(modes[0].modeId, size);
            }
        }
    }

    // 4. Create Text Styles
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

    const textStyles = await figma.getLocalTextStylesAsync();

    for (const fontSize of template.fontSizes) {
        let size = parseFloat(fontSize.size);
        const styleName = `Typography/${fontSize.name}`;
        let style = textStyles.find(s => s.name === styleName);
        if (!style) {
            style = figma.createTextStyle();
            style.name = styleName;
            createdFontSizes++;
        }
        style.fontSize = size;
    }

    const dimensionPart = template.dimensions.length > 0 ? `, ディメンション: ${createdDimensions}個` : '';
    const message = `生成完了！ カラー: ${createdColors}個, フォント: ${createdFontSizes}個, スペーシング: ${createdSpacing}個${dimensionPart}`;
    figma.notify(message);
}

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'import-theme-json') {
        try {
            await importThemeJson(msg.payload);
            figma.notify('Theme imported successfully!');
        } catch (e: any) {
            console.error(e);
            figma.notify('Error importing theme: ' + e.message);
        }
    } else if (msg.type === 'export-theme-json') {
        try {
            await exportThemeJson(msg.payload);
        } catch (e: any) {
            console.error(e);
            figma.notify('Error exporting theme: ' + e.message);
        }
    } else if (msg.type === 'generate-theme-json') {
        try {
            const schemaVersion = msg.payload?.schemaVersion || 3;
            const wpVersion = msg.payload?.wpVersion || '6.6';
            await generateThemeJson(schemaVersion, wpVersion);
        } catch (e: any) {
            console.error(e);
            figma.notify('Error generating theme: ' + e.message);
        }
    }
};
