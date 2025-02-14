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

    return (
        <Pressable style={ styles.container } onPress={ onPress }>
            { symbol && <SymbolView name={ symbol } size={ symbolSize ?? 16 } tintColor={ colors.accent as string } /> }
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
        alignItems: 'center',
        gap: 5
    }
})