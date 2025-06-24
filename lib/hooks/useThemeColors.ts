import { createContext, useContext } from 'react';
import { ColorValue } from 'react-native';

export interface ThemeColors {
    primary: ColorValue,
    secondary: ColorValue,
    accent: ColorValue,
    background: ColorValue,
    backgroundSecondary: ColorValue,
    separator: ColorValue,

    // Standard colors
    red: ColorValue,
    orange: ColorValue,
    yellow: ColorValue,
    green: ColorValue,
    blue: ColorValue,
    purple: ColorValue,
    gray: ColorValue
}

const themeColorsContext = createContext<ThemeColors | null>(null);

export const ThemeColorsProvider = themeColorsContext.Provider;
export const ThemeColorsConsumer = themeColorsContext.Consumer;
export function useThemeColors() {
    const context = useContext(themeColorsContext);
    if (!context) {
        throw new Error('useThemeColors must be used within a ThemeColorsProvider');
    }
    return context;
}

export function useResolvedStyles<T>(styles: (colors: ThemeColors) => T): T {
    const colors = useThemeColors();
    return styles(colors);
}