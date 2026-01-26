"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/code/index.ts
  var require_index = __commonJS({
    "src/code/index.ts"(exports) {
      figma.showUI(__html__, { width: 400, height: 600 });
      function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        } : null;
      }
      function importThemeJson(theme) {
        return __async(this, null, function* () {
          var _a, _b, _c, _d;
          console.log("Importing theme...", theme);
          if ((_b = (_a = theme.settings) == null ? void 0 : _a.color) == null ? void 0 : _b.palette) {
            const collectionName = "Theme Colors";
            let collection = figma.variables.getLocalVariableCollections().find((c) => c.name === collectionName);
            if (!collection) {
              collection = figma.variables.createVariableCollection(collectionName);
            }
            for (const colorItem of theme.settings.color.palette) {
              const rgb = hexToRgb(colorItem.color);
              if (rgb) {
                let variable = figma.variables.getLocalVariables().find((v) => v.variableCollectionId === collection.id && v.name === colorItem.name);
                if (!variable) {
                  variable = figma.variables.createVariable(colorItem.name, collection.id, "COLOR");
                }
                const modes = collection.modes;
                if (modes.length > 0) {
                  variable.setValueForMode(modes[0].modeId, rgb);
                }
              }
            }
            figma.notify(`Imported ${theme.settings.color.palette.length} colors to Variables.`);
          }
          if ((_d = (_c = theme.settings) == null ? void 0 : _c.typography) == null ? void 0 : _d.fontSizes) {
            yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
            for (const fontSize of theme.settings.typography.fontSizes) {
              let size = parseFloat(fontSize.size);
              if (fontSize.size.endsWith("rem")) {
                size = parseFloat(fontSize.size) * 16;
              } else if (fontSize.size.endsWith("px")) {
                size = parseFloat(fontSize.size);
              } else {
                const parsed = parseFloat(fontSize.size);
                if (!isNaN(parsed)) size = parsed;
              }
              if (!isNaN(size)) {
                const styleName = `Typography/${fontSize.name}`;
                let style = figma.getLocalTextStyles().find((s) => s.name === styleName);
                if (!style) {
                  style = figma.createTextStyle();
                  style.name = styleName;
                }
                style.fontSize = size;
              }
            }
            figma.notify(`Imported typography sizes.`);
          }
        });
      }
      function rgbToHex(r, g, b) {
        const toHex = (n) => {
          const hex = Math.round(n * 255).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
      function exportThemeJson() {
        return __async(this, null, function* () {
          var _a, _b;
          const theme = {
            $schema: "https://schemas.wp.org/wp/6.6/theme.json",
            version: 3,
            settings: {
              color: { palette: [] },
              typography: { fontSizes: [] },
              spacing: { spacingSizes: [] }
            }
          };
          const colorCollections = figma.variables.getLocalVariableCollections().filter((c) => c.name.startsWith("Theme Colors"));
          for (const collection of colorCollections) {
            const modeId = (_a = collection.modes[0]) == null ? void 0 : _a.modeId;
            if (modeId) {
              const variables = figma.variables.getLocalVariables().filter((v) => v.variableCollectionId === collection.id);
              for (const variable of variables) {
                const value = variable.valuesByMode[modeId];
                if (value && typeof value === "object" && "r" in value) {
                  const slug = variable.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  if (!theme.settings.color.palette.some((c) => c.slug === slug)) {
                    theme.settings.color.palette.push({
                      slug,
                      name: variable.name,
                      color: rgbToHex(value.r, value.g, value.b)
                    });
                  }
                }
              }
            }
          }
          const spacingCollections = figma.variables.getLocalVariableCollections().filter((c) => c.name.startsWith("Theme Spacing"));
          for (const collection of spacingCollections) {
            const modeId = (_b = collection.modes[0]) == null ? void 0 : _b.modeId;
            if (modeId) {
              const variables = figma.variables.getLocalVariables().filter((v) => v.variableCollectionId === collection.id);
              for (const variable of variables) {
                const value = variable.valuesByMode[modeId];
                if (typeof value === "number") {
                  const slug = variable.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  if (!theme.settings.spacing.spacingSizes.some((s) => s.slug === slug)) {
                    theme.settings.spacing.spacingSizes.push({
                      slug,
                      name: variable.name,
                      size: `${value}px`
                    });
                  }
                }
              }
            }
          }
          const textStyles = figma.getLocalTextStyles();
          for (const style of textStyles) {
            const displayName = style.name.startsWith("Typography/") ? style.name.replace("Typography/", "") : style.name;
            const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            if (!theme.settings.typography.fontSizes.some((f) => f.slug === slug)) {
              theme.settings.typography.fontSizes.push({
                slug,
                name: displayName,
                size: `${style.fontSize}px`
              });
            }
          }
          if (theme.settings.spacing.spacingSizes.length === 0) {
            delete theme.settings.spacing;
          }
          figma.ui.postMessage({ type: "export-theme-json-result", payload: theme });
          figma.notify("Theme exported! Check UI to download.");
        });
      }
      function getDefaultTemplate(version) {
        const baseColors = [
          { name: "Base", slug: "base", color: "#FFFFFF" },
          { name: "Contrast", slug: "contrast", color: "#111111" },
          { name: "Primary", slug: "primary", color: "#0073aa" },
          { name: "Secondary", slug: "secondary", color: "#23282d" },
          { name: "Accent", slug: "accent", color: "#cd2653" }
        ];
        const baseFontSizes = [
          { name: "Small", slug: "small", size: "14px" },
          { name: "Medium", slug: "medium", size: "16px" },
          { name: "Large", slug: "large", size: "20px" },
          { name: "X-Large", slug: "x-large", size: "28px" },
          { name: "XX-Large", slug: "xx-large", size: "36px" }
        ];
        const baseSpacing = [
          { name: "Tiny", slug: "20", size: "10px" },
          { name: "X-Small", slug: "30", size: "20px" },
          { name: "Small", slug: "40", size: "30px" },
          { name: "Regular", slug: "50", size: "40px" },
          { name: "Large", slug: "60", size: "60px" },
          { name: "X-Large", slug: "70", size: "80px" },
          { name: "XX-Large", slug: "80", size: "100px" }
        ];
        if (version === 1) {
          return {
            colors: baseColors.slice(0, 3),
            fontSizes: baseFontSizes.slice(0, 3),
            spacing: []
          };
        } else if (version === 2) {
          return {
            colors: baseColors,
            fontSizes: baseFontSizes,
            spacing: baseSpacing.slice(0, 5)
          };
        } else {
          return {
            colors: [
              { name: "Base", slug: "base", color: "#FFFFFF" },
              { name: "Contrast", slug: "contrast", color: "#111111" },
              { name: "Accent 1", slug: "accent-1", color: "#FFEE58" },
              { name: "Accent 2", slug: "accent-2", color: "#F6CFF4" },
              { name: "Accent 3", slug: "accent-3", color: "#503AA8" },
              { name: "Accent 4", slug: "accent-4", color: "#686868" },
              { name: "Accent 5", slug: "accent-5", color: "#FBFAF3" }
            ],
            fontSizes: baseFontSizes,
            spacing: baseSpacing
          };
        }
      }
      function generateThemeJson(version) {
        return __async(this, null, function* () {
          const template = getDefaultTemplate(version);
          let createdColors = 0;
          let createdFontSizes = 0;
          let createdSpacing = 0;
          const colorCollectionName = `Theme Colors (v${version})`;
          let colorCollection = figma.variables.getLocalVariableCollections().find((c) => c.name === colorCollectionName);
          if (!colorCollection) {
            colorCollection = figma.variables.createVariableCollection(colorCollectionName);
          }
          for (const colorItem of template.colors) {
            const rgb = hexToRgb(colorItem.color);
            if (rgb) {
              let variable = figma.variables.getLocalVariables().find(
                (v) => v.variableCollectionId === colorCollection.id && v.name === colorItem.name
              );
              if (!variable) {
                variable = figma.variables.createVariable(colorItem.name, colorCollection.id, "COLOR");
                createdColors++;
              }
              const modes = colorCollection.modes;
              if (modes.length > 0) {
                variable.setValueForMode(modes[0].modeId, rgb);
              }
            }
          }
          if (template.spacing.length > 0) {
            const spacingCollectionName = `Theme Spacing (v${version})`;
            let spacingCollection = figma.variables.getLocalVariableCollections().find((c) => c.name === spacingCollectionName);
            if (!spacingCollection) {
              spacingCollection = figma.variables.createVariableCollection(spacingCollectionName);
            }
            for (const spacingItem of template.spacing) {
              let size = parseFloat(spacingItem.size);
              let variable = figma.variables.getLocalVariables().find(
                (v) => v.variableCollectionId === spacingCollection.id && v.name === spacingItem.name
              );
              if (!variable) {
                variable = figma.variables.createVariable(spacingItem.name, spacingCollection.id, "FLOAT");
                createdSpacing++;
              }
              const modes = spacingCollection.modes;
              if (modes.length > 0) {
                variable.setValueForMode(modes[0].modeId, size);
              }
            }
          }
          yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
          for (const fontSize of template.fontSizes) {
            let size = parseFloat(fontSize.size);
            const styleName = `Typography/${fontSize.name}`;
            let style = figma.getLocalTextStyles().find((s) => s.name === styleName);
            if (!style) {
              style = figma.createTextStyle();
              style.name = styleName;
              createdFontSizes++;
            }
            style.fontSize = size;
          }
          const message = `\u751F\u6210\u5B8C\u4E86\uFF01 \u30AB\u30E9\u30FC: ${createdColors}\u500B, \u30D5\u30A9\u30F3\u30C8: ${createdFontSizes}\u500B, \u30B9\u30DA\u30FC\u30B7\u30F3\u30B0: ${createdSpacing}\u500B`;
          figma.notify(message);
        });
      }
      figma.ui.onmessage = (msg) => __async(null, null, function* () {
        var _a;
        if (msg.type === "import-theme-json") {
          try {
            yield importThemeJson(msg.payload);
            figma.notify("Theme imported successfully!");
          } catch (e) {
            console.error(e);
            figma.notify("Error importing theme: " + e.message);
          }
        } else if (msg.type === "export-theme-json") {
          try {
            yield exportThemeJson();
          } catch (e) {
            console.error(e);
            figma.notify("Error exporting theme: " + e.message);
          }
        } else if (msg.type === "generate-theme-json") {
          try {
            const version = ((_a = msg.payload) == null ? void 0 : _a.version) || 3;
            yield generateThemeJson(version);
          } catch (e) {
            console.error(e);
            figma.notify("Error generating theme: " + e.message);
          }
        }
      });
    }
  });
  require_index();
})();
