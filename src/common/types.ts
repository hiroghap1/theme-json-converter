export interface ThemeJson {
    version: number;
    settings?: {
        color?: {
            palette?: {
                color: string;
                name: string;
                slug: string;
            }[];
        };
        typography?: {
            fontSizes?: {
                name: string;
                size: string;
                slug: string;
                fluid?: {
                    min: string;
                    max: string;
                } | boolean;
            }[];
        };
        layout?: {
            contentSize?: string;
            wideSize?: string;
        }
    };
}

export interface PluginMessage {
    type: 'import-theme-json' | 'export-theme-json' | 'notify';
    payload?: any;
}
