import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { SFSymbol, SymbolView } from 'expo-symbols';
import { ColorValue, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
    symbolName: SFSymbol,
    label: string
}

export default function LabelButton({ symbolName, label }: Props) {
    const themeColors = useThemeColors();

    return (
        <Pressable style={{ backgroundColor: themeColors.accent, ...styles.container }}>
            <SymbolView tintColor='#ffffff' name={ symbolName } />
            <Text style={ styles.label }>{ label }</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        gap: 5
    },

    label: {
        fontSize: 16,
        color: '#ffffff'
    }
});