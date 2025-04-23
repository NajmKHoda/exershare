import { ThemeColors, useResolvedStyles, useThemeColors } from '@/lib/hooks/useThemeColors';
import { StyleSheet, View } from 'react-native';

export default function Separator() {
    const resolvedStyles = useResolvedStyles(styles);
    return <View style={resolvedStyles.separator}/>;
}

const styles = (colors: ThemeColors) => StyleSheet.create({
    separator: {
        height: 3,
        alignSelf: 'stretch',
        backgroundColor: colors.separator
    }
});