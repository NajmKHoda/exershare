import { createContext, useContext } from 'react';
import { ColorValue } from 'react-native';

export interface ThemeColors {
    primary: ColorValue,
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

const defaultThemeColors: ThemeColors = {
    primary: '',
    accent: '',
    background: '',
    backgroundSecondary: '',
    separator: '',

    red: '',
    orange: '',
    yellow: '',
    green: '',
    blue: '',
    purple: '',
    gray: ''
}

const themeColorsContext = createContext<ThemeColors>(defaultThemeColors);
export const ThemeColorsProvider = themeColorsContext.Provider;
export const ThemeColorsConsumer = themeColorsContext.Consumer;
export const useThemeColors = () => useContext(themeColorsContext);
export function useResolvedStyles<T>(styles: (colors: ThemeColors) => T): T {
    const colors = useThemeColors();
    return styles(colors);
}