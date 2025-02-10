import { useState } from 'react';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, TextInput, View } from 'react-native';

interface Props {
    value?: string,
    onChange?: (value: string) => unknown
}

export default function SearchField({ value, onChange }: Props) {
    const colors = useThemeColors();
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[
            styles.container,
            { borderBottomColor: isFocused ? colors.accent : colors.primary }
        ]}>
            <SymbolView
                name='magnifyingglass'
                size={ 24 }
                weight='semibold'
                tintColor={ (isFocused ? colors.accent : colors.primary) as string }
                />
            <TextInput
                style={{ color: colors.primary, ...styles.input }}
                placeholder='Search...'
                value={ value }
                onChangeText={ onChange }
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 5,
        paddingBottom: 5,
        borderBottomWidth: 3,
        overflow: 'hidden'
    },

    input: {
        fontSize: 20,
        lineHeight: 24,
        paddingVertical: 0
    }
});