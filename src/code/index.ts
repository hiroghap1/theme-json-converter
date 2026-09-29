figma.showUI(__html__, { width: 400, height: 600 });

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (short) hex = `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : null;
}

// Parse a CSS length like "480px" into a number. Only px is supported (Figma variables are unitless px).
function parsePx(value: unknown): number | null {
    if (typeof value !== 'string') return null;
    const match = /^\s*(\d+|\d*\.\d+)px\s*$/.exec(value);
    return match ? parseFloat(match[1]) : null;
}

// Parse a CSS length into px: "24px" -> 24, "1.5rem" -> 24 (1rem = 16px). Other units / clamp() -> null
function parseLength(value: unknown): number | null {
    if (typeof value !== 'string') return null;
    const match = /^\s*(\d+|\d*\.\d+)(px|rem)\s*$/.exec(value);
    if (!match) return null;
    const num = parseFloat(match[1]);
    return match[2] === 'rem' ? num * 16 : num;
}

// WordPress preset slugs are kept as their CSS variable, e.g. "var(--wp--preset--spacing--20)":
// in a variable's WEB code syntax, or in a text style's description (text styles have no code syntax)
function presetCssVar(presetType: string, slug: string): string {
    return `var(--wp--preset--${presetType}--${slug})`;
}

function slugFromCssVar(text: string, presetType: string): string | null {
    const match = new RegExp(`--wp--preset--${presetType}--([A-Za-z0-9_-]+)`).exec(text);
    return match ? match[1] : null;
}

function nameToSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Slug of a variable: from its WEB code syntax when set, otherwise derived from the variable name
function presetSlug(variable: Variable, presetType: string): string {
    return slugFromCssVar(variable.codeSyntax?.WEB ?? '', presetType) ?? nameToSlug(variable.name);
}

// Write the font-size slug into a text style's description, keeping any other description text
function setFontSizeSlug(style: TextStyle, slug: string) {
    const cssVar = presetCssVar('font-size', slug);
    const pattern = /var\(--wp--preset--font-size--[A-Za-z0-9_-]+\)/;
    const description = style.description;
    style.description = pattern.test(description)
        ? description.replace(pattern, cssVar)
        : (description ? `${description}\n${cssVar}` : cssVar);
}

// First family name of a CSS font-family stack: '"Fira Code", monospace' -> 'Fira Code'
function primaryFontFamily(stack: string): string {
    return stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
}

// Normalize variable names for lookup: "contentSize" / "Content Size" / "content-size" -> "contentsize"
function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Create or update variables in a collection (created if missing). Returns the number of newly created variables.
async function upsertVariables(
    collectionName: string,
    type: 'FLOAT' | 'STRING' | 'COLOR',
    items: { name: string; value: VariableValue; description?: string; webCodeSyntax?: string }[]
): Promise<number> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find(c => c.name === collectionName);
    if (!collection) {
        collection = figma.variables.createVariableCollection(collectionName);
    }
    const allVariables = await figma.variables.getLocalVariablesAsync();
    const modeId = collection.modes[0]?.modeId;
    let created = 0;

    for (const item of items) {
        let variable = allVariables.find(v => v.variableCollectionId === collection!.id && v.name === item.name);
        if (!variable) {
            variable = figma.variables.createVariable(item.name, collection, type);
            created++;
        }
        if (modeId) {
            variable.setValueForMode(modeId, item.value);
        }
        if (item.description !== undefined) {
            variable.description = item.description;
        }
        if (item.webCodeSyntax) {
            variable.setVariableCodeSyntax('WEB', item.webCodeSyntax);
        }
    }
    return created;
}

// Value of a variable, following aliases. Uses the mode named `modeName` when the collection has it,
// otherwise the collection's first mode (aliases are resolved with the same mode name)
async function resolveVariableValue(variable: Variable, modeName?: string, depth = 0): Promise<VariableValue | undefined> {
    const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
    const mode = collection?.modes.find(m => m.name === modeName) ?? collection?.modes[0];
    if (!mode) return undefined;
    const value = variable.valuesByMode[mode.modeId];
    if (isVariableAlias(value)) {
        if (depth > 10) return undefined;
        const target = await figma.variables.getVariableByIdAsync(value.id);
        return target ? resolveVariableValue(target, modeName, depth + 1) : undefined;
    }
    return value;
}

function isVariableAlias(value: unknown): value is VariableAlias {
    return !!value && typeof value === 'object' && 'type' in value && (value as VariableAlias).type === 'VARIABLE_ALIAS';
}

function isRgb(value: unknown): value is RGB {
    return !!value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value;
}

// Make sure a collection has the given modes (renaming the untouched default "Mode 1").
// Returns mode ids in the same order, or null when modes cannot be added (e.g. Figma plan limit).
function ensureModes(collection: VariableCollection, names: string[]): string[] | null {
    if (collection.modes.length === 1 && collection.modes[0].name === 'Mode 1') {
        collection.renameMode(collection.modes[0].modeId, names[0]);
    }
    const ids: string[] = [];
    for (const name of names) {
        const existing = collection.modes.find(m => m.name === name);
        if (existing) {
            ids.push(existing.modeId);
            continue;
        }
        try {
            ids.push(collection.addMode(name));
        } catch (e) {
            console.warn(`Cannot add mode "${name}"`, e);
            return null;
        }
    }
    return ids;
}

// Fluid font sizes are kept as number variables with a mode per viewport; text styles bind their font size to them.
// Desktop comes first so that the default mode shows the regular (max) size.
const FLUID_MODES = ['Desktop', 'Mobile'];

// Create/update a "Theme Font Sizes" variable (Desktop = max, Mobile = min) and bind the text style's font size to it.
// Returns false when the modes cannot be created.
async function bindFluidFontSize(collectionName: string, style: TextStyle, name: string, min: number, max: number, slug?: string): Promise<boolean> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find(c => c.name === collectionName);
    if (!collection) {
        collection = figma.variables.createVariableCollection(collectionName);
    }
    const modeIds = ensureModes(collection, FLUID_MODES);
    if (!modeIds) return false;

    const allVariables = await figma.variables.getLocalVariablesAsync();
    let variable = allVariables.find(v => v.variableCollectionId === collection!.id && v.name === name);
    if (!variable) {
        variable = figma.variables.createVariable(name, collection, 'FLOAT');
    }
    variable.setValueForMode(modeIds[0], max);
    variable.setValueForMode(modeIds[1], min);
    if (slug) {
        variable.setVariableCodeSyntax('WEB', presetCssVar('font-size', slug));
    }
    style.setBoundVariable('fontSize', variable);
    return true;
}

// Variables of all collections whose name starts with the given prefix (e.g. "Theme Layout" matches "Theme Layout (v3-wp7.1)")
async function getVariablesInCollections(prefix: string): Promise<Variable[]> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const ids = new Set(collections.filter(c => c.name.startsWith(prefix)).map(c => c.id));
    const allVariables = await figma.variables.getLocalVariablesAsync();
    return allVariables.filter(v => ids.has(v.variableCollectionId));
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
                if (colorItem.slug) {
                    variable.setVariableCodeSyntax('WEB', presetCssVar('color', colorItem.slug));
                }
            }
        }
        figma.notify(`Imported ${theme.settings.color.palette.length} colors to Variables.`);
    }

    // 2. Process Font Sizes -> Text Styles
    if (theme.settings?.typography?.fontSizes) {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });

        const textStyles = await figma.getLocalTextStylesAsync();
        let fluidSkipped = 0;
        const skippedSizes: string[] = [];

        for (const fontSize of theme.settings.typography.fontSizes) {
            // px / rem only. When size is e.g. clamp() but fluid.max is a plain length, use fluid.max
            const size = parseLength(fontSize.size) ?? parseLength(fontSize.fluid?.max);
            if (size === null) {
                skippedSizes.push(`${fontSize.name} (${fontSize.size})`);
                continue;
            }

            const styleName = `Typography/${fontSize.name}`;
            let style = textStyles.find(s => s.name === styleName);
            if (!style) {
                style = figma.createTextStyle();
                style.name = styleName;
            }
            style.fontSize = size;
            if (fontSize.slug) {
                setFontSizeSlug(style, fontSize.slug);
            }

            // fluid: { min, max } -> "Theme Font Sizes" variable with Mobile / Desktop modes
            const fluidMin = parseLength(fontSize.fluid?.min);
            const fluidMax = parseLength(fontSize.fluid?.max) ?? size;
            if (fluidMin !== null && fluidMin !== fluidMax) {
                const bound = await bindFluidFontSize('Theme Font Sizes', style, fontSize.name, fluidMin, fluidMax, fontSize.slug);
                if (!bound) fluidSkipped++;
            }
        }
        const notes: string[] = [];
        if (skippedSizes.length > 0) {
            notes.push(`Skipped ${skippedSizes.length} sizes with unsupported units: ${skippedSizes.join(', ')}`);
        }
        if (fluidSkipped > 0) {
            notes.push(`${fluidSkipped} fluid sizes were skipped (variable modes are not available on this plan)`);
        }
        figma.notify(notes.length > 0
            ? `Imported typography sizes. ${notes.join('. ')}.`
            : `Imported typography sizes.`, notes.length > 0 ? { timeout: 8000 } : undefined);
    }

    // 2b. Process Duotone -> Color Variables "<name>/shadow" and "<name>/highlight"
    // Colors matching a "Theme Colors" variable become aliases to it
    if (Array.isArray(theme.settings?.color?.duotone)) {
        const colorVariables = await getVariablesInCollections('Theme Colors');
        const findPaletteAlias = async (rgb: RGB): Promise<VariableAlias | null> => {
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            for (const variable of colorVariables) {
                const value = await resolveVariableValue(variable);
                if (isRgb(value) && rgbToHex(value.r, value.g, value.b) === hex) {
                    return figma.variables.createVariableAlias(variable);
                }
            }
            return null;
        };

        const items: { name: string; value: VariableValue; webCodeSyntax?: string }[] = [];
        for (const duotone of theme.settings.color.duotone) {
            if (!duotone.name || !Array.isArray(duotone.colors) || duotone.colors.length < 2) continue;
            const shadow = hexToRgb(duotone.colors[0]);
            const highlight = hexToRgb(duotone.colors[1]);
            if (!shadow || !highlight) continue;
            const webCodeSyntax = duotone.slug ? presetCssVar('duotone', duotone.slug) : undefined;
            items.push({ name: `${duotone.name}/shadow`, value: (await findPaletteAlias(shadow)) ?? shadow, webCodeSyntax });
            items.push({ name: `${duotone.name}/highlight`, value: (await findPaletteAlias(highlight)) ?? highlight, webCodeSyntax });
        }
        if (items.length > 0) {
            await upsertVariables('Theme Duotone', 'COLOR', items);
        }
    }

    // 3. Process Spacing Sizes / Dimension Sizes -> Number Variables (px / rem)
    // The slug is kept in the WEB code syntax so that export restores it (e.g. "20" for "Tiny")
    const sizePresets: { list: any; collectionName: string; presetType: string }[] = [
        { list: theme.settings?.spacing?.spacingSizes, collectionName: 'Theme Spacing', presetType: 'spacing' },
        { list: theme.settings?.dimensions?.dimensionSizes, collectionName: 'Theme Dimensions', presetType: 'dimension' },
    ];
    for (const { list, collectionName, presetType } of sizePresets) {
        if (!Array.isArray(list)) continue;
        const items: { name: string; value: number; webCodeSyntax?: string }[] = [];
        for (const item of list) {
            const px = parseLength(item.size);
            if (px === null || !item.name) continue;
            items.push({
                name: item.name,
                value: px,
                webCodeSyntax: item.slug ? presetCssVar(presetType, item.slug) : undefined,
            });
        }
        if (items.length > 0) {
            await upsertVariables(collectionName, 'FLOAT', items);
            figma.notify(`Imported ${items.length} of ${list.length} ${presetType} sizes.`);
        }
    }

    // 4. Process Font Families -> String Variables (full CSS stack is kept in the description)
    if (Array.isArray(theme.settings?.typography?.fontFamilies)) {
        const items = theme.settings.typography.fontFamilies
            .filter((f: any) => typeof f.fontFamily === 'string' && f.name)
            .map((f: any) => ({
                name: f.name,
                value: primaryFontFamily(f.fontFamily),
                description: f.fontFamily,
                webCodeSyntax: f.slug ? presetCssVar('font-family', f.slug) : undefined,
            }));
        if (items.length > 0) {
            await upsertVariables('Theme Font Families', 'STRING', items);
        }
    }

    // 5. Process Layout -> Number Variables (px only)
    const layoutItems: { name: string; value: number }[] = [];
    for (const key of ['contentSize', 'wideSize']) {
        const px = parsePx(theme.settings?.layout?.[key]);
        if (px !== null) layoutItems.push({ name: key, value: px });
    }
    if (layoutItems.length > 0) {
        await upsertVariables('Theme Layout', 'FLOAT', layoutItems);
    }

    // 6. Process Border Radius Sizes -> Number Variables (px only)
    if (Array.isArray(theme.settings?.border?.radiusSizes)) {
        const items: { name: string; value: number; webCodeSyntax?: string }[] = [];
        for (const r of theme.settings.border.radiusSizes) {
            const px = parsePx(r.size);
            if (px !== null && r.name) {
                items.push({
                    name: r.name,
                    value: px,
                    webCodeSyntax: r.slug ? presetCssVar('border-radius', r.slug) : undefined,
                });
            }
        }
        if (items.length > 0) {
            await upsertVariables('Theme Radius', 'FLOAT', items);
        }
    }

    // 7. Process Viewport -> Number Variables (px only)
    const viewportItems: { name: string; value: number }[] = [];
    for (const key of ['mobile', 'tablet']) {
        const px = parsePx(theme.settings?.viewport?.[key]);
        if (px !== null) viewportItems.push({ name: key, value: px });
    }
    if (viewportItems.length > 0) {
        await upsertVariables('Theme Viewport', 'FLOAT', viewportItems);
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
    viewport: ViewportOption;
    styleVariations: boolean;
}

// viewport breakpoints: free input values, or a variable id per breakpoint ('' = use free input)
interface ViewportOption extends OptionSetting<{ mobile: string; tablet: string }> {
    variableIds: { mobile: string; tablet: string };
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
    
    // 1. Export Colors from Variables (first mode)
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const allVariables = await figma.variables.getLocalVariablesAsync();

    theme.settings.color.palette = await buildPalette();

    const duotone = await buildDuotone();
    if (duotone.length > 0) {
        theme.settings.color.duotone = duotone;
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
    let hasFluidFontSize = false;
    for (const style of textStyles) {
        // Only styles under "Typography/" are font size presets (others like "Body/Bold" are skipped)
        if (!style.name.startsWith('Typography/')) continue;
        const displayName = style.name.replace('Typography/', '');
        const slug = slugFromCssVar(style.description, 'font-size') ?? nameToSlug(displayName);

        if (!theme.settings.typography.fontSizes.some((f: any) => f.slug === slug)) {
            const entry: any = {
                slug: slug,
                name: displayName,
                size: `${style.fontSize}px`
            };
            // Font size bound to a variable with several modes -> fluid { min, max } (smallest / largest mode value)
            const fluid = await getFluidRange(style);
            if (fluid) {
                entry.size = `${fluid.max}px`;
                entry.fluid = { min: `${fluid.min}px`, max: `${fluid.max}px` };
                hasFluidFontSize = true;
            }
            theme.settings.typography.fontSizes.push(entry);
        }
    }

    // 2b. Export Font Families from String Variables
    const fontFamilies: any[] = [];
    for (const variable of await getVariablesInCollections('Theme Font Families')) {
        const value = await resolveVariableValue(variable);
        if (typeof value !== 'string' || !value) continue;
        const slug = presetSlug(variable, 'font-family');
        if (fontFamilies.some(f => f.slug === slug)) continue;
        // Use the full CSS stack kept in the description when it still matches the variable value
        const description = variable.description.trim();
        const fontFamily = description && primaryFontFamily(description) === value
            ? description
            : (/\s/.test(value) ? `"${value}"` : value);
        fontFamilies.push({ slug, name: variable.name, fontFamily });
    }
    if (fontFamilies.length > 0) {
        theme.settings.typography.fontFamilies = fontFamilies;
    }

    // Layout settings (contentSize / wideSize)
    const layout: any = {};
    for (const variable of await getVariablesInCollections('Theme Layout')) {
        const value = await resolveVariableValue(variable);
        if (typeof value !== 'number') continue;
        const key = normalizeName(variable.name);
        if (key === 'contentsize' && !layout.contentSize) layout.contentSize = `${value}px`;
        if (key === 'widesize' && !layout.wideSize) layout.wideSize = `${value}px`;
    }
    if (Object.keys(layout).length > 0) {
        theme.settings.layout = layout;
    }

    // Border radius sizes (WordPress 6.9+)
    if (wpAtLeast(wpVersion, '6.9')) {
        const radiusSizes: any[] = [];
        for (const variable of await getVariablesInCollections('Theme Radius')) {
            const value = await resolveVariableValue(variable);
            if (typeof value !== 'number') continue;
            const slug = presetSlug(variable, 'border-radius');
            if (radiusSizes.some(r => r.slug === slug)) continue;
            radiusSizes.push({ slug, name: variable.name, size: `${value}px` });
        }
        if (radiusSizes.length > 0) {
            theme.settings.border = { radiusSizes };
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
                        const slug = presetSlug(variable, 'spacing');
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
                        const slug = presetSlug(variable, 'dimension');
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
            for (const key of ['mobile', 'tablet'] as const) {
                let value = options.viewport.value[key];
                const variableId = options.viewport.variableIds?.[key];
                if (variableId) {
                    const variable = await figma.variables.getVariableByIdAsync(variableId);
                    const resolved = variable ? await resolveVariableValue(variable) : undefined;
                    value = typeof resolved === 'number' ? `${resolved}px` : '';
                }
                if (viewportPattern.test(value)) viewport[key] = value;
            }
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

    // Fluid sizes only take effect when fluid typography is enabled
    if (hasFluidFontSize && theme.settings.typography.fluid === undefined) {
        theme.settings.typography.fluid = true;
    }

    // Style variations (styles/*.json) from the extra modes of "Theme Colors" collections
    const variations: { fileName: string; json: any }[] = [];
    if (options?.styleVariations) {
        const modeNames: string[] = [];
        for (const collection of collections.filter(c => c.name.startsWith('Theme Colors'))) {
            for (const mode of collection.modes.slice(1)) {
                if (modeNames.indexOf(mode.name) === -1) modeNames.push(mode.name);
            }
        }
        const usedFileNames = new Set<string>();
        for (let index = 0; index < modeNames.length; index++) {
            const modeName = modeNames[index];
            const color: any = { palette: await buildPalette(modeName) };
            const variationDuotone = await buildDuotone(modeName);
            if (JSON.stringify(variationDuotone) !== JSON.stringify(duotone)) {
                color.duotone = variationDuotone;
            }
            let fileName = nameToSlug(modeName).replace(/^-+|-+$/g, '') || `variation-${index + 1}`;
            while (usedFileNames.has(fileName)) fileName += '-2';
            usedFileNames.add(fileName);
            variations.push({
                fileName: `${fileName}.json`,
                json: {
                    $schema: getSchemaUrl(wpVersion),
                    version: schemaVersion,
                    title: modeName,
                    settings: { color },
                },
            });
        }
    }

    figma.ui.postMessage({ type: 'export-theme-json-result', payload: { theme, variations } });
    figma.notify(variations.length > 0
        ? `Version ${schemaVersion} (WordPress ${wpVersion}+) theme.json + ${variations.length} style variations exported!`
        : `Version ${schemaVersion} (WordPress ${wpVersion}+) theme.json exported!`);
}

// color.palette from "Theme Colors" collections (mode by name, falling back to the first mode)
async function buildPalette(modeName?: string): Promise<any[]> {
    const palette: any[] = [];
    for (const variable of await getVariablesInCollections('Theme Colors')) {
        if (variable.resolvedType !== 'COLOR') continue;
        const value = await resolveVariableValue(variable, modeName);
        if (!isRgb(value)) continue;
        const slug = presetSlug(variable, 'color');
        if (!palette.some(c => c.slug === slug)) {
            palette.push({ slug, name: variable.name, color: rgbToHex(value.r, value.g, value.b) });
        }
    }
    return palette;
}

// color.duotone from "Theme Duotone" collections: pairs of "<name>/shadow" and "<name>/highlight" color variables
async function buildDuotone(modeName?: string): Promise<any[]> {
    const pairs = new Map<string, { shadow?: Variable; highlight?: Variable }>();
    for (const variable of await getVariablesInCollections('Theme Duotone')) {
        const match = /^(.+)\/(shadow|highlight)$/i.exec(variable.name);
        if (!match || variable.resolvedType !== 'COLOR') continue;
        const pair = pairs.get(match[1]) ?? {};
        pair[match[2].toLowerCase() as 'shadow' | 'highlight'] = variable;
        pairs.set(match[1], pair);
    }

    const duotone: any[] = [];
    for (const [name, pair] of pairs) {
        if (!pair.shadow || !pair.highlight) continue;
        const shadow = await resolveVariableValue(pair.shadow, modeName);
        const highlight = await resolveVariableValue(pair.highlight, modeName);
        if (!isRgb(shadow) || !isRgb(highlight)) continue;
        const slug = slugFromCssVar(pair.shadow.codeSyntax?.WEB ?? '', 'duotone')
            ?? slugFromCssVar(pair.highlight.codeSyntax?.WEB ?? '', 'duotone')
            ?? nameToSlug(name);
        if (duotone.some(d => d.slug === slug)) continue;
        duotone.push({
            slug,
            name,
            colors: [rgbToHex(shadow.r, shadow.g, shadow.b), rgbToHex(highlight.r, highlight.g, highlight.b)],
        });
    }
    return duotone;
}

// Min / max px of a text style's font size when it is bound to a variable with several modes
async function getFluidRange(style: TextStyle): Promise<{ min: number; max: number } | null> {
    const alias = style.boundVariables?.fontSize;
    if (!alias) return null;
    const variable = await figma.variables.getVariableByIdAsync(alias.id);
    if (!variable) return null;
    const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
    if (!collection || collection.modes.length < 2) return null;
    const values: number[] = [];
    for (const mode of collection.modes) {
        const value = await resolveVariableValue(variable, mode.name);
        if (typeof value === 'number') values.push(value);
    }
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min < max ? { min, max } : null;
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

    const baseLayout = [
        { name: 'contentSize', value: 645 },
        { name: 'wideSize', value: 1340 },
    ];

    const baseFontFamilies = [
        { name: 'Manrope', value: 'Manrope', description: 'Manrope, sans-serif', webCodeSyntax: presetCssVar('font-family', 'manrope') },
        { name: 'Fira Code', value: 'Fira Code', description: '"Fira Code", monospace', webCodeSyntax: presetCssVar('font-family', 'fira-code') },
    ];

    const baseRadius = [
        { name: 'Small', value: 4, webCodeSyntax: presetCssVar('border-radius', 'small') },
        { name: 'Medium', value: 8, webCodeSyntax: presetCssVar('border-radius', 'medium') },
        { name: 'Large', value: 16, webCodeSyntax: presetCssVar('border-radius', 'large') },
    ];

    const baseViewport = [
        { name: 'mobile', value: 480 },
        { name: 'tablet', value: 782 },
    ];

    // Fluid font sizes (Mobile / Desktop) for the fluid typography of WordPress 6.1+
    const fluidFontSizes: Record<string, number> = {
        'small': 14,
        'medium': 16,
        'large': 18,
        'x-large': 22,
        'xx-large': 26,
    };

    // Shared by every schema version (layout / fontFamilies exist since v1)
    const common = {
        layout: baseLayout,
        fontFamilies: baseFontFamilies,
        radius: wpAtLeast(wpVersion, '6.9') ? baseRadius : [],
        viewport: wpAtLeast(wpVersion, '7.1') ? baseViewport : [],
    };

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
            duotone: [
                { name: 'Grayscale', slug: 'grayscale', shadow: 'Contrast', highlight: 'Base' },
                { name: 'Primary', slug: 'primary', shadow: 'Primary', highlight: 'Base' },
            ],
            fontSizes: baseFontSizes.slice(0, 3),
            fluidMin: {} as Record<string, number>,
            spacing: [],
            dimensions: [],
            ...common,
        };
    } else if (schemaVersion === 2) {
        return {
            colors: baseColors,
            duotone: [
                { name: 'Grayscale', slug: 'grayscale', shadow: 'Contrast', highlight: 'Base' },
                { name: 'Primary', slug: 'primary', shadow: 'Primary', highlight: 'Base' },
            ],
            fontSizes: baseFontSizes,
            fluidMin: {} as Record<string, number>,
            spacing: baseSpacing.slice(0, 5),
            dimensions: [],
            ...common,
        };
    } else {
        return {
            colors: v3Colors,
            duotone: [
                { name: 'Grayscale', slug: 'grayscale', shadow: 'Contrast', highlight: 'Base' },
                { name: 'Accent', slug: 'accent', shadow: 'Accent 3', highlight: 'Accent 1' },
            ],
            fontSizes: baseFontSizes,
            fluidMin: fluidFontSizes,
            spacing: baseSpacing,
            dimensions: isWp7Plus ? baseDimensions : [],
            ...common,
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
            variable.setVariableCodeSyntax('WEB', presetCssVar('color', colorItem.slug));
        }
    }

    // 1b. Create Duotone Variables (aliases to the generated colors)
    allVariables = await figma.variables.getLocalVariablesAsync();
    const duotoneItems: { name: string; value: VariableValue; webCodeSyntax: string }[] = [];
    for (const pair of template.duotone) {
        const shadow = allVariables.find(v => v.variableCollectionId === colorCollection!.id && v.name === pair.shadow);
        const highlight = allVariables.find(v => v.variableCollectionId === colorCollection!.id && v.name === pair.highlight);
        if (!shadow || !highlight) continue;
        const webCodeSyntax = presetCssVar('duotone', pair.slug);
        duotoneItems.push({ name: `${pair.name}/shadow`, value: figma.variables.createVariableAlias(shadow), webCodeSyntax });
        duotoneItems.push({ name: `${pair.name}/highlight`, value: figma.variables.createVariableAlias(highlight), webCodeSyntax });
    }
    const createdDuotone = (await upsertVariables(`Theme Duotone (${suffix})`, 'COLOR', duotoneItems)) / 2;

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
            variable.setVariableCodeSyntax('WEB', presetCssVar('spacing', spacingItem.slug));
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
            variable.setVariableCodeSyntax('WEB', presetCssVar('dimension', dimensionItem.slug));
        }
    }

    // 4. Create Layout / Font Family / Radius / Viewport Variables
    const createdLayout = await upsertVariables(`Theme Layout (${suffix})`, 'FLOAT', template.layout);
    const createdFontFamilies = await upsertVariables(`Theme Font Families (${suffix})`, 'STRING', template.fontFamilies);
    const createdRadius = template.radius.length > 0
        ? await upsertVariables(`Theme Radius (${suffix})`, 'FLOAT', template.radius)
        : 0;
    const createdViewport = template.viewport.length > 0
        ? await upsertVariables(`Theme Viewport (${suffix})`, 'FLOAT', template.viewport)
        : 0;

    // 5. Create Text Styles
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

    const textStyles = await figma.getLocalTextStylesAsync();

    let fluidBound = 0;
    let fluidUnavailable = false;
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
        setFontSizeSlug(style, fontSize.slug);

        const fluidMin = template.fluidMin[fontSize.slug];
        if (fluidMin !== undefined && !fluidUnavailable) {
            const bound = await bindFluidFontSize(`Theme Font Sizes (${suffix})`, style, fontSize.name, fluidMin, size, fontSize.slug);
            if (!bound) fluidUnavailable = true;
            else fluidBound++;
        }
    }

    const dimensionPart = template.dimensions.length > 0 ? `, ディメンション: ${createdDimensions}個` : '';
    const radiusPart = template.radius.length > 0 ? `, 角丸: ${createdRadius}個` : '';
    const viewportPart = template.viewport.length > 0 ? `, ビューポート: ${createdViewport}個` : '';
    const fluidPart = fluidBound > 0 ? `（可変サイズ: ${fluidBound}個）` : (fluidUnavailable ? '（可変サイズはモードが使えないためスキップ）' : '');
    const message = `生成完了！ カラー: ${createdColors}個, デュオトーン: ${createdDuotone}組, フォント: ${createdFontSizes}個${fluidPart}, フォントファミリー: ${createdFontFamilies}個, スペーシング: ${createdSpacing}個${dimensionPart}, レイアウト: ${createdLayout}個${radiusPart}${viewportPart}`;
    figma.notify(message);
    return message;
}

// Show the result in the UI status bar (otherwise it keeps showing "…中")
function postStatus(message: string) {
    figma.ui.postMessage({ type: 'status', payload: message });
}

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'import-theme-json') {
        try {
            await importThemeJson(msg.payload);
            figma.notify('Theme imported successfully!');
            postStatus('インポート完了！');
        } catch (e: any) {
            console.error(e);
            figma.notify('Error importing theme: ' + e.message);
            postStatus('エラー: インポートに失敗しました（' + e.message + '）');
        }
    } else if (msg.type === 'export-theme-json') {
        try {
            await exportThemeJson(msg.payload);
        } catch (e: any) {
            console.error(e);
            figma.notify('Error exporting theme: ' + e.message);
            postStatus('エラー: エクスポートに失敗しました（' + e.message + '）');
        }
    } else if (msg.type === 'get-viewport-variables') {
        // Number variables in "Theme Viewport" collections, for the viewport selector in the export tab
        const list: { id: string; name: string; label: string; value: number }[] = [];
        for (const variable of await getVariablesInCollections('Theme Viewport')) {
            const value = await resolveVariableValue(variable);
            if (typeof value !== 'number') continue;
            const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
            list.push({ id: variable.id, name: variable.name, label: `${collection?.name ?? ''} / ${variable.name}`, value });
        }
        figma.ui.postMessage({ type: 'viewport-variables', payload: list });
    } else if (msg.type === 'generate-theme-json') {
        try {
            const schemaVersion = msg.payload?.schemaVersion || 3;
            const wpVersion = msg.payload?.wpVersion || '6.6';
            const message = await generateThemeJson(schemaVersion, wpVersion);
            postStatus(message);
        } catch (e: any) {
            console.error(e);
            figma.notify('Error generating theme: ' + e.message);
            postStatus('エラー: 生成に失敗しました（' + e.message + '）');
        }
    }
};
