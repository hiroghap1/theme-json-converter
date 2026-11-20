// First WordPress version whose theme.json schema (https://schemas.wp.org/wp/<version>/theme.json) has each setting
// the plugin writes. Checked against the official schemas for 5.8–7.2 (2026-11).
// The UI (options shown) and the plugin code (keys written, items generated) both gate on this table,
// so a preset never outputs a key that its own $schema does not know.
export const SINCE = {
    // WordPress 5.9 supports it, but the 5.9 schema forgets it in the list of keys allowed directly under
    // "settings" (fixed in 6.0), so an editor validating with the 5.9 $schema flags this one key
    appearanceTools: '5.9',
    defaultPalette: '5.9',
    defaultGradients: '5.9',
    fontFamilies: '5.9',
    defaultDuotone: '6.0',
    fluid: '6.1',                       // typography.fluid / fontSizes[].fluid
    spacingSizes: '6.1',
    styleVariations: '6.2',             // top-level "title" of styles/*.json
    defaultFontSizes: '6.6',
    defaultSpacingSizes: '6.6',
    radiusSizes: '6.9',
    textIndent: '7.0',
    width: '7.0',                       // dimensions.width
    height: '7.0',                      // dimensions.height
    dimensionSizes: '7.0',
    minWidth: '7.1',                    // dimensions.minWidth
    backgroundGradient: '7.1',          // background.gradient
    blockVisibilityAllowEditing: '7.1', // blockVisibility.allowEditing
    viewport: '7.1',
    textShadow: '7.2',                  // typography.textShadow
    defaultTextShadowPresets: '7.2',
    textShadowPresets: '7.2',
    backgroundClip: '7.2',              // background.backgroundClip
} as const;

export type Feature = keyof typeof SINCE;

// Compare WP version strings like "6.6" / "7.0" / "7.1.2" numerically
export function wpAtLeast(wpVersion: string, minVersion: string): boolean {
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

export function supports(wpVersion: string, feature: Feature): boolean {
    return wpAtLeast(wpVersion, SINCE[feature]);
}

// settings.background.backgroundClip values (WordPress 7.2+), in schema order
export const BACKGROUND_CLIP_VALUES = ['text', 'padding-box', 'border-box', 'content-box'] as const;
export type BackgroundClipValue = typeof BACKGROUND_CLIP_VALUES[number];
