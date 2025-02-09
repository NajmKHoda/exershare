import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, TextInput, View } from 'react-native';

interface Props {
    value?: string,
    onChange?: (value: string) => unknown
}

export default function SearchField({ value, onChange }: Props) {
    const colors = useThemeColors();

    return (
        <View style={ styles.container }>
            <SymbolView name='magnifyingglass' size={ 24 } weight='semibold' />
            <TextInput
                style={{ color: colors.primary, ...styles.input }}
                placeholder='Search...'
                value={ value }
                onChangeText={ onChange }
                />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'stretch',
        paddingBottom: 6,
        gap: 5,
        borderBottomWidth: 3,
        overflow: 'hidden'
    },

    input: {
        fontSize: 20,
        lineHeight: 20,
        padding: 0
    }
})