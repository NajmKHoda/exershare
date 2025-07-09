import { ThemeColors, useResolvedStyles } from '@/lib/hooks/useThemeColors';
import { StyleSheet, TextProps, Text as RNText, TextStyle } from 'react-native';

const weightMap: Record<string, string> = {
    '100': 'Inter_100Thin',
    'thin': 'Inter_100Thin',
    '200': 'Inter_200ExtraLight',
    'ultralight': 'Inter_200ExtraLight',
    '400': 'Inter_400Regular',
    'normal': 'Inter_400Regular',
    'regular': 'Inter_400Regular',
    '600': 'Inter_600SemiBold',
    'semibold': 'Inter_600SemiBold',
    '700': 'Inter_700Bold',
    'bold': 'Inter_700Bold'
};

export default function Text({ children, style, ...props }: TextProps) {
    const resolvedStyles = useResolvedStyles(styles);
    const combinedStyles = StyleSheet.flatten([resolvedStyles.builtin, style]) as TextStyle;

    if (combinedStyles.fontWeight) {
        combinedStyles.fontFamily = weightMap[combinedStyles.fontWeight] ?? 'Inter_400Regular';
    }

    return <RNText style={combinedStyles} { ...props }>{ children }</RNText>
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    builtin: {
        color: colors.primary,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    }
});