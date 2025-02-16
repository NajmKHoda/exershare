import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '@/lib/components/theme/ThemeText';
import { SFSymbol, SymbolView } from 'expo-symbols';

interface Props {
    label: string,
    symbolName: SFSymbol,
    symbolColor?: string,
    symbolSize?: number,
    onPress?: () => unknown
}

export default function ListItem({ label, symbolName, symbolColor, symbolSize, onPress }: Props) {
    const colors = useThemeColors();

    return (
        <Pressable
            style={{
                backgroundColor: colors.backgroundSecondary,
                ...styles.container
            }}
            onPress={ onPress }
        >
            <ThemeText style={ styles.label }>{ label }</ThemeText>
            <SymbolView
                name={ symbolName }
                size={ symbolSize ?? 24 }
                tintColor={ symbolColor ?? colors.primary as string } />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15
    },

    label: {
        fontSize: 20,
        lineHeight: 20
    }
});