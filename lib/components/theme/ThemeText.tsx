import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { StyleSheet, TextProps, Text, TextStyle, StyleProp } from 'react-native';

export default function ThemeText({ children, style, ...props }: TextProps) {
    const themeColors = useThemeColors();
    const resolvedStyle: StyleProp<TextStyle> = StyleSheet.compose({
        color: themeColors.primary,
        fontSize: 16
    }, style);

    return <Text style={ resolvedStyle } { ...props }>{ children }</Text>
}