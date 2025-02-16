import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleProp, StyleSheet, TextStyle } from 'react-native';
import ThemeText from '../theme/ThemeText';
import { SFSymbol, SymbolView } from 'expo-symbols';

interface Props {
    onPress?: () => unknown,
    label: string,
    symbol?: SFSymbol,
    symbolSize?: number,
    style?: StyleProp<TextStyle>
}

export default function TextButton({ onPress, label, symbol, style, symbolSize }: Props) {
    const colors = useThemeColors();

    const flattenedStyles = StyleSheet.flatten(style);
    const textColor = flattenedStyles?.color || colors.accent;
    const fontSize = flattenedStyles?.fontSize || symbolSize || 16;

    return (
        <Pressable style={ styles.container } onPress={ onPress }>
            { symbol && <SymbolView name={ symbol } size={ fontSize } tintColor={ textColor as string } /> }
            <ThemeText style={[ {
                color: colors.accent,
                fontWeight: 'bold'
            }, style ]}
            >
                { label }
            </ThemeText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    }
})