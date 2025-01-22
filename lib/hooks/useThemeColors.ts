import { createContext, useContext } from 'react';
import { ColorValue } from 'react-native';

export interface ThemeColors {
    primary: ColorValue,
    accent: ColorValue,
    background: ColorValue,
    backgroundSecondary: ColorValue
}

const defaultThemeColors: ThemeColors = {
    primary: '',
    accent: '',
    background: '',
    backgroundSecondary: ''
}

const themeColorsContext = createContext<ThemeColors>(defaultThemeColors);
export const ThemeColorsProvider = themeColorsContext.Provider;
export const ThemeColorsConsumer = themeColorsContext.Consumer;
export const useThemeColors = () => useContext(themeColorsContext);